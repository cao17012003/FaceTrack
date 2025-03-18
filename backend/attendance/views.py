from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
import pickle
import datetime
import random
import logging
import os
import io
from PIL import Image
import cv2
import numpy as np
from datetime import timedelta
import face_recognition

from .models import Attendance
from .serializers import AttendanceSerializer, AttendanceDetailSerializer, AttendanceCreateSerializer
from employees.models import Employee, FaceData
from employees.anti_spoofing import LivenessDetector

logger = logging.getLogger(__name__)

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AttendanceDetailSerializer
        elif self.action == 'check_in_out':
            return AttendanceCreateSerializer
        return AttendanceSerializer
    
    def get_queryset(self):
        queryset = Attendance.objects.all().order_by('-check_in_time')
        
        # Nếu người dùng không phải admin, chỉ hiển thị dữ liệu của họ
        user = self.request.user
        if not user.is_staff and not user.is_superuser:
            try:
                employee = Employee.objects.get(user=user)
                queryset = queryset.filter(employee=employee)
            except Employee.DoesNotExist:
                # Nếu không tìm thấy nhân viên, trả về queryset rỗng
                return Attendance.objects.none()
        
        # Lọc theo nhân viên
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            # Nếu không phải admin và employee_id khác nhân viên hiện tại, trả về rỗng
            if not user.is_staff and not user.is_superuser:
                try:
                    current_employee = Employee.objects.get(user=user)
                    if str(current_employee.id) != employee_id:
                        return Attendance.objects.none()
                except Employee.DoesNotExist:
                    return Attendance.objects.none()
            queryset = queryset.filter(employee_id=employee_id)
        
        # Lọc theo phòng ban
        department_id = self.request.query_params.get('department')
        if department_id:
            queryset = queryset.filter(employee__department_id=department_id)
        
        # Lọc theo ngày
        date_str = self.request.query_params.get('date')
        if date_str:
            try:
                date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
                queryset = queryset.filter(check_in_time__date=date)
            except ValueError:
                pass
        
        # Lọc theo khoảng thời gian
        from_date = self.request.query_params.get('from_date')
        to_date = self.request.query_params.get('to_date')
        if from_date:
            try:
                from_date = datetime.datetime.strptime(from_date, '%Y-%m-%d').date()
                queryset = queryset.filter(check_in_time__date__gte=from_date)
            except ValueError:
                pass
        if to_date:
            try:
                to_date = datetime.datetime.strptime(to_date, '%Y-%m-%d').date()
                queryset = queryset.filter(check_in_time__date__lte=to_date)
            except ValueError:
                pass
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def check_in_out(self, request):
        """Điểm danh vào/ra dựa trên nhận diện khuôn mặt kết hợp dữ liệu đăng ký và dữ liệu check-in gần đây"""
        if 'image' not in request.FILES:
            return Response(
                {'error': 'Không tìm thấy hình ảnh trong yêu cầu'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        
        try:
            logger.info("Bắt đầu quá trình điểm danh")
            
            # Đọc ảnh từ request
            image_stream = io.BytesIO(image_file.read())
            
            # Lưu lại stream để lưu vào DB sau này
            image_for_db = image_file
            
            # Chuyển đổi sang định dạng numpy array
            pil_image = Image.open(image_stream)
            img_array = np.array(pil_image)
            
            # Phát hiện khuôn mặt sử dụng face_recognition
            face_locations = face_recognition.face_locations(img_array)
            
            logger.info(f"Số khuôn mặt phát hiện được: {len(face_locations)}")
            
            if len(face_locations) == 0:
                return Response(
                    {'error': 'Không phát hiện khuôn mặt trong hình ảnh. Vui lòng thử lại với ánh sáng tốt hơn và đảm bảo khuôn mặt nhìn rõ vào camera.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if len(face_locations) > 1:
                return Response(
                    {'error': 'Phát hiện nhiều khuôn mặt trong hình ảnh. Vui lòng chỉ đưa một khuôn mặt vào khung hình.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Lấy vùng khuôn mặt phát hiện được (top, right, bottom, left)
            top, right, bottom, left = face_locations[0]
            face_img = img_array[top:bottom, left:right]
            
            # Kiểm tra khuôn mặt thật/giả
            liveness_detector = LivenessDetector()
            is_real_face, liveness_score, liveness_details = liveness_detector.check_liveness(face_img)
            
            logger.info(f"Kết quả kiểm tra khuôn mặt thật/giả: {is_real_face}, điểm: {liveness_score:.2f}")
            
            # Kiểm tra nếu có sự giả mạo
            if not is_real_face:
                return Response(
                    {
                        'error': 'Phát hiện khuôn mặt không phải khuôn mặt thật. Vui lòng sử dụng khuôn mặt thật để điểm danh.',
                        'liveness_score': liveness_score,
                        'details': liveness_details
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Trích xuất đặc trưng khuôn mặt từ ảnh đầu vào
            unknown_face_encodings = face_recognition.face_encodings(img_array, face_locations)
            
            if len(unknown_face_encodings) == 0:
                return Response(
                    {'error': 'Không thể trích xuất đặc trưng khuôn mặt. Vui lòng thử lại với ảnh chất lượng tốt hơn.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            unknown_face_encoding = unknown_face_encodings[0]
            
            # Lấy tất cả dữ liệu khuôn mặt đã đăng ký
            all_face_data = FaceData.objects.all()
            
            if not all_face_data:
                return Response(
                    {'error': 'Không có dữ liệu khuôn mặt nào trong hệ thống'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            logger.info(f"Số lượng dữ liệu khuôn mặt trong CSDL: {all_face_data.count()}")
            
            # Khởi tạo dictionary lưu thông tin tốt nhất cho mỗi nhân viên
            # Cấu trúc: {employee_id: {'match_score': float, 'face_data': FaceData, 'recent_score': float}}
            best_matches_by_employee = {}
            
            # So sánh khuôn mặt đầu vào với tất cả khuôn mặt đã đăng ký
            for face_data in all_face_data:
                try:
                    # Giải mã dữ liệu khuôn mặt
                    stored_data = pickle.loads(face_data.face_encoding)
                    
                    # Kiểm tra cấu trúc dữ liệu
                    if not isinstance(stored_data, dict):
                        logger.warning(f"Dữ liệu khuôn mặt không hợp lệ cho ID: {face_data.id}")
                        continue
                    
                    # Kiểm tra định dạng dữ liệu cũ và mới
                    if 'encoding' in stored_data:
                        # Định dạng mới - sử dụng face_recognition
                        stored_face_encoding = stored_data['encoding']
                        employee_id = stored_data.get('employee_id')
                        
                        # Tính khoảng cách Euclidean giữa hai vector đặc trưng
                        face_distance = face_recognition.face_distance([stored_face_encoding], unknown_face_encoding)[0]
                        match_score = 1.0 - face_distance  # Chuyển đổi khoảng cách thành điểm số (0.0-1.0)
                        
                        logger.info(f"Khoảng cách với khuôn mặt ID {face_data.id} (nhân viên {employee_id}): {face_distance}")
                        
                        # Cập nhật best match cho nhân viên này
                        if employee_id not in best_matches_by_employee or match_score > best_matches_by_employee[employee_id]['match_score']:
                            best_matches_by_employee[employee_id] = {
                                'match_score': match_score,
                                'face_data': face_data,
                                'recent_score': 0.0  # Khởi tạo giá trị cho điểm check-in gần đây
                            }
                    
                    elif 'face_img' in stored_data:
                        # Định dạng cũ - bỏ qua
                        logger.info(f"Bỏ qua dữ liệu định dạng cũ cho nhân viên ID: {stored_data.get('employee_id')}")
                        continue
                    else:
                        logger.warning(f"Định dạng dữ liệu không xác định cho ID: {face_data.id}")
                        continue
                    
                except Exception as e:
                    logger.error(f"Lỗi khi so sánh khuôn mặt: {str(e)}")
                    continue
            
            # Lấy dữ liệu điểm danh gần đây để cải thiện nhận diện
            now = timezone.now()
            one_week_ago = now - timedelta(days=7)
            
            # Lấy điểm danh trong 7 ngày qua
            recent_attendances = Attendance.objects.filter(
                check_in_time__gte=one_week_ago
            ).order_by('-check_in_time')
            
            logger.info(f"Số lượng điểm danh gần đây: {recent_attendances.count()}")
            
            # Lấy unique employee_ids từ best_matches_by_employee 
            potential_employee_ids = best_matches_by_employee.keys()
            
            if potential_employee_ids:
                # Chỉ xem xét điểm danh của những nhân viên có khả năng khớp
                recent_attendances = recent_attendances.filter(employee_id__in=potential_employee_ids)
                
                for attendance in recent_attendances:
                    employee_id = attendance.employee_id
                    
                    # Kiểm tra nếu nhân viên này đã có trong danh sách tiềm năng
                    if employee_id in best_matches_by_employee:
                        # Hệ số giảm theo thời gian (điểm danh càng cũ càng ít quan trọng)
                        days_ago = (now - attendance.check_in_time).days
                        time_factor = max(0.5, 1.0 - (days_ago / 14.0))  # Tối thiểu 0.5, giảm dần theo thời gian
                        
                        # Thêm điểm cộng cho nhân viên đã check-in gần đây (điểm càng cao càng có khả năng là người đó)
                        # Ghi chú: Đây là sự tích lũy, mỗi điểm danh gần đây sẽ tăng điểm
                        best_matches_by_employee[employee_id]['recent_score'] += 0.05 * time_factor
                        
                        logger.info(f"Thêm {0.05 * time_factor:.3f} điểm cho nhân viên {employee_id} do check-in cách đây {days_ago} ngày")
            
            # Tính điểm kết hợp và tìm nhân viên tốt nhất
            best_employee_id = None
            best_combined_score = 0.0
            face_match_weight = 0.8  # Trọng số cho điểm số khớp khuôn mặt
            recent_activity_weight = 0.2  # Trọng số cho điểm hoạt động gần đây
            
            for employee_id, data in best_matches_by_employee.items():
                # Kết hợp điểm khớp khuôn mặt và điểm hoạt động gần đây
                combined_score = (
                    face_match_weight * data['match_score'] + 
                    recent_activity_weight * min(1.0, data['recent_score'])  # Giới hạn tối đa 1.0
                )
                
                logger.info(f"Nhân viên {employee_id}: Điểm khuôn mặt = {data['match_score']:.3f}, "
                           f"Điểm hoạt động gần đây = {min(1.0, data['recent_score']):.3f}, "
                           f"Điểm kết hợp = {combined_score:.3f}")
                
                if combined_score > best_combined_score:
                    best_combined_score = combined_score
                    best_employee_id = employee_id
            
            # Ngưỡng điểm kết hợp (có thể điều chỉnh)
            combined_threshold = 0.55  
            
            logger.info(f"Nhân viên tốt nhất: {best_employee_id}, Điểm kết hợp: {best_combined_score:.3f}, Ngưỡng: {combined_threshold}")
            
            if best_employee_id is not None and best_combined_score >= combined_threshold:
                # Lấy face_data từ best_match
                best_face_data = best_matches_by_employee[best_employee_id]['face_data']
                employee = best_face_data.employee
                
                logger.info(f"Nhận diện thành công: {employee.first_name} {employee.last_name}")
                
                # Kiểm tra trạng thái điểm danh hiện tại
                today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                
                # Tìm điểm danh của nhân viên này trong ngày hiện tại
                existing_attendance = Attendance.objects.filter(
                    employee=employee,
                    check_in_time__gte=today_start
                ).order_by('-check_in_time').first()
                
                if existing_attendance and existing_attendance.check_out_time is None:
                    # Điểm danh ra nếu đã điểm danh vào
                    existing_attendance.check_out_time = now
                    
                    # Lưu hình ảnh check-out
                    existing_attendance.check_out_image.save(
                        f"checkout_{employee.employee_id}_{now.strftime('%Y%m%d_%H%M%S')}.jpg",
                        image_for_db,
                        save=False
                    )
                    
                    existing_attendance.save()
                    
                    # Tính toán thời gian làm việc
                    work_duration = existing_attendance.check_out_time - existing_attendance.check_in_time
                    
                    return Response({
                        'success': True,
                        'action': 'check_out',
                        'message': f'Điểm danh ra thành công cho {employee.first_name} {employee.last_name}',
                        'employee': {
                            'id': employee.id,
                            'employee_id': employee.employee_id,
                            'name': f"{employee.first_name} {employee.last_name}",
                        },
                        'check_out_time': existing_attendance.check_out_time,
                        'worked_time': str(work_duration),
                        'liveness_score': liveness_score,
                        'match_score': best_combined_score
                    })
                else:
                    # Điểm danh vào nếu chưa có hoặc đã điểm danh ra
                    # Lấy ngày hiện tại ở múi giờ địa phương
                    today = timezone.localdate()
                    
                    # Cố gắng tìm điểm danh hiện tại hoặc tạo mới
                    attendance, created = Attendance.objects.get_or_create(
                        employee=employee,
                        attendance_date=today,
                        defaults={'check_in_time': now}
                    )
                    
                    # Nếu tìm thấy bản ghi cũ (không tạo mới) thì cập nhật thời gian check-in
                    if not created:
                        attendance.check_in_time = now
                        attendance.check_out_time = None  # Reset check-out time
                    
                    # Lưu hình ảnh check-in
                    attendance.check_in_image.save(
                        f"checkin_{employee.employee_id}_{now.strftime('%Y%m%d_%H%M%S')}.jpg",
                        image_for_db,
                        save=False
                    )
                    
                    attendance.save()
                    
                    return Response({
                        'success': True,
                        'action': 'check_in',
                        'message': f'Điểm danh vào thành công cho {employee.first_name} {employee.last_name}',
                        'employee': {
                            'id': employee.id,
                            'employee_id': employee.employee_id,
                            'name': f"{employee.first_name} {employee.last_name}",
                        },
                        'check_in_time': attendance.check_in_time,
                        'liveness_score': liveness_score,
                        'match_score': best_combined_score
                    })
            else:
                logger.warning(f"Không tìm thấy khuôn mặt phù hợp trong CSDL hoặc điểm tương đồng quá thấp: {best_combined_score}")
                return Response(
                    {'error': 'Không tìm thấy khuôn mặt phù hợp trong cơ sở dữ liệu'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        except Exception as e:
            import traceback
            logger.error(f"Lỗi khi điểm danh: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {'error': f'Lỗi hệ thống: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def report(self, request):
        """Tạo báo cáo chấm công"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        employee_id = request.query_params.get('employee_id')
        department_id = request.query_params.get('department')
        
        queryset = self.get_queryset()
        
        # Log thông tin để debug
        logger.info(f"Báo cáo chấm công: start_date={start_date}, end_date={end_date}, employee_id={employee_id}, department_id={department_id}")
        
        # Lọc theo ngày
        if start_date and end_date:
            try:
                start = datetime.datetime.strptime(start_date, '%Y-%m-%d').date()
                end = datetime.datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(attendance_date__range=[start, end])
                logger.info(f"Lọc theo ngày: {start} đến {end}")
            except ValueError as e:
                logger.error(f"Lỗi định dạng ngày: {e}")
                return Response(
                    {'error': 'Định dạng ngày không hợp lệ. Sử dụng định dạng YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Lọc theo nhân viên ID
        if employee_id:
            try:
                # Tìm nhân viên theo employee_id (không phải id)
                employee = Employee.objects.filter(employee_id=employee_id).first()
                if employee:
                    queryset = queryset.filter(employee=employee)
                    logger.info(f"Lọc theo nhân viên: employee_id={employee_id}, employee.id={employee.id}")
                else:
                    logger.warning(f"Không tìm thấy nhân viên với employee_id={employee_id}")
            except Exception as e:
                logger.error(f"Lỗi khi lọc theo nhân viên: {e}")
        
        # Lọc theo phòng ban
        if department_id:
            try:
                queryset = queryset.filter(employee__department_id=department_id)
                logger.info(f"Lọc theo phòng ban: department_id={department_id}")
            except Exception as e:
                logger.error(f"Lỗi khi lọc theo phòng ban: {e}")
        
        # Log số lượng kết quả
        logger.info(f"Tổng số kết quả: {queryset.count()}")
        
        serializer = AttendanceSerializer(queryset, many=True)
        
        return Response({
            'total_records': queryset.count(),
            'data': serializer.data
        })
        
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Lấy danh sách chấm công hôm nay"""
        today = timezone.now().date()
        queryset = self.get_queryset().filter(attendance_date=today)
        serializer = AttendanceSerializer(queryset, many=True)
        
        return Response({
            'date': today,
            'total': queryset.count(),
            'data': serializer.data
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Lấy thống kê điểm danh cho dashboard"""
        try:
            # Lấy ngày hiện tại
            today = timezone.localdate()
            
            # Tổng số điểm danh hôm nay
            today_checkins = Attendance.objects.filter(check_in_time__date=today).count()
            
            # Số nhân viên đi muộn và về sớm đã bị xóa khỏi model
            # Chúng ta có thể thay bằng thống kê khác, ví dụ:
            # Số nhân viên đã check-out
            checked_out = Attendance.objects.filter(
                check_in_time__date=today,
                check_out_time__isnull=False
            ).count()
            
            # Số nhân viên đang làm việc (đã check-in nhưng chưa check-out)
            working = Attendance.objects.filter(
                check_in_time__date=today,
                check_out_time__isnull=True
            ).count()
            
            # Tổng số nhân viên
            total_employees = Employee.objects.filter(is_active=True).count()
            
            # Tỷ lệ điểm danh hôm nay (nếu có nhân viên)
            attendance_rate = (today_checkins / total_employees * 100) if total_employees > 0 else 0
            
            return Response({
                'today_checkins': today_checkins,
                'checked_out': checked_out,
                'working': working,
                'total_employees': total_employees,
                'attendance_rate': round(attendance_rate, 2)
            })
        except Exception as e:
            logger.error(f"Lỗi khi lấy thống kê điểm danh: {str(e)}")
            return Response(
                {'error': f'Lỗi hệ thống: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def weekly_stats(self, request):
        """Lấy thống kê điểm danh theo tuần cho biểu đồ"""
        try:
            # Xác định ngày đầu tuần và cuối tuần
            today = timezone.localdate()
            start_of_week = today - timedelta(days=today.weekday())
            end_of_week = start_of_week + timedelta(days=6)
            
            # Tạo danh sách ngày trong tuần
            days = []
            day_labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
            
            # Lấy tổng số nhân viên
            total_employees = Employee.objects.filter(is_active=True).count()
            
            # Tính toán thống kê cho từng ngày
            for i in range(7):
                current_date = start_of_week + timedelta(days=i)
                
                # Chỉ tính đến ngày hiện tại
                if current_date > today:
                    days.append({
                        'day': day_labels[i],
                        'date': current_date.strftime('%Y-%m-%d'),
                        'present': 0,
                        'absent': total_employees,
                        'total': 0
                    })
                    continue
                
                # Số nhân viên có mặt
                present = Attendance.objects.filter(
                    check_in_time__date=current_date
                ).count()
                
                # Số nhân viên vắng mặt
                absent = max(0, total_employees - present)
                
                days.append({
                    'day': day_labels[i],
                    'date': current_date.strftime('%Y-%m-%d'),
                    'present': present,
                    'absent': absent,
                    'total': present
                })
            
            return Response(days)
            
        except Exception as e:
            logger.error(f"Lỗi khi lấy thống kê điểm danh theo tuần: {str(e)}")
            return Response(
                {'error': f'Lỗi hệ thống: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
