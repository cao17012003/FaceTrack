from django.db import models
from employees.models import Employee

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('system', 'Thông báo hệ thống'),
        ('attendance', 'Thông báo điểm danh'),
        ('leave', 'Thông báo nghỉ phép'),
        ('payroll', 'Thông báo lương'),
        ('other', 'Thông báo khác'),
    )
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='system')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.type}: {self.title} - {self.employee}"
