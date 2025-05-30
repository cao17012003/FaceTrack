from rest_framework import serializers
from .models import Employee, Department, Shift, FaceData, UserProfile, User

class DepartmentSerializer(serializers.ModelSerializer):
    username = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    # Thêm trường id sử dụng giá trị name (vì frontend cần id field)
    id = serializers.CharField(source='name', read_only=True)
    
    class Meta:
        model = Department
        fields = '__all__'

class ShiftSerializer(serializers.ModelSerializer):
    # Thêm trường id sử dụng giá trị name (vì frontend cần id field)
    id = serializers.CharField(source='name', read_only=True)
    
    class Meta:
        model = Shift
        fields = ['id', 'name', 'start_time', 'end_time', 'description', 'username']

class FaceDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = FaceData
        fields = ['id', 'employee', 'image', 'created_at']
        read_only_fields = ['face_encoding']

class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')  # Lấy tên phòng ban
    shift_name = serializers.ReadOnlyField(source='shift.name')  # Lấy tên ca làm việc

    class Meta:
        model = Employee
        fields = [
            'employee_id',         # Sử dụng `employee_id` làm khóa chính
            'username',            # Trường liên kết với `User`
            'first_name',
            'last_name', 
            'department',          # Chứa ID của phòng ban
            'department_name',     # Tên phòng ban
            'shift',               # Chứa ID của ca làm việc
            'shift_name',          # Tên ca làm việc
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
    face_data = FaceDataSerializer(read_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'employee_id',      # Use employee_id instead of id as it's the primary key
            'username',         # Thêm trường username vào serializer chi tiết
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
    username = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'is_admin', 'is_user', 'departments', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

