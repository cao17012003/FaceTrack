from rest_framework import serializers
from .models import SupportTicket, Message, Attachment
from employees.models import Employee
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'file', 'filename', 'uploaded_at']
        read_only_fields = ['uploaded_at']

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    attachments = AttachmentSerializer(many=True, read_only=True)
    uploaded_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Message
        fields = ['id', 'ticket', 'sender', 'sender_name', 'content', 'created_at', 
                 'is_read', 'is_from_admin', 'attachments', 'uploaded_files']
        read_only_fields = ['created_at', 'is_read', 'is_from_admin']
    
    def get_sender_name(self, obj):
        if obj.sender:
            return f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return "Unknown"
    
    def create(self, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        
        # Kiểm tra nếu người gửi là admin
        request = self.context.get('request')
        # Thêm kiểm tra xem request có tồn tại không và request.user có tồn tại và đã xác thực không
        if request and hasattr(request, 'user') and request.user and request.user.is_authenticated:
            try:
                user_profile = request.user.userprofile
                validated_data['is_from_admin'] = user_profile.is_admin
            except:
                validated_data['is_from_admin'] = False
        else:
            # Mặc định không phải admin nếu không xác định được
            validated_data['is_from_admin'] = False
        
        message = Message.objects.create(**validated_data)
        
        # Lưu các file đính kèm
        for file in uploaded_files:
            Attachment.objects.create(
                message=message,
                file=file,
                filename=file.name
            )
        
        # Cập nhật trạng thái ticket nếu cần
        ticket = message.ticket
        ticket.updated_at = timezone.now()
        
        # Nếu ticket đang ở trạng thái open và admin gửi tin nhắn, chuyển sang in_progress
        if ticket.status == 'open' and validated_data.get('is_from_admin', False):
            ticket.status = 'in_progress'
        
        ticket.save()
        
        return message

class SupportTicketSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    employee_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    latest_message = serializers.SerializerMethodField()
    unread_messages_count = serializers.SerializerMethodField()
    attachments = AttachmentSerializer(many=True, read_only=True)
    uploaded_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = SupportTicket
        fields = ['id', 'employee', 'employee_name', 'title', 'description', 
                 'status', 'priority', 'created_at', 'updated_at', 'category',
                 'assigned_to', 'assigned_to_name', 'messages', 'latest_message',
                 'unread_messages_count', 'attachments', 'uploaded_files']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.first_name} {obj.employee.last_name}".strip()
        return "Unknown"
    
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip()
        return None
    
    def get_latest_message(self, obj):
        latest = obj.get_latest_message()
        if latest:
            return MessageSerializer(latest).data
        return None
    
    def get_unread_messages_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        
        try:
            user_profile = request.user.userprofile
            is_admin = user_profile.is_admin
            
            # Admin đếm tin nhắn chưa đọc từ nhân viên
            if is_admin:
                return obj.messages.filter(is_read=False, is_from_admin=False).count()
            
            # Nhân viên đếm tin nhắn chưa đọc từ admin
            return obj.messages.filter(is_read=False, is_from_admin=True).count()
        except:
            return 0
    
    def create(self, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        ticket = SupportTicket.objects.create(**validated_data)
        
        # Lưu các file đính kèm
        for file in uploaded_files:
            Attachment.objects.create(
                ticket=ticket,
                file=file,
                filename=file.name
            )
        
        # Nếu người tạo là employee, tự động tạo tin nhắn đầu tiên
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            Message.objects.create(
                ticket=ticket,
                sender=request.user,
                content=validated_data.get('description', ''),
                is_from_admin=False  # Mặc định là nhân viên tạo
            )
        
        return ticket

class SupportTicketListSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    latest_message = serializers.SerializerMethodField()
    unread_messages_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportTicket
        fields = ['id', 'employee', 'employee_name', 'title', 'status', 
                 'priority', 'created_at', 'updated_at', 'category',
                 'latest_message', 'unread_messages_count']
    
    def get_employee_name(self, obj):
        if obj.employee:
            return f"{obj.employee.first_name} {obj.employee.last_name}".strip()
        return "Unknown"
    
    def get_latest_message(self, obj):
        latest = obj.get_latest_message()
        if latest:
            return {
                'content': latest.content[:100] + '...' if len(latest.content) > 100 else latest.content,
                'created_at': latest.created_at,
                'is_from_admin': latest.is_from_admin
            }
        return None
    
    def get_unread_messages_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        
        try:
            user_profile = request.user.userprofile
            is_admin = user_profile.is_admin
            
            # Admin đếm tin nhắn chưa đọc từ nhân viên
            if is_admin:
                return obj.messages.filter(is_read=False, is_from_admin=False).count()
            
            # Nhân viên đếm tin nhắn chưa đọc từ admin
            return obj.messages.filter(is_read=False, is_from_admin=True).count()
        except:
            return 0 