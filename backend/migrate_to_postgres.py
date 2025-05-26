#!/usr/bin/env python
import os
import django
import sys

# Thiết lập môi trường Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'face_checkin.settings')
django.setup()

# Import các model
from django.contrib.auth.models import User
from employees.models import Department, Shift, Employee, UserProfile, FaceData
from attendance.models import Attendance
from django.conf import settings
import psycopg2
from django.db import connections

def setup_postgres_connection():
    """Thiết lập kết nối PostgreSQL từ biến môi trường Docker"""
    print("=== THIẾT LẬP KẾT NỐI POSTGRESQL ===")
    
    # Lấy thông tin kết nối từ biến môi trường (được thiết lập trong docker-compose.yml)
    db_host = os.environ.get('POSTGRES_HOST', 'db')
    db_port = os.environ.get('POSTGRES_PORT', '5432')
    db_name = os.environ.get('POSTGRES_DB', 'postgres')
    db_user = os.environ.get('POSTGRES_USER', 'postgres')
    db_password = os.environ.get('POSTGRES_PASSWORD', 'postgres')
    
    print(f"Thông tin kết nối PostgreSQL:")
    print(f"- Host: {db_host}")
    print(f"- Port: {db_port}")
    print(f"- Database: {db_name}")
    print(f"- User: {db_user}")
    print(f"- Password: {'*' * len(db_password) if db_password else 'None'}")
    
    # Tạo chuỗi kết nối
    postgres_config = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': db_name,
        'USER': db_user,
        'PASSWORD': db_password,
        'HOST': db_host,
        'PORT': db_port,
    }
    
    # Thử kết nối
    try:
        conn = psycopg2.connect(
            dbname=db_name,
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port
        )
        conn.close()
        print("✅ Kết nối PostgreSQL thành công!")
        
        # Thiết lập cấu hình Django để sử dụng PostgreSQL
        settings.DATABASES['postgres'] = postgres_config
        
        # Tạo kết nối mới trong Django
        connections.ensure_defaults('postgres')
        connections.prepare_test_settings('postgres')
        connections.create_connection('postgres')
        
        print("✅ Đã thiết lập kết nối PostgreSQL trong Django")
        return True
    except Exception as e:
        print(f"❌ Lỗi kết nối PostgreSQL: {str(e)}")
        return False

