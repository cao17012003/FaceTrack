from rest_framework import serializers
from .models import Employee, Department, Shift, FaceData, UserProfile

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = '__all__'

class FaceDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = FaceData
        fields = ['id', 'employee', 'image', 'created_at']
        read_only_fields = ['face_encoding']

class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    shift_name = serializers.ReadOnlyField(source='shift.name')
    
    class Meta:
        model = Employee
        fields = [
            'id',
            'username',         # Thêm trường username vào serializer
            'employee_id',
            'first_name',
            'last_name', 
            'department',
            'department_name',
            'shift',
            'shift_name',
            'email',
            'phone',
            'is_active',
            'profile_image',
            'created_at',
            'updated_at'
        ]

class EmployeeDetailSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    shift = ShiftSerializer(read_only=True)
    face_data = FaceDataSerializer(many=True, read_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'id',
            'username',         # Thêm trường username vào serializer chi tiết
            'employee_id',
            'first_name',
            'last_name', 
            'department',
            'shift',
            'email',
            'phone',
            'is_active',
            'profile_image',
            'face_data',
            'created_at',
            'updated_at'
        ]

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'is_admin', 'is_user', 'departments', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

