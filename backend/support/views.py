from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SupportTicket, Message, Attachment
from .serializers import SupportTicketSerializer, SupportTicketListSerializer, MessageSerializer, AttachmentSerializer
from employees.models import Employee, UserProfile
from django.contrib.auth import get_user_model
from django.db.models import Q
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class SupportTicketViewSet(viewsets.ModelViewSet):
    queryset = SupportTicket.objects.all()
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.AllowAny]  # Tạm thời cho phép tất cả truy cập
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SupportTicketListSerializer
        return SupportTicketSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return SupportTicket.objects.none()
        
        try:
            user_profile = UserProfile.objects.get(user=user)
            
            # Admin có thể xem tất cả tickets
            if user_profile.is_admin:
                queryset = SupportTicket.objects.all()
                
                # Lọc theo trạng thái nếu được chỉ định
                status_filter = self.request.query_params.get('status')
                if status_filter:
                    queryset = queryset.filter(status=status_filter)
                
                # Lọc theo độ ưu tiên nếu được chỉ định
                priority_filter = self.request.query_params.get('priority')
                if priority_filter:
                    queryset = queryset.filter(priority=priority_filter)
                
                # Lọc theo nhân viên nếu được chỉ định
                employee_filter = self.request.query_params.get('employee_id')
                if employee_filter:
                    queryset = queryset.filter(employee__employee_id=employee_filter)
                
                # Tìm kiếm theo tiêu đề hoặc mô tả
                search_query = self.request.query_params.get('search')
                if search_query:
                    queryset = queryset.filter(
                        Q(title__icontains=search_query) | 
                        Q(description__icontains=search_query)
                    )
                
                return queryset
            
            # Nhân viên chỉ có thể xem tickets của họ
            try:
                employee = Employee.objects.get(user=user)
                queryset = SupportTicket.objects.filter(employee=employee)
                
                # Lọc theo trạng thái nếu được chỉ định
                status_filter = self.request.query_params.get('status')
                if status_filter:
                    queryset = queryset.filter(status=status_filter)
                
                return queryset
            except Employee.DoesNotExist:
                return SupportTicket.objects.none()
        except UserProfile.DoesNotExist:
            return SupportTicket.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        
        # Nếu không có user hoặc không xác thực, tạo ticket sẽ lỗi
        if not user or not user.is_authenticated:
            # Tự động gán admin là ID 1 nếu không có assigned_to
            if 'assigned_to' not in serializer.validated_data:
                try:
                    admin_user = User.objects.get(id=1)  # Admin mặc định ID=1
                    serializer.save(assigned_to=admin_user)
                except User.DoesNotExist:
                    serializer.save()  # Nếu không tìm thấy admin, tạo ticket mà không gán
            else:
                serializer.save()
            return
        
        try:
            # Tìm employee liên kết với user hiện tại
            employee = Employee.objects.filter(user=user).first()
            
            # Tự động gán admin là ID 1 nếu không có assigned_to
            if 'assigned_to' not in serializer.validated_data:
                try:
                    admin_user = User.objects.get(id=1)  # Admin mặc định ID=1
                    if employee:
                        # Nếu tìm thấy employee, liên kết với ticket và admin mặc định
                        serializer.save(employee=employee, assigned_to=admin_user)
                        logger.info(f"Đã tạo ticket liên kết với employee: {employee.employee_id} và admin mặc định")
                    else:
                        # Nếu không tìm thấy employee, chỉ gán admin mặc định
                        serializer.save(assigned_to=admin_user)
                        logger.warning(f"Tạo ticket không có employee: {user.username}, đã gán admin mặc định")
                except User.DoesNotExist:
                    # Nếu không tìm thấy admin
                    if employee:
                        serializer.save(employee=employee)
                    else:
                        serializer.save()
                    logger.warning("Không tìm thấy admin mặc định (ID=1)")
            else:
                # Nếu đã có assigned_to từ client
                if employee:
                    serializer.save(employee=employee)
                else:
                    serializer.save()
        except Exception as e:
            # Ghi log lỗi và tạo ticket mà không gán employee
            logger.error(f"Lỗi khi tạo ticket: {str(e)}")
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Thay đổi trạng thái của ticket"""
        ticket = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status or new_status not in dict(SupportTicket.STATUS_CHOICES).keys():
            return Response({
                'error': 'Trạng thái không hợp lệ'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Kiểm tra quyền - chỉ admin mới có thể thay đổi trạng thái
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            if not user_profile.is_admin:
                return Response({
                    'error': 'Bạn không có quyền thay đổi trạng thái ticket'
                }, status=status.HTTP_403_FORBIDDEN)
        except UserProfile.DoesNotExist:
            return Response({
                'error': 'Không tìm thấy thông tin người dùng'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Cập nhật trạng thái
        ticket.status = new_status
        ticket.save()
        
        # Nếu đánh dấu là resolved, tự động tạo tin nhắn thông báo
        if new_status == 'resolved':
            Message.objects.create(
                ticket=ticket,
                sender=request.user,
                content='Vấn đề của bạn đã được giải quyết. Nếu bạn hài lòng, bạn có thể đóng ticket này.',
                is_from_admin=True
            )
        
        # Nếu đánh dấu là closed, tự động tạo tin nhắn thông báo
        if new_status == 'closed':
            Message.objects.create(
                ticket=ticket,
                sender=request.user,
                content='Ticket này đã được đóng.',
                is_from_admin=True
            )
        
        return Response(SupportTicketSerializer(ticket).data)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Gán ticket cho admin xử lý"""
        ticket = self.get_object()
        admin_id = request.data.get('admin_id')
        
        if not admin_id:
            return Response({
                'error': 'Vui lòng cung cấp admin_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Kiểm tra quyền - chỉ admin mới có thể gán ticket
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            if not user_profile.is_admin:
                return Response({
                    'error': 'Bạn không có quyền gán ticket'
                }, status=status.HTTP_403_FORBIDDEN)
        except UserProfile.DoesNotExist:
            return Response({
                'error': 'Không tìm thấy thông tin người dùng'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Tìm admin được gán
        try:
            admin_user = User.objects.get(id=admin_id)
            admin_profile = UserProfile.objects.get(user=admin_user)
            
            if not admin_profile.is_admin:
                return Response({
                    'error': 'Người dùng được chọn không phải là admin'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Cập nhật admin được gán
            ticket.assigned_to = admin_user
            ticket.save()
            
            # Đánh dấu là đang xử lý nếu đang ở trạng thái open
            if ticket.status == 'open':
                ticket.status = 'in_progress'
                ticket.save()
            
            # Tự động tạo tin nhắn thông báo
            Message.objects.create(
                ticket=ticket,
                sender=request.user,
                content=f'Ticket đã được gán cho {admin_user.first_name} {admin_user.last_name}',
                is_from_admin=True
            )
            
            return Response(SupportTicketSerializer(ticket).data)
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            return Response({
                'error': 'Không tìm thấy admin'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Lấy thống kê về tickets"""
        # Kiểm tra quyền - chỉ admin mới có thể xem thống kê
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            if not user_profile.is_admin:
                return Response({
                    'error': 'Bạn không có quyền xem thống kê'
                }, status=status.HTTP_403_FORBIDDEN)
        except UserProfile.DoesNotExist:
            return Response({
                'error': 'Không tìm thấy thông tin người dùng'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Tính toán thống kê
        total = SupportTicket.objects.count()
        open_count = SupportTicket.objects.filter(status='open').count()
        in_progress_count = SupportTicket.objects.filter(status='in_progress').count()
        resolved_count = SupportTicket.objects.filter(status='resolved').count()
        closed_count = SupportTicket.objects.filter(status='closed').count()
        
        high_priority = SupportTicket.objects.filter(priority='high').count()
        urgent_priority = SupportTicket.objects.filter(priority='urgent').count()
        
        return Response({
            'total': total,
            'by_status': {
                'open': open_count,
                'in_progress': in_progress_count,
                'resolved': resolved_count,
                'closed': closed_count
            },
            'high_priority': high_priority,
            'urgent_priority': urgent_priority
        })
    
    @action(detail=False, methods=['get'], name="my_tickets", url_path="my_tickets", permission_classes=[permissions.AllowAny])
    def my_tickets(self, request):
        """Lấy tickets của nhân viên hiện tại"""
        user = request.user
        
        if not user.is_authenticated:
            # Trả về danh sách rỗng thay vì lỗi xác thực
            logger.warning("Người dùng không xác thực truy cập my_tickets")
            return Response([])
        
        try:
            # Tìm employee liên kết với user hiện tại
            try:
                employee = Employee.objects.get(user=user)
            except Employee.DoesNotExist:
                logger.warning(f"Không tìm thấy employee cho user: {user.username}")
                return Response([])
                
            # Lấy tickets của employee
            tickets = SupportTicket.objects.filter(employee=employee)
            
            # Lọc theo trạng thái nếu được chỉ định
            status_filter = request.query_params.get('status')
            if status_filter:
                tickets = tickets.filter(status=status_filter)
            
            serializer = SupportTicketListSerializer(tickets, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Lỗi khi lấy tickets: {str(e)}")
            return Response([])

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.AllowAny]  # Tạm thời cho phép tất cả truy cập
    
    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Message.objects.none()
        
        # Lọc theo ticket nếu được chỉ định
        ticket_id = self.request.query_params.get('ticket_id')
        if ticket_id:
            try:
                ticket = SupportTicket.objects.get(id=ticket_id)
                
                # Kiểm tra quyền
                try:
                    user_profile = UserProfile.objects.get(user=user)
                    
                    # Admin có thể xem tất cả tin nhắn
                    if user_profile.is_admin:
                        # Đánh dấu tin nhắn từ nhân viên là đã đọc
                        unread_messages = Message.objects.filter(
                            ticket=ticket,
                            is_read=False,
                            is_from_admin=False  # Tin nhắn từ nhân viên
                        )
                        
                        for message in unread_messages:
                            message.is_read = True
                            message.save()
                        
                        return Message.objects.filter(ticket=ticket)
                    
                    # Nhân viên chỉ có thể xem tin nhắn của tickets của họ
                    try:
                        employee = Employee.objects.get(user=user)
                        if ticket.employee == employee:
                            # Đánh dấu tin nhắn từ admin là đã đọc
                            unread_messages = Message.objects.filter(
                                ticket=ticket,
                                is_read=False,
                                is_from_admin=True  # Tin nhắn từ admin
                            )
                            
                            for message in unread_messages:
                                message.is_read = True
                                message.save()
                            
                            return Message.objects.filter(ticket=ticket)
                        return Message.objects.none()
                    except Employee.DoesNotExist:
                        return Message.objects.none()
                except UserProfile.DoesNotExist:
                    return Message.objects.none()
            except SupportTicket.DoesNotExist:
                return Message.objects.none()
        
        return Message.objects.none()
    
    def perform_create(self, serializer):
        # Tự động thiết lập người gửi là người dùng hiện tại
        user = self.request.user
        
        # Kiểm tra xem user có tồn tại và đã xác thực không
        if user and user.is_authenticated:
            serializer.save(sender=user)
            
            # Kiểm tra quyền và thiết lập is_from_admin
            try:
                user_profile = UserProfile.objects.get(user=user)
                if user_profile.is_admin:
                    serializer.instance.is_from_admin = True
                    serializer.instance.save()
            except UserProfile.DoesNotExist:
                pass
        else:
            # Trường hợp không có người dùng xác thực, chỉ lưu dữ liệu như đã cung cấp
            serializer.save()
