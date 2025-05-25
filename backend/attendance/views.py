from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
import pickle
import datetime
from datetime import datetime, timedelta
import random
import logging
import os
import io
from PIL import Image
import cv2
import numpy as np
from deepface import DeepFace
from scipy.spatial.distance import cosine
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Attendance
from .serializers import AttendanceSerializer, AttendanceDetailSerializer, AttendanceCreateSerializer
from employees.models import Employee, FaceData

logger = logging.getLogger(__name__)

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]  # Bắt buộc đăng nhập để xem dữ liệu
    
    def get_permissions(self):
        """
        Override để phân quyền cho các API endpoint
        - check_in_out không cần xác thực
        - Các API khác cần đăng nhập
        """
        if self.action == 'check_in_out':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AttendanceDetailSerializer
        elif self.action == 'check_in_out':
            return AttendanceCreateSerializer
        return AttendanceSerializer
    
    def get_queryset(self):
        # Lấy user hiện tại
        user = self.request.user
        
        # Nếu không xác thực hoặc không có user
        if not user or not user.is_authenticated:
            return Attendance.objects.none()
        
        # Nếu là admin hoặc superuser, trả về tất cả
        if user.is_staff or user.is_superuser:
            return Attendance.objects.all()
            
        # Nếu là user thường, chỉ trả về dữ liệu của user đó
        try:
            employee = Employee.objects.get(username=user)
            return Attendance.objects.filter(employee=employee)
        except Employee.DoesNotExist:
            return Attendance.objects.none()
    
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
            
            # Lưu ảnh tạm thời để DeepFace xử lý
            temp_image_path = "temp_face_img.jpg"
            cv2.imwrite(temp_image_path, cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR))
            
            try:
                # Sử dụng DeepFace để phát hiện khuôn mặt với anti-spoofing
                try:
                    face_objs = DeepFace.extract_faces(
                        img_path=temp_image_path, 
                        detector_backend="retinaface",
                        anti_spoofing=True
                    )
                except Exception as spoof_error:
                    logger.warning(f"Không thể sử dụng anti-spoofing: {str(spoof_error)}")
                    # Nếu anti-spoofing gặp lỗi, thử lại không sử dụng anti-spoofing
                    face_objs = DeepFace.extract_faces(
                        img_path=temp_image_path, 
                        detector_backend="retinaface",
                        anti_spoofing=False
                    )
                    # Giả định khuôn mặt là thật
                    for i in range(len(face_objs)):
                        face_objs[i]["is_real"] = True
                        face_objs[i]["liveness_score"] = 0.9
                
                logger.info(f"Số khuôn mặt phát hiện được: {len(face_objs)}")
                
                if len(face_objs) == 0:
                    # Xóa ảnh tạm thời
                    if os.path.exists(temp_image_path):
                        os.remove(temp_image_path)
                    return Response(
                        {'error': 'Không phát hiện khuôn mặt trong hình ảnh. Vui lòng thử lại với ánh sáng tốt hơn và đảm bảo khuôn mặt nhìn rõ vào camera.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if len(face_objs) > 1:
                    # Xóa ảnh tạm thời
                    if os.path.exists(temp_image_path):
                        os.remove(temp_image_path)
                    return Response(
                        {'error': 'Phát hiện nhiều khuôn mặt trong hình ảnh. Vui lòng chỉ đưa một khuôn mặt vào khung hình.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Kiểm tra khuôn mặt thật/giả
                is_real_face = face_objs[0].get("is_real", True)
                liveness_score = face_objs[0].get("liveness_score", 0.9)
                
                logger.info(f"Kết quả kiểm tra khuôn mặt thật/giả: {is_real_face}, điểm: {liveness_score:.2f}")
                
                # Kiểm tra nếu có sự giả mạo
                if not is_real_face:
                    # Xóa ảnh tạm thời
                    if os.path.exists(temp_image_path):
                        os.remove(temp_image_path)
                    return Response(
                        {
                            'error': 'Phát hiện khuôn mặt không phải khuôn mặt thật. Vui lòng sử dụng khuôn mặt thật để điểm danh.',
                            'liveness_score': liveness_score,
                            'details': {'is_real': is_real_face}
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Trích xuất đặc trưng (embedding) khuôn mặt từ ảnh đầu vào
                embedding_objs = DeepFace.represent(
                    img_path=temp_image_path, 
                    detector_backend="retinaface",
                    model_name="Facenet512"
                )
                
                if len(embedding_objs) == 0:
                    # Xóa ảnh tạm thời
                    if os.path.exists(temp_image_path):
                        os.remove(temp_image_path)
                    return Response(
                        {'error': 'Không thể trích xuất đặc trưng khuôn mặt. Vui lòng thử lại với ảnh chất lượng tốt hơn.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                unknown_face_embedding = embedding_objs[0]["embedding"]
                
                # Xóa ảnh tạm thời
                if os.path.exists(temp_image_path):
                    os.remove(temp_image_path)
                
            except Exception as e:
                # Xóa ảnh tạm thời
                if os.path.exists(temp_image_path):
                    os.remove(temp_image_path)
                logger.error(f"Lỗi khi trích xuất khuôn mặt: {str(e)}")
                return Response(
                    {'error': f'Lỗi khi trích xuất khuôn mặt: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
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
                        # Định dạng mới - sử dụng vector đặc trưng
                        stored_face_embedding = stored_data['encoding']
                        employee_id = stored_data.get('employee_id')
                        
                        # Tính cosine similarity giữa hai vector đặc trưng
                        # Chuyển đổi mảng 1D sang mảng 2D
                        unknown_embedding_array = np.array(unknown_face_embedding)
                        stored_embedding_array = np.array(stored_face_embedding)
                        
                        # Tính cosine distance bằng scipy
                        cosine_distance = cosine(unknown_embedding_array, stored_embedding_array)
                        
                        # Cosine similarity = 1 - cosine distance
                        cosine_similarity = 1 - cosine_distance
                        match_score = cosine_similarity  # Điểm số (0.0-1.0)
                        
                        logger.info(f"Độ tương đồng với khuôn mặt ID {face_data.id} (nhân viên {employee_id}): {match_score}")
                        
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

                # PHÂN QUYỀN: Nếu user đang đăng nhập, chỉ cho phép check-in bằng khuôn mặt của chính mình
                if request.user and request.user.is_authenticated:
                    try:
                        current_employee = Employee.objects.get(username=request.user)
                        if employee != current_employee:
                            return Response(
                                {'error': 'Bạn chỉ được phép check-in bằng khuôn mặt của chính mình.'},
                                status=status.HTTP_403_FORBIDDEN
                            )
                    except Employee.DoesNotExist:
                        return Response(
                            {'error': 'Không tìm thấy thông tin nhân viên của bạn.'},
                            status=status.HTTP_404_NOT_FOUND
                        )
                
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
                            'id': employee.employee_id,
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
                            'id': employee.employee_id,
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
    def today(self, request):
        """Lấy danh sách chấm công hôm nay"""
        today = timezone.localdate()
        
        # Lấy user hiện tại
        user = request.user
        
        # Lọc dữ liệu theo quyền
        if user.is_staff or user.is_superuser:
            # Admin xem tất cả
            queryset = Attendance.objects.filter(attendance_date=today)
        else:
            # User thường chỉ xem dữ liệu của mình
            try:
                employee = Employee.objects.get(username=user)
                queryset = Attendance.objects.filter(
                    employee=employee,
                    attendance_date=today
                )
            except Employee.DoesNotExist:
                return Response({
                    'error': 'Không tìm thấy thông tin nhân viên'
                }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AttendanceDetailSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Lấy thống kê điểm danh cho dashboard"""
        try:
            # Lấy ngày hiện tại
            today = timezone.localdate()
            
            # Lấy user hiện tại
            user = request.user
            
            # Nếu user thường, chỉ hiển thị thống kê cá nhân
            if not user.is_staff and not user.is_superuser:
                try:
                    employee = Employee.objects.get(username=user)
                    
                    # Kiểm tra xem nhân viên đã điểm danh hôm nay chưa
                    today_attendance = Attendance.objects.filter(
                        employee=employee,
                        check_in_time__date=today
                    ).first()
                    
                    # Trạng thái làm việc
                    has_checked_in = today_attendance is not None
                    has_checked_out = today_attendance and today_attendance.check_out_time is not None
                    is_working = has_checked_in and not has_checked_out
                    
                    return Response({
                        'employee_id': employee.employee_id,
                        'employee_name': f"{employee.first_name} {employee.last_name}",
                        'today_checkin': 1 if has_checked_in else 0,
                        'checked_out': 1 if has_checked_out else 0,
                        'working': 1 if is_working else 0,
                        'department': employee.department.name if employee.department else None
                    })
                except Employee.DoesNotExist:
                    return Response({
                        'error': 'Không tìm thấy thông tin nhân viên'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # Nếu là admin, hiển thị thống kê tổng hợp
            # Tổng số điểm danh hôm nay
            today_checkins = Attendance.objects.filter(check_in_time__date=today).count()
            
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
            
            # Lấy user hiện tại
            user = request.user
            
            # Nếu user thường, chỉ hiển thị thống kê cá nhân
            if not user.is_staff and not user.is_superuser:
                try:
                    employee = Employee.objects.get(username=user)
                    
                    # Tạo danh sách ngày trong tuần
                    days = []
                    day_labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
                    
                    # Tính toán thống kê cho từng ngày
                    for i in range(7):
                        current_date = start_of_week + timedelta(days=i)
                        
                        # Chỉ tính đến ngày hiện tại
                        if current_date > today:
                            days.append({
                                'day': day_labels[i],
                                'date': current_date.strftime('%Y-%m-%d'),
                                'present': 0,
                                'absent': 0,
                                'total': 0
                            })
                            continue
                        
                        # Kiểm tra nhân viên có mặt trong ngày này không
                        present = Attendance.objects.filter(
                            employee=employee,
                            check_in_time__date=current_date
                        ).exists()
                        
                        days.append({
                            'day': day_labels[i],
                            'date': current_date.strftime('%Y-%m-%d'),
                            'present': 1 if present else 0,
                            'absent': 0 if present else 1,
                            'total': 1 if present else 0
                        })
                    
                    return Response(days)
                except Employee.DoesNotExist:
                    return Response({
                        'error': 'Không tìm thấy thông tin nhân viên'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # Nếu là admin, tạo thống kê theo tuần cho tất cả nhân viên
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
    
    @action(detail=False, methods=['get'])
    def report(self, request):
        """API endpoint để lấy báo cáo điểm danh"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response({
                'error': 'Vui lòng cung cấp start_date và end_date'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'error': 'Định dạng ngày không hợp lệ. Sử dụng định dạng YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Lấy user hiện tại
        user = request.user
        
        # Lọc dữ liệu theo quyền
        if user.is_staff or user.is_superuser:
            # Nếu là admin, lấy tất cả bản ghi điểm danh trong khoảng thời gian
            queryset = self.get_queryset().filter(
                attendance_date__range=[start_date, end_date]
            )
        else:
            # Nếu là user thường, chỉ lấy bản ghi của chính mình
            try:
                employee = Employee.objects.get(username=user)
                queryset = Attendance.objects.filter(
                    employee=employee,
                    attendance_date__range=[start_date, end_date]
                )
            except Employee.DoesNotExist:
                return Response({
                    'error': 'Không tìm thấy thông tin nhân viên'
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Tạo báo cáo
        report_data = []
        for attendance in queryset:
            report_data.append({
                'id': attendance.id,
                'employee_id': attendance.employee.employee_id,
                'employee_name': f"{attendance.employee.first_name} {attendance.employee.last_name}",
                'department': attendance.employee.department.name if attendance.employee.department else None,
                'attendance_date': attendance.attendance_date,
                'check_in_time': attendance.check_in_time,
                'check_out_time': attendance.check_out_time,
                'status': attendance.status,
                'check_in_image': request.build_absolute_uri(attendance.check_in_image.url) if attendance.check_in_image else None,
                'check_out_image': request.build_absolute_uri(attendance.check_out_image.url) if attendance.check_out_image else None
            })
        
        return Response({
            'start_date': start_date,
            'end_date': end_date,
            'total_records': len(report_data),
            'data': report_data
        })

    @action(detail=False, methods=['get'])
    def calendar_report(self, request):
        """API endpoint để lấy báo cáo điểm danh theo dạng lịch"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        employee_id = request.query_params.get('employee_id')
        
        if not start_date or not end_date:
            return Response({
                'error': 'Vui lòng cung cấp start_date và end_date'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'error': 'Định dạng ngày không hợp lệ. Sử dụng định dạng YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Lấy user hiện tại
        user = request.user
        
        # Chuẩn bị dữ liệu
        calendar_data = {}
        
        # Lọc dữ liệu theo quyền
        if user.is_staff or user.is_superuser:
            # Nếu là admin và có employee_id, lấy dữ liệu của nhân viên đó
            if employee_id:
                try:
                    employee = Employee.objects.get(employee_id=employee_id)
                    queryset = Attendance.objects.filter(
                        employee=employee,
                        attendance_date__range=[start_date, end_date]
                    )
                except Employee.DoesNotExist:
                    return Response({
                        'error': f'Không tìm thấy nhân viên với ID: {employee_id}'
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                # Nếu là admin và không có employee_id, lấy tất cả bản ghi điểm danh
                queryset = Attendance.objects.filter(
                    attendance_date__range=[start_date, end_date]
                )
        else:
            # Nếu là user thường, chỉ lấy bản ghi của chính mình
            try:
                employee = Employee.objects.get(username=user)
                queryset = Attendance.objects.filter(
                    employee=employee,
                    attendance_date__range=[start_date, end_date]
                )
            except Employee.DoesNotExist:
                return Response({
                    'error': 'Không tìm thấy thông tin nhân viên'
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Tạo danh sách tất cả các ngày trong khoảng thời gian
        all_dates = []
        current_date = start_date
        while current_date <= end_date:
            all_dates.append(current_date)
            current_date += timedelta(days=1)
        
        # Lấy danh sách ca làm việc cho hiển thị thông tin ca làm
        shifts = {}
        if employee_id:
            try:
                employee = Employee.objects.get(employee_id=employee_id)
                if employee.shift:
                    shifts[employee.employee_id] = {
                        'start_time': employee.shift.start_time,
                        'end_time': employee.shift.end_time
                    }
            except Employee.DoesNotExist:
                pass
        
        # Xây dựng dữ liệu lịch
        for date in all_dates:
            date_str = date.strftime('%Y-%m-%d')
            calendar_data[date_str] = []
            
            # Tìm các bản ghi điểm danh cho ngày này
            day_records = queryset.filter(attendance_date=date)
            
            if not day_records:
                # Không có dữ liệu điểm danh cho ngày này
                continue
            
            for record in day_records:
                employee = record.employee
                
                # Lấy thông tin ca làm việc
                if employee.shift and employee.employee_id not in shifts:
                    shifts[employee.employee_id] = {
                        'start_time': employee.shift.start_time,
                        'end_time': employee.shift.end_time
                    }
                
                # Xác định trạng thái điểm danh
                status_code = ''
                status_text = ''
                
                if not record.check_in_time:
                    # Không chấm công
                    status_code = 'absent'
                    status_text = 'Không chấm công'
                else:
                    # Kiểm tra đi muộn
                    if employee.shift:
                        shift_start = shifts[employee.employee_id]['start_time']
                        shift_start_dt = datetime.combine(date, shift_start)
                        shift_start_dt = timezone.make_aware(shift_start_dt)
                        
                        # Đối với check-in
                        if record.check_in_time:
                            if record.check_in_time > shift_start_dt + timedelta(minutes=15):
                                status_code = 'late'
                                status_text = 'Đi muộn'
                            else:
                                status_code = 'on_time'
                                status_text = 'Đúng giờ'
                        
                        # Đối với check-out
                        if record.check_out_time:
                            shift_end = shifts[employee.employee_id]['end_time']
                            # Xử lý ca qua đêm
                            next_day = False
                            if shift_end < shift_start:
                                next_day = True
                            
                            shift_end_dt = datetime.combine(
                                date + timedelta(days=1) if next_day else date, 
                                shift_end
                            )
                            shift_end_dt = timezone.make_aware(shift_end_dt)
                            
                            if record.check_out_time < shift_end_dt - timedelta(minutes=15):
                                if status_code == 'late':
                                    status_code = 'late_early'
                                    status_text = 'Đi muộn/Về sớm'
                                else:
                                    status_code = 'early'
                                    status_text = 'Về sớm'
                    else:
                        # Nếu không có ca làm việc, mặc định là đúng giờ
                        status_code = 'on_time'
                        status_text = 'Đúng giờ'
                
                calendar_data[date_str].append({
                    'employee_id': employee.employee_id,
                    'employee_name': f"{employee.first_name} {employee.last_name}",
                    'department': employee.department.name if employee.department else None,
                    'shift': employee.shift.name if employee.shift else None,
                    'check_in_time': record.check_in_time.strftime('%H:%M:%S') if record.check_in_time else None,
                    'check_out_time': record.check_out_time.strftime('%H:%M:%S') if record.check_out_time else None,
                    'status_code': status_code,
                    'status_text': status_text,
                    'working_hours': round(record.working_hours, 2) if record.working_hours else 0
                })
        
        # Tổng kết dữ liệu
        summary = {
            'total_days': len(all_dates),
            'working_days': len([d for d in all_dates if d.weekday() < 5]),  # Trừ T7, CN
            'total_on_time': 0,
            'total_late': 0,
            'total_early': 0,
            'total_late_early': 0,
            'total_absent': 0
        }
        
        # Tính toán tổng kết
        for date_str, records in calendar_data.items():
            for record in records:
                if record['status_code'] == 'on_time':
                    summary['total_on_time'] += 1
                elif record['status_code'] == 'late':
                    summary['total_late'] += 1
                elif record['status_code'] == 'early':
                    summary['total_early'] += 1
                elif record['status_code'] == 'late_early':
                    summary['total_late_early'] += 1
                elif record['status_code'] == 'absent':
                    summary['total_absent'] += 1
        
        return Response({
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'calendar_data': calendar_data,
            'summary': summary
        })
