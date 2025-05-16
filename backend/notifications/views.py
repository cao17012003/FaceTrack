from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import logging
from rest_framework.permissions import IsAuthenticated, AllowAny
from datetime import timedelta

from .models import Notification
from .serializers import NotificationSerializer, NotificationCreateSerializer
from employees.models import Employee, UserProfile

logger = logging.getLogger(__name__)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    def get_queryset(self):
        # Kiểm tra nếu có employee_id trong query params
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            try:
                employee = Employee.objects.filter(employee_id=employee_id).first()
                if employee:
                    return Notification.objects.filter(employee=employee)
                else:
                    return Notification.objects.none()
            except Exception as e:
                logger.error(f"Lỗi khi lọc thông báo theo employee_id: {str(e)}")
                return Notification.objects.none()
                
        # Nếu không có employee_id, kiểm tra user đang đăng nhập
        user = self.request.user
        if not user or not user.is_authenticated:
            return Notification.objects.none()
            
        try:
            user_profile = UserProfile.objects.get(user=user)
            if user_profile.is_admin:
                # Admin có thể xem tất cả thông báo
                return Notification.objects.all()
            
            # Tìm employee tương ứng với user
            try:
                employee = Employee.objects.get(username=user)
                return Notification.objects.filter(employee=employee)
            except Employee.DoesNotExist:
                return Notification.objects.none()
        except UserProfile.DoesNotExist:
            return Notification.objects.none()
    
    def create(self, request, *args, **kwargs):
        # Chỉ admin mới có thể tạo thông báo mới
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            if not user_profile.is_admin:
                return Response(
                    {'error': 'Bạn không có quyền tạo thông báo mới'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return super().create(request, *args, **kwargs)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy thông tin người dùng'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def update(self, request, *args, **kwargs):
        # Chỉ admin mới có thể cập nhật thông báo
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            if not user_profile.is_admin:
                return Response(
                    {'error': 'Bạn không có quyền cập nhật thông báo'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return super().update(request, *args, **kwargs)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy thông tin người dùng'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def destroy(self, request, *args, **kwargs):
        # Chỉ admin mới có thể xóa thông báo
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            if not user_profile.is_admin:
                return Response(
                    {'error': 'Bạn không có quyền xóa thông báo'},
                    status=status.HTTP_403_FORBIDDEN
                )
            # Kiểm tra xem thông báo có thuộc người dùng không (nếu không phải admin)
            notification = self.get_object()
            if not user_profile.is_admin:
                try:
                    employee = Employee.objects.get(username=request.user)
                    if notification.employee != employee:
                        return Response(
                            {'error': 'Bạn không có quyền xóa thông báo của người khác'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except Employee.DoesNotExist:
                    return Response(
                        {'error': 'Không tìm thấy thông tin nhân viên'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            return super().destroy(request, *args, **kwargs)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy thông tin người dùng'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Đánh dấu thông báo là đã đọc"""
        notification = self.get_object()
        
        # Kiểm tra quyền
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            
            if user_profile.is_admin:
                # Admin đánh dấu notification là đã đọc bởi admin
                notification.is_read_by_admin = True
                notification.save()
            else:
                # Nếu không phải admin, chỉ được đánh dấu thông báo của mình
                try:
                    employee = Employee.objects.get(username=request.user)
                    if notification.employee != employee:
                        return Response(
                            {'error': 'Bạn không có quyền đánh dấu thông báo của người khác'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                    # Nhân viên đánh dấu notification là đã đọc
                    notification.is_read = True
                    notification.save()
                except Employee.DoesNotExist:
                    return Response(
                        {'error': 'Không tìm thấy thông tin nhân viên'},
                        status=status.HTTP_404_NOT_FOUND
                    )
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy thông tin người dùng'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Đánh dấu tất cả thông báo là đã đọc"""
        employee_id = request.data.get('employee_id')
        
        if not employee_id:
            return Response({
                'error': 'Vui lòng cung cấp employee_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Kiểm tra quyền
            user_profile = UserProfile.objects.get(user=request.user)
            
            # Tìm employee
            employee = Employee.objects.filter(employee_id=employee_id).first()
            if not employee:
                return Response({
                    'error': f'Không tìm thấy nhân viên với employee_id={employee_id}'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if user_profile.is_admin:
                # Admin đánh dấu tất cả thông báo của nhân viên là đã đọc bởi admin
                notifications = Notification.objects.filter(employee=employee, is_read_by_admin=False)
                count = notifications.count()
                notifications.update(is_read_by_admin=True, updated_at=timezone.now())
            else:
                # Nếu không phải admin và không phải thao tác trên thông báo của chính mình
                try:
                    user_employee = Employee.objects.get(username=request.user)
                    if user_employee.employee_id != employee_id:
                        return Response({
                            'error': 'Bạn không có quyền đánh dấu thông báo của người khác'
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    # Nhân viên đánh dấu tất cả thông báo của mình là đã đọc
                    notifications = Notification.objects.filter(employee=employee, is_read=False)
                    count = notifications.count()
                    notifications.update(is_read=True, updated_at=timezone.now())
                except Employee.DoesNotExist:
                    return Response({
                        'error': 'Không tìm thấy thông tin nhân viên'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'success': True,
                'message': f'Đã đánh dấu {count} thông báo là đã đọc',
                'count': count
            })
        except UserProfile.DoesNotExist:
            return Response({
                'error': 'Không tìm thấy thông tin người dùng'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Lỗi khi đánh dấu tất cả thông báo là đã đọc: {str(e)}")
            return Response({
                'error': f'Lỗi hệ thống: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Lấy số lượng thông báo chưa đọc"""
        employee_id = request.query_params.get('employee_id')
        
        try:
            # Kiểm tra quyền
            user = request.user
            user_profile = UserProfile.objects.get(user=user)
            
            # Trường hợp admin không truyền employee_id
            if user_profile.is_admin and not employee_id:
                # Admin không truyền employee_id - trả về tổng số thông báo admin chưa đọc
                count = Notification.objects.filter(is_read_by_admin=False).count()
                return Response({
                    'count': count
                })
            
            # Các trường hợp còn lại cần employee_id
            if not employee_id:
                # Thử lấy employee_id từ user hiện tại nếu không phải admin
                try:
                    user_employee = Employee.objects.get(username=user)
                    employee_id = user_employee.employee_id
                except Employee.DoesNotExist:
                    return Response({
                        'error': 'Vui lòng cung cấp employee_id hoặc đăng nhập với tài khoản nhân viên'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Tìm employee
            employee = Employee.objects.filter(employee_id=employee_id).first()
            if not employee:
                return Response({
                    'error': f'Không tìm thấy nhân viên với employee_id={employee_id}'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if user_profile.is_admin:
                # Admin xem số thông báo chưa đọc bởi admin cho nhân viên cụ thể
                count = Notification.objects.filter(employee=employee, is_read_by_admin=False).count()
            else:
                # Nếu không phải admin và không phải thao tác trên thông báo của chính mình
                try:
                    user_employee = Employee.objects.get(username=user)
                    if user_employee.employee_id != employee_id:
                        return Response({
                            'error': 'Bạn không có quyền xem thông báo của người khác'
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    # Nhân viên xem số thông báo của mình chưa đọc
                    count = Notification.objects.filter(employee=employee, is_read=False).count()
                except Employee.DoesNotExist:
                    return Response({
                        'error': 'Không tìm thấy thông tin nhân viên'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'count': count
            })
        except UserProfile.DoesNotExist:
            return Response({
                'error': 'Không tìm thấy thông tin người dùng'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Lỗi khi lấy số lượng thông báo chưa đọc: {str(e)}")
            return Response({
                'error': f'Lỗi hệ thống: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
