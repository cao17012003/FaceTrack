from django.db import models
from django.contrib.auth.models import User

class Department(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.name

class Shift(models.Model):
    name = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.name} ({self.start_time} - {self.end_time})"

class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    employee_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    shift = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    profile_image = models.ImageField(upload_to='employee_profiles/', blank=True, null=True)
    
    def __str__(self):
        return f"{self.employee_id} - {self.first_name} {self.last_name}"
    
    class Meta:
        ordering = ['employee_id']

class FaceData(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='face_data')
    face_encoding = models.BinaryField()  # Lưu trữ mã hóa khuôn mặt dưới dạng binary
    image = models.ImageField(upload_to='face_data/')  # Lưu trữ hình ảnh khuôn mặt
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Face data for {self.employee.first_name} {self.employee.last_name}"
