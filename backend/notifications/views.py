from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import logging

from .models import Notification
from .serializers import NotificationSerializer, NotificationCreateSerializer
from employees.models import Employee

logger = logging.getLogger(__name__)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    def get_queryset(self):
        queryset = Notification.objects.all()
        
        # Nếu người dùng không phải admin, chỉ hiển thị thông báo của họ
        user = self.request.user
        if not user.is_staff and not user.is_superuser:
            try:
                employee = Employee.objects.get(user=user)
                queryset = queryset.filter(employee=employee)
            except Employee.DoesNotExist:
                # Nếu không tìm thấy nhân viên, trả về queryset rỗng
                return Notification.objects.none()
        
        # Lọc theo nhân viên
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            # Nếu không phải admin và employee_id không phải của nhân viên hiện tại, trả về rỗng
            if not user.is_staff and not user.is_superuser:
                try:
                    current_employee = Employee.objects.get(user=user)
                    requested_employee = Employee.objects.filter(employee_id=employee_id).first()
                    if not requested_employee or current_employee.id != requested_employee.id:
                        return Notification.objects.none()
                except Employee.DoesNotExist:
                    return Notification.objects.none()
            
            try:
                # Tìm nhân viên theo employee_id
                employee = Employee.objects.filter(employee_id=employee_id).first()
                if employee:
                    queryset = queryset.filter(employee=employee)
                    logger.info(f"Lọc thông báo theo nhân viên: {employee_id}")
                else:
                    logger.warning(f"Không tìm thấy nhân viên với employee_id={employee_id}")
                    return Notification.objects.none()
            except Exception as e:
                logger.error(f"Lỗi khi lọc thông báo theo nhân viên: {str(e)}")
                return Notification.objects.none()
        
        # Lọc theo trạng thái đã đọc/chưa đọc
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            is_read_bool = is_read.lower() == 'true'
            queryset = queryset.filter(is_read=is_read_bool)
        
        # Lọc theo loại thông báo
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(type=notification_type)
        
        return queryset
    
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
