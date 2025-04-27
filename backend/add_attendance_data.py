import os
import django
import datetime
import random
from django.utils import timezone
from dateutil.relativedelta import relativedelta

# Thiết lập môi trường Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'face_checkin.settings')
django.setup()

# Import models sau khi thiết lập Django
from employees.models import Employee, Shift
from attendance.models import Attendance

def create_random_attendance_data(start_date=None, end_date=None, days=30):
    """
    Tạo dữ liệu chấm công ngẫu nhiên cho tất cả nhân viên
    
    Args:
        start_date: Ngày bắt đầu tạo dữ liệu (mặc định là ngày hiện tại trừ {days} ngày)
        end_date: Ngày kết thúc tạo dữ liệu (mặc định là ngày hiện tại)
        days: Số ngày để tạo dữ liệu nếu không cung cấp start_date và end_date
    """
    # Lấy ngày bắt đầu và kết thúc nếu không được cung cấp
    if not end_date:
        end_date = timezone.now().date()
    if not start_date:
        start_date = end_date - datetime.timedelta(days=days)
    
    print(f"Tạo dữ liệu chấm công từ {start_date} đến {end_date}")
    
    # Lấy tất cả nhân viên
    employees = Employee.objects.filter(is_active=True)
    if not employees.exists():
        print("Không tìm thấy nhân viên nào. Vui lòng thêm nhân viên trước.")
        return
    
    print(f"Tìm thấy {len(employees)} nhân viên.")
    
    # Tạo dữ liệu chấm công cho mỗi nhân viên và mỗi ngày
    attendance_count = 0
    current_date = start_date
    
    while current_date <= end_date:
        # Bỏ qua cuối tuần
        if current_date.weekday() >= 5:  # 5: Thứ bảy, 6: Chủ nhật
            current_date += datetime.timedelta(days=1)
            continue
        
        print(f"Tạo dữ liệu cho ngày {current_date}")
        
        for employee in employees:
            # Kiểm tra xem đã có bản ghi chấm công cho nhân viên này vào ngày này chưa
            if Attendance.objects.filter(employee=employee, attendance_date=current_date).exists():
                continue
            
            # Lấy ca làm việc của nhân viên
            shift = employee.shift
            if not shift:
                continue  # Bỏ qua nếu nhân viên không có ca làm việc
            
            # Trường hợp ngẫu nhiên
            # 0: Vắng mặt (10%)
            # 1: Đúng giờ (60%)
            # 2: Đi muộn (15%)
            # 3: Về sớm (10%)
            # 4: Đi muộn và về sớm (5%)
            attendance_case = random.choices([0, 1, 2, 3, 4], weights=[10, 60, 15, 10, 5])[0]
            
            if attendance_case == 0:
                # Vắng mặt - không tạo bản ghi
                continue
            
            # Tạo thời gian chấm công dựa trên ca làm việc
            check_in_time = None
            check_out_time = None
            
            # Thời gian bắt đầu và kết thúc từ ca làm việc
            scheduled_start = datetime.datetime.combine(current_date, shift.start_time)
            
            # Xử lý trường hợp ca làm việc kéo dài qua nửa đêm
            if shift.end_time < shift.start_time:
                scheduled_end = datetime.datetime.combine(current_date + datetime.timedelta(days=1), shift.end_time)
            else:
                scheduled_end = datetime.datetime.combine(current_date, shift.end_time)
            
            # Đảm bảo các ngày giờ là aware datetime
            scheduled_start = timezone.make_aware(scheduled_start)
            scheduled_end = timezone.make_aware(scheduled_end)
            
            if attendance_case in [1, 2, 3, 4]:  # Có đi làm
                if attendance_case in [1, 3]:  # Đúng giờ hoặc về sớm
                    # Đúng giờ hoặc sớm hơn tối đa 15 phút
                    check_in_time = scheduled_start - datetime.timedelta(minutes=random.randint(0, 15))
                else:  # Đi muộn (case 2 hoặc 4)
                    # Muộn từ 1 đến 60 phút
                    check_in_time = scheduled_start + datetime.timedelta(minutes=random.randint(1, 60))
            
                if attendance_case in [1, 2]:  # Đúng giờ hoặc đi muộn
                    # Về đúng giờ hoặc muộn hơn tối đa 30 phút
                    check_out_time = scheduled_end + datetime.timedelta(minutes=random.randint(0, 30))
                else:  # Về sớm (case 3 hoặc 4)
                    # Về sớm từ 15 đến 120 phút
                    check_out_time = scheduled_end - datetime.timedelta(minutes=random.randint(15, 120))
            
            # Tạo bản ghi chấm công
            attendance = Attendance.objects.create(
                employee=employee,
                attendance_date=current_date,
                check_in_time=check_in_time,
                check_out_time=check_out_time
            )
            attendance_count += 1
        
        # Chuyển sang ngày tiếp theo
        current_date += datetime.timedelta(days=1)
    
    print(f"Đã tạo {attendance_count} bản ghi chấm công.")

if __name__ == "__main__":
    # Tạo dữ liệu cho 30 ngày gần đây
    create_random_attendance_data(days=30)
    
    # Hoặc có thể chỉ định khoảng thời gian cụ thể
    # start_date = datetime.date(2025, 4, 1)
    # end_date = datetime.date(2025, 4, 30)
    # create_random_attendance_data(start_date=start_date, end_date=end_date)
