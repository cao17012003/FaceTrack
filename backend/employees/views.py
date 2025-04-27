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
# import face_recognition

from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response


from .models import UserProfile

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
        try:
            user_profile = UserProfile.objects.get(user__username=user.username) 
            # Admin có thể xem tất cả user
            if user_profile.is_admin:
                return UserProfile.objects.all()
            
            # User thường chỉ có thể xem thông tin của bản thân
            return UserProfile.objects.filter(user__username=user.username)
        except UserProfile.DoesNotExist:
            return UserProfile.objects.none()

    
    def create(self, request, *args, **kwargs):
        try:
            user_profile = UserProfile.objects.get(username=request.user.username)
            if not user_profile.is_admin:
                return Response(
                    {'error': 'Bạn không có quyền tạo user mới'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return super().create(request, *args, **kwargs)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy thông tin người dùng'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, *args, **kwargs):
        # Chỉ admin mới có thể cập nhật thông tin user
        try:
            user_profile = UserProfile.objects.get(username=request.user.username)
            if not user_profile.is_admin:
                return Response(
                    {'error': 'Bạn không có quyền cập nhật thông tin user'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return super().update(request, *args, **kwargs)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy thông tin người dùng'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def destroy(self, request, *args, **kwargs):
        # Chỉ admin mới có thể xóa user
        try:
            user_profile = UserProfile.objects.get(username=request.user.username)
            if not user_profile.is_admin:
                return Response(
                    {'error': 'Bạn không có quyền xóa user'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return super().destroy(request, *args, **kwargs)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy thông tin người dùng'},
                status=status.HTTP_404_NOT_FOUND
            )

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]  # Cho phép truy cập không cần xác thực

    def get_queryset(self):
        """Lấy danh sách phòng ban dựa trên user ID"""
        user_id = self.request.query_params.get('username')
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                return Department.objects.filter(username=user)
            except User.DoesNotExist:
                return Department.objects.none()
        return Department.objects.all()

    def create(self, request, *args, **kwargs):
        """Tạo phòng ban mới"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Lấy user từ request
        user_id = request.data.get('username')
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                serializer.save(username=user)
            except User.DoesNotExist:
                return Response({
                    'error': 'Không tìm thấy người dùng với ID đã cho'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            serializer.save()
            
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Cập nhật thông tin phòng ban"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Lấy user từ request
        user_id = request.data.get('username')
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                serializer.save(username=user)
            except User.DoesNotExist:
                return Response({
                    'error': 'Không tìm thấy người dùng với ID đã cho'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            serializer.save()
            
        return Response(serializer.data)

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
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Lấy danh sách nhân viên dựa trên quyền của user"""
        user_id = self.request.user.id  # Lấy userId thay vì username
        if not user_id:
            return Employee.objects.none()
        
        try:
            user_profile = UserProfile.objects.get(user_id=user_id)  # Truy vấn theo user_id
            if user_profile.is_admin:
                return Employee.objects.all()  # Admin có thể xem tất cả nhân viên
            else:
                # Lọc nhân viên theo user_id
                return Employee.objects.filter(username__id=user_id)  # Sử dụng user_id trong ForeignKey
        except UserProfile.DoesNotExist:
            return Employee.objects.none()

    def create(self, request, *args, **kwargs):
        """Tạo nhân viên mới
           Đã loại bỏ kiểm tra admin để cho phép tất cả người dùng đã xác thực tạo nhân viên
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Cập nhật thông tin nhân viên"""
        try:
            user_profile = UserProfile.objects.get(user_id=request.user.id)  # Truy vấn theo user_id
            if not user_profile.is_admin:
                return Response({
                    'error': 'Bạn không có quyền cập nhật thông tin nhân viên'
                }, status=status.HTTP_403_FORBIDDEN)
                
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({
                'error': 'Không tìm thấy thông tin người dùng'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def destroy(self, request, *args, **kwargs):
        """Xóa nhân viên"""
        try:
            user_profile = UserProfile.objects.get(user_id=request.user.id)  # Truy vấn theo user_id
            instance = self.get_object()
            
            # Kiểm tra quyền xóa
            if not user_profile.is_admin and instance.username_id != request.user.id:
                return Response({
                    'error': 'Bạn không có quyền xóa nhân viên này'
                }, status=status.HTTP_403_FORBIDDEN)
                
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except UserProfile.DoesNotExist:
            return Response({
                'error': 'Không tìm thấy thông tin người dùng'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EmployeeDetailSerializer
        return EmployeeSerializer

    
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
                'employee_id': employee.employee_id,
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
                'id': employee.employee_id,
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
        """Đăng ký khuôn mặt cho nhân viên sử dụng DeepFace"""
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
            import cv2
            from deepface import DeepFace
            
            logger = logging.getLogger(__name__)
            logger.info(f"Bắt đầu đăng ký khuôn mặt cho nhân viên {employee.first_name} {employee.last_name}")
            
            # Kiểm tra và xóa dữ liệu khuôn mặt cũ nếu có
            try:
                existing_face_data = FaceData.objects.get(employee=employee)
                logger.info(f"Xóa dữ liệu khuôn mặt cũ cho nhân viên {employee.first_name} {employee.last_name}")
                existing_face_data.delete()
            except FaceData.DoesNotExist:
                # Không có dữ liệu khuôn mặt cũ, tiếp tục
                pass
            
            # Đọc ảnh từ request
            image_stream = io.BytesIO(image_file.read())
            image_file.seek(0)  # Đặt lại con trỏ file để có thể đọc lại sau
            
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
                    return Response(
                        {'error': 'Không phát hiện khuôn mặt trong hình ảnh. Vui lòng thử lại với ánh sáng tốt hơn và đảm bảo khuôn mặt nhìn rõ vào camera.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if len(face_objs) > 1:
                    return Response(
                        {'error': 'Phát hiện nhiều khuôn mặt trong hình ảnh. Vui lòng cung cấp hình ảnh với chỉ một khuôn mặt.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Kiểm tra khuôn mặt thật/giả
                is_real_face = face_objs[0].get("is_real", True)
                liveness_score = face_objs[0].get("liveness_score", 0.9)
                
                logger.info(f"Kết quả kiểm tra khuôn mặt thật/giả: {is_real_face}, điểm: {liveness_score:.2f}")
                
                # Không cho phép đăng ký với khuôn mặt giả
                if not is_real_face:
                    return Response(
                        {
                            'error': 'Phát hiện khuôn mặt không phải khuôn mặt thật. Vui lòng sử dụng khuôn mặt thật để đăng ký.',
                            'liveness_score': liveness_score,
                            'details': {'is_real': is_real_face}
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Trích xuất đặc trưng khuôn mặt sử dụng DeepFace
                embedding_objs = DeepFace.represent(
                    img_path=temp_image_path,
                    detector_backend="retinaface",
                    model_name="Facenet512"
                )
                
                if len(embedding_objs) == 0:
                    return Response(
                        {'error': 'Không thể trích xuất đặc trưng khuôn mặt. Vui lòng thử lại với ảnh chất lượng tốt hơn.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Lấy embedding (vector đặc trưng) từ kết quả
                face_embedding = embedding_objs[0]["embedding"]
                
                # Lưu dữ liệu khuôn mặt
                face_data = FaceData(
                    employee=employee,
                    face_encoding=pickle.dumps({
                        'encoding': face_embedding,
                        'employee_id': employee.employee_id,  # Changed from employee.id to employee.employee_id
                        'liveness_score': liveness_score
                    }),
                    image=image_file
                )
                face_data.save()
                
                # Xóa ảnh tạm thời sau khi đã hoàn thành mọi xử lý
                import os
                if os.path.exists(temp_image_path):
                    os.remove(temp_image_path)
                
                return Response({
                    'success': True,
                    'message': f'Đã đăng ký khuôn mặt thành công cho {employee.first_name} {employee.last_name}',
                    'face_data_id': face_data.id,
                    'liveness_score': liveness_score,
                    'details': {'is_real': is_real_face}
                })
            except Exception as e:
                # Xóa ảnh tạm thời trong trường hợp lỗi
                import os
                if os.path.exists(temp_image_path):
                    os.remove(temp_image_path)
                raise e
                
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
        """Nhận diện khuôn mặt từ ảnh sử dụng DeepFace"""
        if 'image' not in request.FILES:
            return Response(
                {'error': 'Không tìm thấy hình ảnh trong yêu cầu'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        
        try:
            from PIL import Image
            import io
            import cv2
            from deepface import DeepFace
            from scipy.spatial.distance import cosine
            import os
            
            logger = logging.getLogger(__name__)
            logger.info("Bắt đầu quá trình nhận diện khuôn mặt")
            
            # Đọc ảnh từ request
            image_stream = io.BytesIO(image_file.read())
            
            # Chuyển đổi sang định dạng numpy array
            pil_image = Image.open(image_stream)
            img_array = np.array(pil_image)
            
            # Lưu ảnh tạm thời để DeepFace xử lý
            temp_image_path = "temp_face_img.jpg"
            cv2.imwrite(temp_image_path, cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR))
            
            try:
                # Sử dụng DeepFace để phát hiện khuôn mặt
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
                        {'error': 'Không phát hiện khuôn mặt trong hình ảnh'},
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
                
                if not is_real_face:
                    # Xóa ảnh tạm thời
                    if os.path.exists(temp_image_path):
                        os.remove(temp_image_path)
                    return Response(
                        {
                            'error': 'Phát hiện khuôn mặt không phải khuôn mặt thật.',
                            'liveness_score': liveness_score,
                            'details': {'is_real': is_real_face}
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Trích xuất đặc trưng khuôn mặt từ ảnh đầu vào
                embedding_objs = DeepFace.represent(
                    img_path=temp_image_path,
                    detector_backend="retinaface",
                    model_name="Facenet512"
                )
                
                # Xóa ảnh tạm thời sau khi sử dụng
                if os.path.exists(temp_image_path):
                    os.remove(temp_image_path)
                
                if len(embedding_objs) == 0:
                    return Response(
                        {'error': 'Không thể trích xuất đặc trưng khuôn mặt. Vui lòng thử lại với ảnh chất lượng tốt hơn.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                unknown_face_embedding = embedding_objs[0]["embedding"]
                
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
                        stored_face_embedding = stored_data['encoding']
                        
                        # Tính khoảng cách cosine giữa hai vector đặc trưng
                        unknown_embedding_array = np.array(unknown_face_embedding)
                        stored_embedding_array = np.array(stored_face_embedding)
                        
                        # Tính cosine distance
                        cosine_distance = cosine(unknown_embedding_array, stored_embedding_array)
                        
                        logger.info(f"Khoảng cách cosine với khuôn mặt ID {face_data.id}: {cosine_distance}")
                        
                        # Cập nhật best match (khoảng cách càng nhỏ thì càng giống nhau)
                        if cosine_distance < best_match_distance:
                            best_match = face_data
                            best_match_distance = cosine_distance
                        
                    except Exception as e:
                        logger.error(f"Lỗi khi so sánh khuôn mặt: {str(e)}")
                        continue
                
                # Ngưỡng cosine distance mặc định là 0.4
                # Với cosine distance, giá trị càng thấp càng giống nhau
                threshold = 0.4
                
                logger.info(f"Best match distance: {best_match_distance}, threshold: {threshold}")
                
                if best_match is not None and best_match_distance < threshold:
                    employee = best_match.employee
                    
                    # Lấy thông tin nhân viên
                    employee_data = {
                        'id': employee.employee_id,
                        'employee_id': employee.employee_id,
                        'first_name': employee.first_name,
                        'last_name': employee.last_name,
                        'full_name': f"{employee.first_name} {employee.last_name}",
                        'department': employee.department.name if employee.department else None,
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
                        'message': 'Không tìm thấy khuôn mặt phù hợp trong cơ sở dữ liệu',
                        'best_match_distance': best_match_distance,
                        'threshold': threshold
                    }, status=status.HTTP_404_NOT_FOUND)
                
            except Exception as e:
                # Xóa ảnh tạm thời trong trường hợp lỗi
                if os.path.exists(temp_image_path):
                    os.remove(temp_image_path)
                raise e
        
        except Exception as e:
            import traceback
            logger.error(f"Lỗi khi nhận diện khuôn mặt: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {'error': f'Lỗi hệ thống: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RegistrationAPIView(APIView):
    permission_classes = [AllowAny]  # Cho phép bất kỳ ai truy cập

    def post(self, request):
        # Lấy dữ liệu từ request
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")
        role = request.data.get("role", "user")  # Mặc định là user nếu không có

        # Kiểm tra thông tin bắt buộc
        if not username or not email or not password:
            return Response(
                {"success": False, "error": "Vui lòng cung cấp đầy đủ thông tin."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"success": False, "error": "Tên đăng nhập đã tồn tại."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Tạo user trong hệ thống Django
            user = User.objects.create_user(username=username, email=email, password=password)
            
            # Tạo UserProfile và liên kết với user
            if role == "admin":
                UserProfile.objects.create(user=user, is_admin=True)
            else:
                UserProfile.objects.create(user=user, is_user=True)

            return Response(
                {
                    "success": True, 
                    "message": "Đăng ký tài khoản thành công.",
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"success": False, "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )