from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import logging
from rest_framework.permissions import AllowAny
from datetime import timedelta

from .models import Notification
from .serializers import NotificationSerializer, NotificationCreateSerializer
from employees.models import Employee, UserProfile

logger = logging.getLogger(__name__)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    def get_queryset(self):
        # Trả về tất cả thông báo trong môi trường development
        return Notification.objects.all()
        
        # Code cũ để tham khảo khi cần phân quyền
        # user = self.request.user
        # if not user or not user.is_authenticated:
        #     return Notification.objects.all()
        #     
        # try:
        #     user_profile = UserProfile.objects.get(user=user)
        #     if user_profile.is_admin or user_profile.is_user:
        #         return Notification.objects.all()
        #     try:
        #         employee = Employee.objects.get(user=user)
        #         return Notification.objects.filter(employee=employee)
        #     except Employee.DoesNotExist:
        #         return Notification.objects.none()
        # except UserProfile.DoesNotExist:
        #     return Notification.objects.all()
    
    def create(self, request, *args, **kwargs):
        # Chỉ admin mới có thể tạo thông báo mới
        user_profile = UserProfile.objects.get(user=request.user)
        if not user_profile.is_admin:
            return Response(
                {'error': 'Bạn không có quyền tạo thông báo mới'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        # Chỉ admin mới có thể cập nhật thông báo
        user_profile = UserProfile.objects.get(user=request.user)
        if not user_profile.is_admin:
            return Response(
                {'error': 'Bạn không có quyền cập nhật thông báo'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        # Chỉ admin mới có thể xóa thông báo
        user_profile = UserProfile.objects.get(user=request.user)
        if not user_profile.is_admin:
            return Response(
                {'error': 'Bạn không có quyền xóa thông báo'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Đánh dấu thông báo là đã đọc"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        
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
            employee = Employee.objects.filter(employee_id=employee_id).first()
            if not employee:
                return Response({
                    'error': f'Không tìm thấy nhân viên với employee_id={employee_id}'
                }, status=status.HTTP_404_NOT_FOUND)
            
            notifications = Notification.objects.filter(employee=employee, is_read=False)
            count = notifications.count()
            
            notifications.update(is_read=True, updated_at=timezone.now())
            
            return Response({
                'success': True,
                'message': f'Đã đánh dấu {count} thông báo là đã đọc',
                'count': count
            })
        except Exception as e:
            logger.error(f"Lỗi khi đánh dấu tất cả thông báo là đã đọc: {str(e)}")
            return Response({
                'error': f'Lỗi hệ thống: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Lấy số lượng thông báo chưa đọc"""
        employee_id = request.query_params.get('employee_id')
        
        if not employee_id:
            return Response({
                'error': 'Vui lòng cung cấp employee_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            employee = Employee.objects.filter(employee_id=employee_id).first()
            if not employee:
                return Response({
                    'error': f'Không tìm thấy nhân viên với employee_id={employee_id}'
                }, status=status.HTTP_404_NOT_FOUND)
            
            count = Notification.objects.filter(employee=employee, is_read=False).count()
            
            return Response({
                'employee_id': employee_id,
                'unread_count': count
            })
        except Exception as e:
            logger.error(f"Lỗi khi lấy số lượng thông báo chưa đọc: {str(e)}")
            return Response({
                'error': f'Lỗi hệ thống: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
