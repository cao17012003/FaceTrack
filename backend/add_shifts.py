import os
import django
import datetime
import pytz

# Thiết lập múi giờ Việt Nam
vietnam_timezone = pytz.timezone('Asia/Ho_Chi_Minh')

# Thiết lập môi trường Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'face_checkin.settings')
django.setup()

# Import models sau khi thiết lập Django
from employees.models import Shift

# Danh sách ca làm việc cần tạo
shifts = [
    # Ca hành chính
    {
        "name": "Ca Hành Chính", 
        "start_time": datetime.time(8, 0), 
        "end_time": datetime.time(17, 30), 
        "description": "Ca hành chính tiêu chuẩn (8:00 - 17:30), nghỉ trưa 1h30p"
    },
    {
        "name": "Ca Hành Chính Linh Hoạt", 
        "start_time": datetime.time(7, 30), 
        "end_time": datetime.time(17, 0), 
        "description": "Ca hành chính linh hoạt (7:30 - 17:00), nghỉ trưa 1h30p"
    },
    
    # Ca sản xuất
    {
        "name": "Ca Sáng", 
        "start_time": datetime.time(6, 0), 
        "end_time": datetime.time(14, 0), 
        "description": "Ca sản xuất buổi sáng (6:00 - 14:00)"
    },
    {
        "name": "Ca Chiều", 
        "start_time": datetime.time(14, 0), 
        "end_time": datetime.time(22, 0), 
        "description": "Ca sản xuất buổi chiều (14:00 - 22:00)"
    },
    {
        "name": "Ca Đêm", 
        "start_time": datetime.time(22, 0), 
        "end_time": datetime.time(6, 0), 
        "description": "Ca sản xuất ban đêm (22:00 - 6:00 sáng hôm sau)"
    },
    
    # Ca đặc biệt
    {
        "name": "Ca Nửa Ngày Sáng", 
        "start_time": datetime.time(8, 0), 
        "end_time": datetime.time(12, 0), 
        "description": "Ca nửa ngày buổi sáng (8:00 - 12:00)"
    },
    {
        "name": "Ca Nửa Ngày Chiều", 
        "start_time": datetime.time(13, 30), 
        "end_time": datetime.time(17, 30), 
        "description": "Ca nửa ngày buổi chiều (13:30 - 17:30)"
    },
    {
        "name": "Ca Cuối Tuần", 
        "start_time": datetime.time(9, 0), 
        "end_time": datetime.time(18, 0), 
        "description": "Ca làm việc cuối tuần (9:00 - 18:00)"
    },
    {
        "name": "Ca 12 Giờ", 
        "start_time": datetime.time(8, 0), 
        "end_time": datetime.time(20, 0), 
        "description": "Ca dài 12 giờ (8:00 - 20:00)"
    },
    {
        "name": "Ca Linh Hoạt", 
        "start_time": datetime.time(0, 0), 
        "end_time": datetime.time(23, 59), 
        "description": "Ca linh hoạt, không có giờ cố định"
    }
]

def create_or_update_shifts():
    """Tạo hoặc cập nhật danh sách ca làm việc"""
    created_count = 0
    updated_count = 0
    
    for shift_data in shifts:
        shift, created = Shift.objects.update_or_create(
            name=shift_data["name"],
            defaults={
                "start_time": shift_data["start_time"],
                "end_time": shift_data["end_time"],
                "description": shift_data["description"]
            }
        )
        
        if created:
            print(f"✅ Đã tạo ca làm việc: {shift.name}")
            created_count += 1
        else:
            print(f"🔄 Đã cập nhật ca làm việc: {shift.name}")
            updated_count += 1
    
    print(f"\n📊 Tổng kết:")
    print(f"   - Đã tạo {created_count} ca làm việc mới")
    print(f"   - Đã cập nhật {updated_count} ca làm việc hiện có")
    print(f"   - Tổng số ca làm việc: {Shift.objects.count()}")

if __name__ == "__main__":
    create_or_update_shifts()