def migrate_data_to_postgres():
    """Di chuyển dữ liệu từ SQLite sang PostgreSQL"""
    print("\n=== DI CHUYỂN DỮ LIỆU TỪ SQLITE SANG POSTGRESQL ===")
    
    # Kiểm tra kết nối PostgreSQL
    if not setup_postgres_connection():
        print("❌ Không thể kết nối đến PostgreSQL. Hủy quá trình di chuyển dữ liệu.")
        return False
    
    # Lấy dữ liệu từ SQLite (kết nối mặc định)
    print("\nĐang lấy dữ liệu từ SQLite...")
    
    # Đếm các bản ghi
    user_count = User.objects.using('default').count()
    dept_count = Department.objects.using('default').count()
    shift_count = Shift.objects.using('default').count()
    employee_count = Employee.objects.using('default').count()
    attendance_count = Attendance.objects.using('default').count()
    
    print(f"Số lượng bản ghi trong SQLite:")
    print(f"- User: {user_count}")
    print(f"- Department: {dept_count}")
    print(f"- Shift: {shift_count}")
    print(f"- Employee: {employee_count}")
    print(f"- Attendance: {attendance_count}")
    
    # Kiểm tra cấu trúc database PostgreSQL
    print("\nKiểm tra cấu trúc database PostgreSQL...")
    
    # Tạo các bảng trong PostgreSQL nếu chưa có
    try:
        from django.core.management import call_command
        call_command('migrate', database='postgres')
        print("✅ Đã tạo cấu trúc database PostgreSQL")
    except Exception as e:
        print(f"❌ Lỗi khi tạo cấu trúc database: {str(e)}")
        return False
    
    # Di chuyển dữ liệu
    print("\nĐang di chuyển dữ liệu từ SQLite sang PostgreSQL...")
    
    # Chuyển dữ liệu User
    print("Đang chuyển dữ liệu User...")
    users = User.objects.using('default').all()
    for user in users:
        # Kiểm tra xem user đã tồn tại trong PostgreSQL chưa
        if not User.objects.using('postgres').filter(username=user.username).exists():
            user_data = {
                'username': user.username,
                'password': user.password,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
                'is_active': user.is_active,
                'is_superuser': user.is_superuser,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
            }
            User.objects.using('postgres').create(**user_data)
    
    # Chuyển dữ liệu UserProfile
    print("Đang chuyển dữ liệu UserProfile...")
    profiles = UserProfile.objects.using('default').all()
    for profile in profiles:
        # Tìm user tương ứng trong PostgreSQL
        try:
            pg_user = User.objects.using('postgres').get(username=profile.user.username)
            # Kiểm tra xem profile đã tồn tại trong PostgreSQL chưa
            if not UserProfile.objects.using('postgres').filter(user=pg_user).exists():
                profile_data = {
                    'user': pg_user,
                    'is_admin': profile.is_admin,
                    'is_user': profile.is_user,
                    'is_employee': profile.is_employee,
                }
                UserProfile.objects.using('postgres').create(**profile_data)
        except User.DoesNotExist:
            print(f"Không tìm thấy user {profile.user.username} trong PostgreSQL")
    
    # Chuyển dữ liệu Department
    print("Đang chuyển dữ liệu Department...")
    departments = Department.objects.using('default').all()
    for dept in departments:
        # Kiểm tra xem department đã tồn tại trong PostgreSQL chưa
        if not Department.objects.using('postgres').filter(name=dept.name).exists():
            dept_data = {
                'name': dept.name,
                'description': dept.description,
            }
            if dept.username:
                try:
                    pg_user = User.objects.using('postgres').get(username=dept.username.username)
                    dept_data['username'] = pg_user
                except User.DoesNotExist:
                    pass
            Department.objects.using('postgres').create(**dept_data)
    
    # Chuyển dữ liệu Shift
    print("Đang chuyển dữ liệu Shift...")
    shifts = Shift.objects.using('default').all()
    for shift in shifts:
        # Kiểm tra xem shift đã tồn tại trong PostgreSQL chưa
        if not Shift.objects.using('postgres').filter(name=shift.name).exists():
            shift_data = {
                'name': shift.name,
                'start_time': shift.start_time,
                'end_time': shift.end_time,
                'description': shift.description,
            }
            if shift.username:
                try:
                    pg_user = User.objects.using('postgres').get(username=shift.username.username)
                    shift_data['username'] = pg_user
                except User.DoesNotExist:
                    pass
            Shift.objects.using('postgres').create(**shift_data)
    
    # Chuyển dữ liệu Employee
    print("Đang chuyển dữ liệu Employee...")
    employees = Employee.objects.using('default').all()
    for employee in employees:
        # Kiểm tra xem employee đã tồn tại trong PostgreSQL chưa
        if not Employee.objects.using('postgres').filter(employee_id=employee.employee_id).exists():
            employee_data = {
                'employee_id': employee.employee_id,
                'full_name': employee.full_name,
                'position': employee.position,
                'phone_number': employee.phone_number,
                'address': employee.address,
                'birthdate': employee.birthdate,
            }
            # Tìm user tương ứng
            if employee.user:
                try:
                    pg_user = User.objects.using('postgres').get(username=employee.user.username)
                    employee_data['user'] = pg_user
                except User.DoesNotExist:
                    pass
            
            # Tìm department tương ứng
            if employee.department:
                try:
                    pg_dept = Department.objects.using('postgres').get(name=employee.department.name)
                    employee_data['department'] = pg_dept
                except Department.DoesNotExist:
                    pass
            
            # Tìm shift tương ứng
            if employee.shift:
                try:
                    pg_shift = Shift.objects.using('postgres').get(name=employee.shift.name)
                    employee_data['shift'] = pg_shift
                except Shift.DoesNotExist:
                    pass
            
            Employee.objects.using('postgres').create(**employee_data)
    
    # Chuyển dữ liệu Attendance
    print("Đang chuyển dữ liệu Attendance...")
    attendances = Attendance.objects.using('default').all()
    for attendance in attendances:
        # Tìm employee tương ứng trong PostgreSQL
        try:
            pg_employee = Employee.objects.using('postgres').get(employee_id=attendance.employee.employee_id)
            # Kiểm tra xem attendance đã tồn tại trong PostgreSQL chưa
            if not Attendance.objects.using('postgres').filter(
                employee=pg_employee,
                attendance_date=attendance.attendance_date,
                check_in_time=attendance.check_in_time
            ).exists():
                Attendance.objects.using('postgres').create(
                    employee=pg_employee,
                    attendance_date=attendance.attendance_date,
                    check_in_time=attendance.check_in_time,
                    check_out_time=attendance.check_out_time,
                    check_in_image=attendance.check_in_image,
                    check_out_image=attendance.check_out_image,
                )
        except Employee.DoesNotExist:
            print(f"Không tìm thấy employee {attendance.employee.employee_id} trong PostgreSQL")
    
    # Kiểm tra dữ liệu sau khi di chuyển
    print("\n=== KIỂM TRA DỮ LIỆU SAU KHI DI CHUYỂN ===")
    pg_user_count = User.objects.using('postgres').count()
    pg_dept_count = Department.objects.using('postgres').count()
    pg_shift_count = Shift.objects.using('postgres').count()
    pg_employee_count = Employee.objects.using('postgres').count()
    pg_attendance_count = Attendance.objects.using('postgres').count()
    
    print(f"Số lượng bản ghi trong PostgreSQL:")
    print(f"- User: {pg_user_count} / {user_count}")
    print(f"- Department: {pg_dept_count} / {dept_count}")
    print(f"- Shift: {pg_shift_count} / {shift_count}")
    print(f"- Employee: {pg_employee_count} / {employee_count}")
    print(f"- Attendance: {pg_attendance_count} / {attendance_count}")
    
    print("\n✅ Đã hoàn thành quá trình di chuyển dữ liệu từ SQLite sang PostgreSQL")
    
    return True

