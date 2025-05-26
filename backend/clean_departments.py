import os
import django
import time
from django.db import connection, transaction

# Thiết lập môi trường Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'face_checkin.settings')
django.setup()

from employees.models import Department
from django.db import connection

def check_departments_sql():
    """Kiểm tra phòng ban bằng SQL trực tiếp"""
    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM employees_department")
        count = cursor.fetchone()[0]
        
        cursor.execute("SELECT name FROM employees_department")
        names = [row[0] for row in cursor.fetchall()]
    
    return count, names

def force_clean_departments():
    """Xóa tất cả phòng ban hiện có trong database bằng nhiều cách khác nhau."""
    # Kiểm tra trước khi xóa
    count1 = Department.objects.count()
    sql_count1, sql_names1 = check_departments_sql()
    
    print(f"Tổng số phòng ban trước khi xóa:")
    print(f"- Theo ORM: {count1}")
    print(f"- Theo SQL: {sql_count1}")
    print(f"- Danh sách: {sql_names1}")
    
    # Xóa bằng SQL trực tiếp
    print("\nXóa phòng ban bằng SQL trực tiếp...")
    with connection.cursor() as cursor:
        with transaction.atomic():
            cursor.execute("DELETE FROM employees_department")
            print(f"SQL: Xóa tất cả phòng ban")
    
    # Chờ 1 giây để đảm bảo transaction hoàn thành
    time.sleep(1)
    
    # Kiểm tra sau khi xóa
    count2 = Department.objects.count()
    sql_count2, sql_names2 = check_departments_sql()
    
    print(f"\nTổng số phòng ban sau khi xóa:")
    print(f"- Theo ORM: {count2}")
    print(f"- Theo SQL: {sql_count2}")
    print(f"- Danh sách: {sql_names2}")
    
    if count2 > 0 or sql_count2 > 0:
        print("\nCảnh báo: Vẫn còn phòng ban trong database!")
        print("Thử xóa lại bằng ORM...")
        
        # Xóa lại bằng ORM
        with transaction.atomic():
            Department.objects.all().delete()
        
        # Kiểm tra lại
        count3 = Department.objects.count()
        sql_count3, sql_names3 = check_departments_sql()
        
        print(f"\nTổng số phòng ban sau khi xóa lại:")
        print(f"- Theo ORM: {count3}")
        print(f"- Theo SQL: {sql_count3}")
        print(f"- Danh sách: {sql_names3}")

if __name__ == "__main__":
    force_clean_departments()
