#!/usr/bin/env python
import os
import django
import random
from datetime import datetime, timedelta, time
from django.utils import timezone

# Thiết lập môi trường Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'face_checkin.settings')
django.setup()

# Import models
from django.contrib.auth.models import User
from employees.models import Department, Shift, Employee, UserProfile, FaceData
from attendance.models import Attendance

def create_vietnamese_employees(num_employees=10):
    """Tạo nhân viên với tên Tiếng Việt nếu chưa đủ số lượng"""
    print(f"Đang kiểm tra và tạo {num_employees} nhân viên...")
    
    # Tên Việt Nam phổ biến
    ho_list = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Vũ", "Võ", "Phan", "Trương", "Bùi", "Đặng", "Đỗ", "Ngô", "Hồ", "Dương", "Đinh"]
    ten_dem_list = ["Văn", "Thị", "Đức", "Hữu", "Quang", "Minh", "Hồng", "Thanh", "Thành", "Tuấn", "Công", "Đình", "Xuân", "Hoài"]
    ten_list = ["An", "Anh", "Bình", "Cường", "Dũng", "Đạt", "Hà", "Hải", "Hiếu", "Hoàng", "Hùng", "Hương", "Kiên", "Linh", "Long", "Mai", "Minh", "Nam", "Nga", "Nhung", "Phong", "Phúc", "Quân", "Quỳnh", "Thảo", "Thắng", "Thành", "Tú", "Tùng", "Uyên", "Vinh", "Yến"]
    
    # Lấy các phòng ban hiện có
    departments = list(Department.objects.all())
    if not departments:
        print("Không có phòng ban nào trong hệ thống. Tạo nhân viên nhưng không gán phòng ban.")
    
    # Lấy các ca làm việc hiện có hoặc tạo mới nếu chưa có
    shifts = list(Shift.objects.all())
    if not shifts:
        print("Không có ca làm việc nào. Tạo mới các ca làm việc mặc định.")
        shift_data = [
            {"name": "Sáng", "start_time": "08:00", "end_time": "12:00", "description": "Ca sáng"},
            {"name": "Chiều", "start_time": "13:00", "end_time": "17:00", "description": "Ca chiều"},
            {"name": "Tối", "start_time": "18:00", "end_time": "22:00", "description": "Ca tối"}
        ]
        for data in shift_data:
            shift, created = Shift.objects.get_or_create(
                name=data["name"],
                defaults={
                    'start_time': data["start_time"],
                    'end_time': data["end_time"],
                    'description': data["description"]
                }
            )
            shifts.append(shift)
            if created:
                print(f"Đã tạo ca làm việc: {shift.name}")
    
    # Đếm số nhân viên hiện có
    existing_employees = Employee.objects.count()
    print(f"Số nhân viên hiện có: {existing_employees}")
    
    # Tạo thêm nhân viên nếu chưa đủ
    employees_to_create = max(0, num_employees - existing_employees)
    print(f"Cần tạo thêm {employees_to_create} nhân viên")
    
    created_employees = []
    
    for i in range(employees_to_create):
        employee_id = f"NV{i+existing_employees+1:03d}"
        
        # Tạo tên tiếng Việt
        ho = random.choice(ho_list)
        ten_dem = random.choice(ten_dem_list)
        ten = random.choice(ten_list)
        full_name = f"{ho} {ten_dem} {ten}"
        
        # Tạo email
        email = f"{ten.lower()}.{ho.lower()}@example.com"
        
        # Tạo username
        username = f"user_{ten.lower()}_{i+existing_employees+1}"
        
        # Tạo user và user profile
        user = User.objects.create_user(
            username=username,
            email=email,
            password="password123",
            first_name=ten,
            last_name=f"{ho} {ten_dem}"
        )
        
        UserProfile.objects.create(
            user=user,
            is_employee=True
        )
        
        # Tạo nhân viên
        employee = Employee.objects.create(
            employee_id=employee_id,
            user=user,
            full_name=full_name,
            position="Nhân viên",
            department=random.choice(departments) if departments else None,
            shift=random.choice(shifts) if shifts else None,
            phone_number=f"09{random.randint(10000000, 99999999)}",
            address=f"Số {random.randint(1, 100)}, Đường {random.randint(1, 50)}, Phường {random.randint(1, 20)}, Quận {random.randint(1, 12)}, TP. Hồ Chí Minh",
            birthdate=timezone.now().date() - timedelta(days=random.randint(8000, 15000))
        )
        
        created_employees.append(employee)
        print(f"Đã tạo nhân viên: {full_name} (ID: {employee_id})")
    
    # Trả về tất cả nhân viên (cả cũ và mới)
    return list(Employee.objects.all()[:num_employees])

