from django.db import models
from django.utils import timezone
from employees.models import Employee, UserProfile
from django.conf import settings

class SupportTicket(models.Model):
    STATUS_CHOICES = (
        ('open', 'Đang mở'),
        ('in_progress', 'Đang xử lý'),
        ('resolved', 'Đã giải quyết'),
        ('closed', 'Đã đóng'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Thấp'),
        ('medium', 'Trung bình'),
        ('high', 'Cao'),
        ('urgent', 'Khẩn cấp'),
    )
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='support_tickets', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                   null=True, blank=True, related_name='assigned_tickets')
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.employee} ({self.status})"
    
    def get_messages(self):
        return self.messages.all().order_by('created_at')
    
    def get_latest_message(self):
        return self.messages.order_by('-created_at').first()
    
    def mark_as_in_progress(self):
        self.status = 'in_progress'
        self.updated_at = timezone.now()
        self.save()
    
    def mark_as_resolved(self):
        self.status = 'resolved'
        self.updated_at = timezone.now()
        self.save()
    
    def mark_as_closed(self):
        self.status = 'closed'
        self.updated_at = timezone.now()
        self.save()

class Message(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    is_from_admin = models.BooleanField(default=False)  # Để phân biệt tin nhắn từ admin hay từ nhân viên
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message from {self.sender} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    def mark_as_read(self):
        self.is_read = True
        self.save()

# File đính kèm cho ticket và tin nhắn
class Attachment(models.Model):
    file = models.FileField(upload_to='support_attachments/')
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments', null=True, blank=True)
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='attachments', null=True, blank=True)
    
    def __str__(self):
        return self.filename