def update_settings_to_use_postgres():
    """Cập nhật file settings.py để sử dụng PostgreSQL thay vì SQLite"""
    print("\n=== CẬP NHẬT SETTINGS.PY ĐỂ SỬ DỤNG POSTGRESQL ===")
    
    settings_path = os.path.join(settings.BASE_DIR, 'face_checkin', 'settings.py')
    
    if not os.path.exists(settings_path):
        print(f"❌ Không tìm thấy file settings.py tại {settings_path}")
        return False
    
    # Đọc nội dung file
    with open(settings_path, 'r') as file:
        content = file.read()
    
    # Tìm và thay thế cấu hình database
    sqlite_config = """DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}"""
    
    postgres_config = """DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'postgres'),
        'USER': os.environ.get('POSTGRES_USER', 'postgres'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'postgres'),
        'HOST': os.environ.get('POSTGRES_HOST', 'db'),
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
    }
}"""
    
    # Thêm import os nếu chưa có
    if "import os" not in content:
        content = content.replace("from pathlib import Path", "from pathlib import Path\nimport os")
    
    # Thay thế cấu hình
    new_content = content.replace(sqlite_config, postgres_config)
    
    # Kiểm tra xem có thay đổi không
    if new_content == content:
        print("❌ Không thể tìm thấy cấu hình SQLite để thay thế")
        return False
    
    # Ghi nội dung mới vào file
    with open(settings_path, 'w') as file:
        file.write(new_content)
    
    print("✅ Đã cập nhật file settings.py để sử dụng PostgreSQL")
    return True

if __name__ == "__main__":
    print("=== TIỆN ÍCH DI CHUYỂN DỮ LIỆU TỪ SQLITE SANG POSTGRESQL ===")
    
    # Kiểm tra xem settings hiện tại đã sử dụng PostgreSQL chưa
    current_engine = settings.DATABASES['default']['ENGINE']
    if 'postgresql' in current_engine:
        print("ℹ️ Ứng dụng đã được cấu hình để sử dụng PostgreSQL")
        sys.exit(0)
    
    # Di chuyển dữ liệu
    if migrate_data_to_postgres():
        # Cập nhật settings.py
        if update_settings_to_use_postgres():
            print("\n✅ Đã hoàn thành quá trình di chuyển sang PostgreSQL!")
            print("\nLưu ý: Bạn cần khởi động lại container backend để áp dụng cấu hình mới.")
            print("Sử dụng lệnh: docker restart facetrack-ai-backend-1")
        else:
            print("\n⚠️ Đã di chuyển dữ liệu nhưng không thể cập nhật file settings.py")
            print("Vui lòng cập nhật file settings.py thủ công để sử dụng PostgreSQL")
    else:
        print("\n❌ Quá trình di chuyển dữ liệu không thành công")
