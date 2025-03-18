from django.db import models
from employees.models import Employee, Shift
from django.utils import timezone
import os

def attendance_image_path(instance, filename):
    # Lưu hình ảnh điểm danh với định dạng: attendance/employee_id/date_type.extension
    employee_id = instance.employee.employee_id
    date_str = timezone.now().strftime('%Y%m%d_%H%M%S')
    attendance_type = 'check_in' if instance.check_out_time is None else 'check_out'
    extension = os.path.splitext(filename)[1]
    return f'attendance/{employee_id}/{date_str}_{attendance_type}{extension}'

class Attendance(models.Model):
    """Model for employee attendance records"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    attendance_date = models.DateField()
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    
    # Thêm trường lưu hình ảnh khuôn mặt cho điểm danh vào và ra
    check_in_image = models.ImageField(upload_to=attendance_image_path, null=True, blank=True,
                                      help_text="Hình ảnh khuôn mặt khi điểm danh vào")
    check_out_image = models.ImageField(upload_to=attendance_image_path, null=True, blank=True,
                                       help_text="Hình ảnh khuôn mặt khi điểm danh ra")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-attendance_date', '-check_in_time']
        
    def __str__(self):
        return f"{self.employee} - {self.attendance_date}"
    
    @property
    def is_present(self):
        return self.check_in_time is not None
    
    @property
    def working_hours(self):
        """Calculate working hours if both check_in and check_out are recorded"""
        if self.check_in_time and self.check_out_time:
            duration = self.check_out_time - self.check_in_time
            return duration.total_seconds() / 3600  # Convert seconds to hours
        return 0
    
    @property
    def status(self):
        """Return current attendance status"""
        if not self.check_in_time:
            return "Absent"
        elif not self.check_out_time:
            return "Working"
        else:
            return "Completed"