def generate_attendance_data(employees, days=30):
    """Tạo dữ liệu chấm công cho danh sách nhân viên trong số ngày quy định"""
    print(f"\nĐang tạo dữ liệu chấm công cho {len(employees)} nhân viên trong {days} ngày qua...")
    
    # Ngày hiện tại
    today = timezone.now().date()
    
    # Xóa dữ liệu chấm công cũ
    old_attendance = Attendance.objects.filter(
        attendance_date__gte=today - timedelta(days=days)
    )
    count = old_attendance.count()
    if count > 0:
        old_attendance.delete()
        print(f"Đã xóa {count} bản ghi chấm công cũ")
    
    total_created = 0
    
    # Tạo dữ liệu chấm công cho mỗi ngày (trừ cuối tuần) và mỗi nhân viên
    for day_offset in range(days):
        current_date = today - timedelta(days=day_offset)
        
        # Bỏ qua ngày cuối tuần (thứ 7 và chủ nhật)
        if current_date.weekday() >= 5:  # 5: Thứ 7, 6: Chủ nhật
            continue
        
        print(f"Tạo dữ liệu cho ngày: {current_date.strftime('%d/%m/%Y')}")
        
        for employee in employees:
            # Lấy ca làm việc của nhân viên
            shift = employee.shift
            if not shift:
                # Nếu nhân viên không có ca làm việc, giả định ca mặc định 8h-17h
                check_in_base = time(8, 0)
                check_out_base = time(17, 0)
            else:
                # shift.start_time và shift.end_time đã là các đối tượng time
                check_in_base = shift.start_time
                check_out_base = shift.end_time
            
            # Tỷ lệ nhân viên đi làm (90%)
            if random.random() < 0.9:
                # Tạo thời gian check-in ngẫu nhiên (trong khoảng -30 đến +30 phút so với giờ bắt đầu ca)
                check_in_variation = random.randint(-30, 30)
                # Đảm bảo datetime có timezone
                check_in_naive = datetime.combine(current_date, check_in_base) + timedelta(minutes=check_in_variation)
                check_in_datetime = timezone.make_aware(check_in_naive)
                
                # Tỷ lệ nhân viên check-out (95% nhân viên đi làm sẽ check-out)
                if random.random() < 0.95:
                    # Tạo thời gian check-out ngẫu nhiên (trong khoảng -30 đến +60 phút so với giờ kết thúc ca)
                    check_out_variation = random.randint(-30, 60)
                    check_out_naive = datetime.combine(current_date, check_out_base) + timedelta(minutes=check_out_variation)
                    check_out_datetime = timezone.make_aware(check_out_naive)
                    
                    # Đảm bảo check-out sau check-in
                    if check_out_datetime <= check_in_datetime:
                        check_out_datetime = check_in_datetime + timedelta(hours=7)  # Ít nhất 7 giờ làm việc
                else:
                    check_out_datetime = None
                
                # Tạo bản ghi chấm công - theo cấu trúc mô hình thực tế
                attendance = Attendance.objects.create(
                    employee=employee,
                    attendance_date=current_date,
                    check_in_time=check_in_datetime,
                    check_out_time=check_out_datetime
                )
                
                total_created += 1
    
    print(f"\nĐã tạo tổng cộng {total_created} bản ghi chấm công")
    return total_created

if __name__ == "__main__":
    print("Bắt đầu tạo dữ liệu chấm công...")
    
    # Tạo 10 nhân viên với tên Tiếng Việt
    employees = create_vietnamese_employees(num_employees=10)
    
    # Tạo dữ liệu chấm công cho 30 ngày qua
    attendance_count = generate_attendance_data(employees, days=30)
    
    print(f"\nHoàn tất! Đã tạo {attendance_count} bản ghi chấm công cho {len(employees)} nhân viên.")
