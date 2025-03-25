from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
# import face_recognition
import numpy as np
import pickle
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
import random
import logging
import os
import face_recognition

from .models import Employee, Department, Shift, FaceData, UserProfile
from .serializers import (
    EmployeeSerializer, EmployeeDetailSerializer,
    DepartmentSerializer, ShiftSerializer, FaceDataSerializer,
    UserProfileSerializer
)
from .anti_spoofing import LivenessDetector

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        user_profile = UserProfile.objects.get(user=user)
        
        # Admin có thể xem tất cả user
        if user_profile.is_admin:
            return UserProfile.objects.all()
        
        # User thường chỉ có thể xem thông tin của bản thân
        return UserProfile.objects.filter(user=user)
    
    def create(self, request, *args, **kwargs):
        # Chỉ admin mới có thể tạo user mới
        user_profile = UserProfile.objects.get(user=request.user)
        if not user_profile.is_admin:
            return Response(
                {'error': 'Bạn không có quyền tạo user mới'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        # Chỉ admin mới có thể cập nhật thông tin user
        user_profile = UserProfile.objects.get(user=request.user)
        if not user_profile.is_admin:
            return Response(
                {'error': 'Bạn không có quyền cập nhật thông tin user'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        # Chỉ admin mới có thể xóa user
        user_profile = UserProfile.objects.get(user=request.user)
        if not user_profile.is_admin:
            return Response(
                {'error': 'Bạn không có quyền xóa user'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]  # Cho phép truy cập không cần xác thực

class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    permission_classes = [AllowAny]  # Cho phép truy cập không cần xác thực

class FaceDataViewSet(viewsets.ModelViewSet):
    queryset = FaceData.objects.all()
    serializer_class = FaceDataSerializer
    
    def destroy(self, request, *args, **kwargs):
        face_data = self.get_object()
        employee_name = f"{face_data.employee.first_name} {face_data.employee.last_name}"
        face_data.delete()
        return Response({
            'success': True,
            'message': f'Đã xóa dữ liệu khuôn mặt của {employee_name}'
        })

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [AllowAny]  # Cho phép truy cập không cần xác thực
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EmployeeDetailSerializer
        return EmployeeSerializer
    
    def get_queryset(self):
        # Trả về tất cả nhân viên trong môi trường development
        return Employee.objects.all()
        
        # Code cũ để tham khảo khi cần phân quyền
        # user = self.request.user
        # if not user or not user.is_authenticated:
        #     return Employee.objects.all()
        #     
        # try:
        #     user_profile = UserProfile.objects.get(user=user)
        #     if user_profile.is_admin or user_profile.is_user:
        #         return Employee.objects.all()
        #     try:
        #         employee = Employee.objects.get(user=user)
        #         return Employee.objects.filter(id=employee.id)
        #     except Employee.DoesNotExist:
        #         return Employee.objects.none()
        # except UserProfile.DoesNotExist:
        #     return Employee.objects.all()
    
    def create(self, request, *args, **kwargs):
        # Chỉ admin mới có thể tạo nhân viên mới
        user_profile = UserProfile.objects.get(user=request.user)
        if not user_profile.is_admin:
            return Response(
                {'error': 'Bạn không có quyền tạo nhân viên mới'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        # Chỉ admin mới có thể cập nhật thông tin nhân viên
        user_profile = UserProfile.objects.get(user=request.user)
        if not user_profile.is_admin:
            return Response(
                {'error': 'Bạn không có quyền cập nhật thông tin nhân viên'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        # Chỉ admin mới có thể xóa nhân viên
        user_profile = UserProfile.objects.get(user=request.user)
        if not user_profile.is_admin:
            return Response(
                {'error': 'Bạn không có quyền xóa nhân viên'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def face_data(self, request, pk=None):
        """Lấy dữ liệu khuôn mặt đã đăng ký cho nhân viên và thông tin điểm danh gần đây"""
        employee = self.get_object()
        face_data = FaceData.objects.filter(employee=employee).order_by('-created_at')
        
        # Lấy thông tin điểm danh gần đây cho nhân viên này
        from attendance.models import Attendance
        from django.utils import timezone
        from datetime import timedelta
        
        # Lấy điểm danh trong 7 ngày qua
        one_week_ago = timezone.now() - timedelta(days=7)
        recent_attendances = Attendance.objects.filter(
            employee=employee,
            check_in_time__gte=one_week_ago
        ).order_by('-check_in_time')
        
        # Tạo dữ liệu phản hồi với URL hình ảnh và thông tin điểm danh
        result = []
        for face in face_data:
            # Giải mã dữ liệu để lấy thông tin bổ sung
            try:
                face_encoding_data = pickle.loads(face.face_encoding)
                liveness_score = face_encoding_data.get('liveness_score', 'N/A')
            except:
                liveness_score = 'N/A'
            
            face_info = {
                'id': face.id,
                'employee_id': employee.id,
                'created_at': face.created_at,
                'image': request.build_absolute_uri(face.image.url) if face.image else None,
                'liveness_score': liveness_score,
                # Thêm thông tin về lần sử dụng gần nhất
                'last_used': None,
                'successful_matches': 0
            }
            
            # Tạo summary về việc sử dụng dữ liệu khuôn mặt này
            matched_attendances = []
            for attendance in recent_attendances:
                # Kiểm tra nếu có ảnh check-in hoặc check-out
                if attendance.check_in_image or attendance.check_out_image:
                    # Giả định là khuôn mặt này đã được sử dụng trong điểm danh nếu nó được tạo trước thời gian điểm danh
                    if face.created_at <= attendance.check_in_time:
                        if not face_info['last_used'] or attendance.check_in_time > face_info['last_used']:
                            face_info['last_used'] = attendance.check_in_time
                        
                        face_info['successful_matches'] += 1
                        matched_attendances.append({
                            'date': attendance.attendance_date,
                            'check_in_time': attendance.check_in_time,
                            'check_out_time': attendance.check_out_time,
                            'check_in_image': request.build_absolute_uri(attendance.check_in_image.url) if attendance.check_in_image else None,
                            'check_out_image': request.build_absolute_uri(attendance.check_out_image.url) if attendance.check_out_image else None
                        })
            
            # Giới hạn chỉ hiển thị 3 điểm danh gần nhất nếu có quá nhiều
            face_info['recent_matches'] = matched_attendances[:3] if matched_attendances else []
            
            result.append(face_info)
        
        # Thêm thống kê tổng hợp
        summary = {
            'total_face_data': len(result),
            'total_recent_attendances': recent_attendances.count(),
            'last_attendance': recent_attendances.first().check_in_time if recent_attendances.exists() else None,
            'employee_info': {
                'id': employee.id,
                'employee_id': employee.employee_id,
                'name': f"{employee.first_name} {employee.last_name}",
                'department': employee.department.name if employee.department else None
            }
        }
        
        return Response({
            'face_data': result,
            'summary': summary
        })
    
    @action(detail=True, methods=['post'])
    def register_face(self, request, pk=None):
        """Đăng ký khuôn mặt cho nhân viên sử dụng face_recognition"""
        employee = self.get_object()
        
        if 'image' not in request.FILES:
            return Response(
                {'error': 'Không tìm thấy hình ảnh trong yêu cầu'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        
        try:
            from PIL import Image
            import io
            
            logger = logging.getLogger(__name__)
            logger.info(f"Bắt đầu đăng ký khuôn mặt cho nhân viên {employee.first_name} {employee.last_name}")
            
            # Đọc ảnh từ request
            image_stream = io.BytesIO(image_file.read())
            image_file.seek(0)  # Đặt lại con trỏ file để có thể đọc lại sau
            
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
                    {'error': 'Phát hiện nhiều khuôn mặt trong hình ảnh. Vui lòng cung cấp hình ảnh với chỉ một khuôn mặt.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Lấy vùng khuôn mặt phát hiện được (top, right, bottom, left)
            top, right, bottom, left = face_locations[0]
            face_img = img_array[top:bottom, left:right]
            
            # Kiểm tra khuôn mặt thật/giả
            liveness_detector = LivenessDetector()
            is_real_face, liveness_score, liveness_details = liveness_detector.check_liveness(face_img)
            
            logger.info(f"Kết quả kiểm tra khuôn mặt thật/giả: {is_real_face}, điểm: {liveness_score:.2f}")
            
            # Không cho phép đăng ký với khuôn mặt giả
            if not is_real_face:
                return Response(
                    {
                        'error': 'Phát hiện khuôn mặt không phải khuôn mặt thật. Vui lòng sử dụng khuôn mặt thật để đăng ký.',
                        'liveness_score': liveness_score,
                        'details': liveness_details
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Trích xuất đặc trưng khuôn mặt (128-dimensional face encoding)
            face_encodings = face_recognition.face_encodings(img_array, face_locations)
            
            if len(face_encodings) == 0:
                return Response(
                    {'error': 'Không thể trích xuất đặc trưng khuôn mặt. Vui lòng thử lại với ảnh chất lượng tốt hơn.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Lấy encoding đầu tiên
            face_encoding = face_encodings[0]
            
            # Lưu dữ liệu khuôn mặt
            face_data = FaceData(
                employee=employee,
                face_encoding=pickle.dumps({
                    'encoding': face_encoding,
                    'employee_id': employee.id,
                    'liveness_score': liveness_score
                }),
                image=image_file
            )
            face_data.save()
            
            return Response({
                'success': True,
                'message': f'Đã đăng ký khuôn mặt thành công cho {employee.first_name} {employee.last_name}',
                'face_data_id': face_data.id,
                'liveness_score': liveness_score,
                'liveness_details': liveness_details
            })
        except Exception as e:
            import traceback
            logger.error(f"Lỗi khi đăng ký khuôn mặt: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {'error': f'Lỗi hệ thống: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def recognize_face(self, request):
        """Nhận diện khuôn mặt từ ảnh sử dụng face_recognition"""
        if 'image' not in request.FILES:
            return Response(
                {'error': 'Không tìm thấy hình ảnh trong yêu cầu'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        
        try:
            from PIL import Image
            import io
            
            logger = logging.getLogger(__name__)
            logger.info("Bắt đầu quá trình nhận diện khuôn mặt")
            
            # Đọc ảnh từ request
            image_stream = io.BytesIO(image_file.read())
            
            # Chuyển đổi sang định dạng numpy array
            pil_image = Image.open(image_stream)
            img_array = np.array(pil_image)
            
            # Phát hiện khuôn mặt sử dụng face_recognition
            face_locations = face_recognition.face_locations(img_array)
            
            logger.info(f"Số khuôn mặt phát hiện được: {len(face_locations)}")
            
            if len(face_locations) == 0:
                return Response(
                    {'error': 'Không phát hiện khuôn mặt trong hình ảnh'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if len(face_locations) > 1:
                return Response(
                    {'error': 'Phát hiện nhiều khuôn mặt trong hình ảnh. Vui lòng chỉ đưa một khuôn mặt vào khung hình.'},
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
            
            # Tìm khuôn mặt khớp nhất
            best_match = None
            best_match_distance = float('inf')  # Càng thấp càng tốt với face_distance
            
            # So sánh khuôn mặt đầu vào với tất cả khuôn mặt đã đăng ký
            for face_data in all_face_data:
                try:
                    # Giải mã dữ liệu khuôn mặt
                    stored_data = pickle.loads(face_data.face_encoding)
                    
                    # Kiểm tra cấu trúc dữ liệu
                    if not isinstance(stored_data, dict):
                        logger.warning(f"Dữ liệu khuôn mặt không hợp lệ cho ID: {face_data.id}")
                        continue
                    
                    if 'encoding' not in stored_data:
                        logger.warning(f"Không tìm thấy encoding trong dữ liệu khuôn mặt ID: {face_data.id}")
                        continue
                    
                    # Lấy vector đặc trưng đã lưu
                    stored_face_encoding = stored_data['encoding']
                    
                    # Tính khoảng cách Euclidean giữa hai vector đặc trưng
                    face_distance = face_recognition.face_distance([stored_face_encoding], unknown_face_encoding)[0]
                    
                    logger.info(f"Khoảng cách với khuôn mặt ID {face_data.id}: {face_distance}")
                    
                    # Cập nhật best match (khoảng cách càng nhỏ thì càng giống nhau)
                    if face_distance < best_match_distance:
                        best_match = face_data
                        best_match_distance = face_distance
                    
                except Exception as e:
                    logger.error(f"Lỗi khi so sánh khuôn mặt: {str(e)}")
                    continue
            
            # Ngưỡng khoảng cách mặc định là 0.6
            # Với face_recognition, khoảng cách càng nhỏ thì càng giống nhau
            # Giá trị 0.6 thường được coi là ngưỡng tốt (dưới 0.6 => khớp, trên 0.6 => không khớp)
            threshold = 0.6
            
            logger.info(f"Best match distance: {best_match_distance}, threshold: {threshold}")
            
            if best_match is not None and best_match_distance < threshold:
                employee = best_match.employee
                
                # Lấy thông tin nhân viên
                employee_data = {
                    'id': employee.id,
                    'employee_id': employee.employee_id,
                    'first_name': employee.first_name,
                    'last_name': employee.last_name,
                    'full_name': f"{employee.first_name} {employee.last_name}",
                    'department': employee.department.name if employee.department else None,
                    'position': employee.position,
                    'image': request.build_absolute_uri(employee.image.url) if employee.image else None,
                    'match_confidence': round((1 - best_match_distance) * 100, 2)  # Đổi thành phần trăm độ tin cậy
                }
                
                return Response({
                    'success': True,
                    'message': f'Đã nhận diện thành công: {employee.first_name} {employee.last_name}',
                    'employee': employee_data
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Không tìm thấy khuôn mặt phù hợp trong cơ sở dữ liệu'
                }, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            import traceback
            logger.error(f"Lỗi khi nhận diện khuôn mặt: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {'error': f'Lỗi hệ thống: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
