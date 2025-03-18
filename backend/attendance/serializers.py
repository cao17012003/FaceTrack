from rest_framework import serializers
from .models import Attendance
from employees.serializers import EmployeeSerializer
from employees.models import Employee
from django.utils import timezone

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.first_name')
    employee_id = serializers.ReadOnlyField(source='employee.employee_id')
    status = serializers.ReadOnlyField()
    working_hours = serializers.ReadOnlyField()
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 
            'check_in_time', 'check_out_time',
            'check_in_image', 'check_out_image',
            'attendance_date', 'status', 'working_hours'
        ]

class AttendanceDetailSerializer(serializers.ModelSerializer):
    employee = EmployeeSerializer(read_only=True)
    status = serializers.ReadOnlyField()
    working_hours = serializers.ReadOnlyField()
    
    class Meta:
        model = Attendance
        fields = '__all__'

class AttendanceCreateSerializer(serializers.ModelSerializer):
    employee_id = serializers.CharField(write_only=True)
    face_image = serializers.ImageField(write_only=True)
    
    class Meta:
        model = Attendance
        fields = ['employee_id', 'face_image']
    
    def create(self, validated_data):
        employee_id = validated_data.pop('employee_id')
        face_image = validated_data.pop('face_image')
        
        try:
            employee = Employee.objects.get(employee_id=employee_id)
        except Employee.DoesNotExist:
            raise serializers.ValidationError("Không tìm thấy nhân viên với ID này")
        
        # Tìm attendance hiện tại hoặc tạo mới
        attendance, created = Attendance.objects.get_or_create(
            employee=employee,
            attendance_date=timezone.now().date()
        )
        
        # Kiểm tra xem đang check-in hay check-out
        if not attendance.check_in_time:
            attendance.check_in_time = timezone.now()
            attendance.check_in_image = face_image
        else:
            attendance.check_out_time = timezone.now()
            attendance.check_out_image = face_image
        
        attendance.save()
        return attendance 