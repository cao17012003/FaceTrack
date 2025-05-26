#!/usr/bin/env python
import os
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone

# Thiết lập môi trường Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'face_checkin.settings')
django.setup()

# Import models
from django.contrib.auth.models import User
from employees.models import Department, Shift, Employee, UserProfile
from attendance.models import Attendance

def generate_vietnamese_data():
    print("=== BẮT ĐẦU TẠO DỮ LIỆU ĐẦY ĐỦ CHO HỆ THỐNG ===")
    
    # Tạo tài khoản admin nếu chưa có
    if not User.objects.filter(username='admin').exists():
        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123',
            first_name='Admin',
            last_name='Hệ Thống'
        )
        UserProfile.objects.create(user=admin_user, is_admin=True)
        print("✅ Đã tạo tài khoản admin: admin/admin123")
    else:
        admin_user = User.objects.get(username='admin')
        print("ℹ️ Tài khoản admin đã tồn tại")
    
    # Tạo phòng ban
    departments_data = [
        {"name": "Phòng Kỹ Thuật", "description": "Phụ trách các vấn đề kỹ thuật, phần mềm, phần cứng"},
        {"name": "Phòng Nhân Sự", "description": "Tuyển dụng và quản lý nhân viên"},
        {"name": "Phòng Tài Chính", "description": "Quản lý tài chính, kế toán, ngân sách"},
        {"name": "Phòng Marketing", "description": "Xây dựng thương hiệu và chiến dịch quảng cáo"},
        {"name": "Phòng Kinh Doanh", "description": "Bán hàng và phát triển khách hàng"},
        {"name": "Ban Giám Đốc", "description": "Điều hành và đưa ra chiến lược công ty"},
        {"name": "Phòng Sản Xuất", "description": "Sản xuất và đảm bảo chất lượng sản phẩm"},
        {"name": "Phòng Dịch Vụ Khách Hàng", "description": "Hỗ trợ và chăm sóc khách hàng"}
    ]
    
    created_departments = []
    for dept_data in departments_data:
        dept, created = Department.objects.get_or_create(
            name=dept_data["name"],
            defaults={
                'description': dept_data["description"],
                'username': admin_user
            }
        )
        created_departments.append(dept)
        if created:
            print(f"✅ Đã tạo phòng ban: {dept.name}")
        else:
            print(f"ℹ️ Phòng ban đã tồn tại: {dept.name}")
    
    # Tạo ca làm việc
    shifts_data = [
        {"name": "Ca Sáng", "start_time": "08:00", "end_time": "12:00", "description": "Ca làm việc buổi sáng"},
        {"name": "Ca Chiều", "start_time": "13:00", "end_time": "17:00", "description": "Ca làm việc buổi chiều"},
        {"name": "Ca Tối", "start_time": "18:00", "end_time": "22:00", "description": "Ca làm việc buổi tối"},
        {"name": "Ca Hành Chính", "start_time": "08:00", "end_time": "17:00", "description": "Ca làm việc giờ hành chính"},
        {"name": "Ca Đêm", "start_time": "22:00", "end_time": "06:00", "description": "Ca làm việc ban đêm"}
    ]
    
    created_shifts = []
    for shift_data in shifts_data:
        # Chuyển đổi chuỗi giờ thành đối tượng time
        start_parts = shift_data["start_time"].split(':')
        end_parts = shift_data["end_time"].split(':')
        start_time = datetime.strptime(shift_data["start_time"], '%H:%M').time()
        end_time = datetime.strptime(shift_data["end_time"], '%H:%M').time()
        
        shift, created = Shift.objects.get_or_create(
            name=shift_data["name"],
            defaults={
                'start_time': start_time,
                'end_time': end_time,
                'description': shift_data["description"],
                'username': admin_user
            }
        )
        created_shifts.append(shift)
        if created:
            print(f"✅ Đã tạo ca làm việc: {shift.name}")
        else:
            print(f"ℹ️ Ca làm việc đã tồn tại: {shift.name}")
    
    # Danh sách họ, tên đệm và tên Việt Nam
    ho_list = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Vũ", "Võ", "Phan", "Trương", "Bùi", "Đặng", "Đỗ", "Ngô", "Hồ", "Dương", "Đinh"]
    ten_dem_list = ["Văn", "Thị", "Đức", "Hữu", "Quang", "Minh", "Hồng", "Thanh", "Thành", "Tuấn", "Công", "Đình", "Xuân", "Hoài"]
    ten_list = ["An", "Anh", "Bình", "Cường", "Dũng", "Đạt", "Hà", "Hải", "Hiếu", "Hoàng", "Hùng", "Hương", "Kiên", "Linh", "Long", "Mai", "Minh", "Nam", "Nga", "Nhung", "Phong", "Phúc", "Quân", "Quỳnh", "Thảo", "Thắng", "Thành", "Tú", "Tùng", "Uyên", "Vinh", "Yến"]
    
    # Danh sách các vị trí công việc
    positions = [
        "Giám Đốc", "Trưởng Phòng", "Phó Phòng", "Nhân Viên Cấp Cao", 
        "Nhân Viên", "Thực Tập Sinh", "Chuyên Viên", "Trưởng Nhóm", 
        "Kỹ Sư", "Thiết Kế Viên", "Kiểm Soát Viên", "Điều Phối Viên"
    ]
    
    # Tạo 20 nhân viên
    print("\n=== KHỞI TẠO NHÂN VIÊN ===")
    
    # Đếm số nhân viên hiện có
    existing_count = Employee.objects.count()
    print(f"Số nhân viên hiện có: {existing_count}")
    
    # Số nhân viên cần tạo
    employees_to_create = max(0, 20 - existing_count)
    print(f"Cần tạo thêm: {employees_to_create} nhân viên")
    
    for i in range(employees_to_create):
        # Tạo tên tiếng Việt
        ho = random.choice(ho_list)
        ten_dem = random.choice(ten_dem_list)
        ten = random.choice(ten_list)
        full_name = f"{ho} {ten_dem} {ten}"
        
        # Tạo thông tin nhân viên
        employee_id = f"NV{i+existing_count+1:03d}"
        username = f"nv{i+existing_count+1}"
        email = f"{ten.lower()}.{ho.lower()}@example.com"
        position = random.choice(positions)
        department = random.choice(created_departments)
        shift = random.choice(created_shifts)
        
        # Kiểm tra xem người dùng đã tồn tại chưa
        if User.objects.filter(username=username).exists():
            # Nếu đã tồn tại, sử dụng người dùng đó
            user = User.objects.get(username=username)
            print(f"   ℹ️ Người dùng {username} đã tồn tại, sử dụng tài khoản hiện có")
        else:
            # Nếu chưa tồn tại, tạo mới
            user = User.objects.create_user(
                username=username,
                email=email,
                password="password123",
                first_name=ten,
                last_name=f"{ho} {ten_dem}"
            )
            
            # Tạo profile người dùng
            UserProfile.objects.create(
                user=user,
                is_user=True  # Sử dụng is_user thay vì is_employee vì model không có trường is_employee
            )
        
        # Tách họ và tên để phù hợp với model
        first_name = ten
        last_name = f"{ho} {ten_dem}"
        
        # Kiểm tra xem nhân viên đã tồn tại chưa (dựa vào employee_id là primary key)
        if Employee.objects.filter(employee_id=employee_id).exists():
            # Nếu đã tồn tại, sử dụng nhân viên đó
            employee = Employee.objects.get(employee_id=employee_id)
            print(f"   ℹ️ Nhân viên {employee_id} đã tồn tại, sử dụng hồ sơ hiện có")
            
            # Cập nhật thông tin nếu cần
            employee.username = user
            employee.department = department
            employee.shift = shift
            employee.save()
        else:
            # Nếu chưa tồn tại, tạo mới
            employee = Employee.objects.create(
                employee_id=employee_id,
                first_name=first_name,
                last_name=last_name,
                department=department,
                shift=shift,
                email=email,
                phone=f"09{random.randint(10000000, 99999999)}",
                is_active=True,
                username=user
            )
        
        print(f"✅ Đã tạo nhân viên: {full_name} ({employee_id}) - {department.name} - {shift.name}")
    
    print("\n=== HOÀN THÀNH TẠO DỮ LIỆU ===")
    
    # Trả về tổng số lượng dữ liệu đã tạo
    return {
        "departments": Department.objects.count(),
        "shifts": Shift.objects.count(),
        "employees": Employee.objects.count()
    }

if __name__ == "__main__":
    results = generate_vietnamese_data()
    print(f"\nTổng kết dữ liệu trong hệ thống:")
    print(f"- Số phòng ban: {results['departments']}")
    print(f"- Số ca làm việc: {results['shifts']}")
    print(f"- Số nhân viên: {results['employees']}")
