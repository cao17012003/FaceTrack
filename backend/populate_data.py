#!/usr/bin/env python
import os
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'face_checkin.settings')
django.setup()

# Import models
from django.contrib.auth.models import User
from employees.models import Department, Shift, Employee, UserProfile
from attendance.models import Attendance

def create_sample_data():
    print("Creating sample data...")
    
    # Create admin user if not exists
    if not User.objects.filter(username='admin').exists():
        admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        admin_profile = UserProfile.objects.create(
            user=admin_user,
            is_admin=True
        )
        print("Created admin user")
    else:
        admin_user = User.objects.get(username='admin')
        print("Admin user already exists")

    # Create regular user if not exists
    if not User.objects.filter(username='user1').exists():
        user1 = User.objects.create_user('user1', 'user1@example.com', 'user123')
        user1_profile = UserProfile.objects.create(
            user=user1,
            is_user=True
        )
        print("Created regular user")
    else:
        user1 = User.objects.get(username='user1')
        print("Regular user already exists")

    # Create departments
    departments = [
        "Engineering",
        "Marketing",
        "Sales",
        "Human Resources",
        "Finance"
    ]
    
    created_departments = []
    for dept_name in departments:
        dept, created = Department.objects.get_or_create(
            name=dept_name,
            defaults={
                'description': f'{dept_name} Department',
                'username': admin_user
            }
        )
        created_departments.append(dept)
        if created:
            print(f"Created department: {dept_name}")
        else:
            print(f"Department {dept_name} already exists")
    
    # Create shifts
    shifts = [
        {"name": "Morning", "start_time": "08:00", "end_time": "17:00"},
        {"name": "Evening", "start_time": "14:00", "end_time": "23:00"},
        {"name": "Night", "start_time": "23:00", "end_time": "08:00"}
    ]
    
    created_shifts = []
    for shift_data in shifts:
        shift, created = Shift.objects.get_or_create(
            name=shift_data["name"],
            defaults={
                'start_time': shift_data["start_time"],
                'end_time': shift_data["end_time"],
                'description': f'{shift_data["name"]} Shift',
                'username': admin_user
            }
        )
        created_shifts.append(shift)
        if created:
            print(f"Created shift: {shift.name}")
        else:
            print(f"Shift {shift.name} already exists")
    
    # Create 20 employees (if they don't exist already)
    first_names = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Vu", "Dang", "Bui", "Do", "Ho"]
    last_names = ["Minh", "Tuan", "Thanh", "Hoa", "Hung", "Anh", "Dung", "Huong", "Linh", "Quan"]
    
    employees_created = 0
    for i in range(1, 21):
        employee_id = f"EMP{i:03d}"
        if not Employee.objects.filter(employee_id=employee_id).exists():
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            department = random.choice(created_departments)
            shift = random.choice(created_shifts)
            
            user = User.objects.create_user(
                username=f"employee{i}",
                email=f"employee{i}@example.com",
                password=f"employee{i}"
            )
            
            UserProfile.objects.create(
                user=user,
                is_user=True
            )
            
            Employee.objects.create(
                employee_id=employee_id,
                username=user,
                first_name=first_name,
                last_name=last_name,
                email=f"{first_name.lower()}.{last_name.lower()}{i}@example.com",
                phone=f"0{random.randint(900000000, 999999999)}",
                department=department,
                shift=shift,
                is_active=True
            )
            employees_created += 1
    
    print(f"Created {employees_created} new employees")
    
    # Create attendance records for the past 30 days
    employees = Employee.objects.all()
    attendance_created = 0
    
    for i in range(30):
        date = timezone.now().date() - timedelta(days=i)
        for employee in employees:
            # Randomly decide if employee attended on this day (80% chance)
            if random.random() < 0.8:
                # Only create if no attendance record exists for this employee on this date
                if not Attendance.objects.filter(employee=employee, attendance_date=date).exists():
                    # Create check-in time (between 7:30 AM and 9:00 AM)
                    check_in_hour = random.randint(7, 8)
                    check_in_minute = random.randint(0, 59)
                    check_in_time = timezone.make_aware(
                        datetime.combine(date, datetime.min.time().replace(hour=check_in_hour, minute=check_in_minute))
                    )
                    
                    # Create check-out time (between 4:30 PM and 6:30 PM)
                    check_out_hour = random.randint(16, 18)
                    check_out_minute = random.randint(0, 59)
                    check_out_time = timezone.make_aware(
                        datetime.combine(date, datetime.min.time().replace(hour=check_out_hour, minute=check_out_minute))
                    )
                    
                    Attendance.objects.create(
                        employee=employee,
                        attendance_date=date,
                        check_in_time=check_in_time,
                        check_out_time=check_out_time
                    )
                    attendance_created += 1
    
    print(f"Created {attendance_created} attendance records")
    print("Sample data creation complete!")

if __name__ == "__main__":
    create_sample_data()
