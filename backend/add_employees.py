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

def create_more_employees():
    print("Creating additional employee data...")
    
    # Get existing departments and shifts
    departments = list(Department.objects.all())
    shifts = list(Shift.objects.all())
    
    if not departments:
        print("No departments found. Please run populate_data.py first.")
        return
        
    if not shifts:
        print("No shifts found. Please run populate_data.py first.")
        return
    
    # Vietnamese first and last names
    first_names = [
        "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Hồ",
        "Ngô", "Dương", "Lý", "Phan", "Trương", "Võ", "Đào", "Đinh", "Mai", "Cao"
    ]
    
    last_names = [
        "Minh", "Tuấn", "Thanh", "Hoa", "Hùng", "Anh", "Dũng", "Hương", "Linh", "Quân",
        "Hải", "Thủy", "Phương", "Trang", "Thành", "Huy", "Loan", "Khoa", "Lan", "Hà",
        "Bình", "Vân", "Nam", "Sơn", "Hiệp", "Long", "Thảo", "Quỳnh", "Tâm", "Đức"
    ]
    
    middle_names = [
        "Văn", "Thị", "Hữu", "Đức", "Minh", "Hoàng", "Quang", "Thành", "Thanh", "Ngọc",
        "Phương", "Bảo", "Gia", "Đình", "Xuân", "Trọng", "Mạnh", "Kim", "Hải", "Tuấn"
    ]
    
    positions = [
        "Software Engineer", "Product Manager", "Data Scientist", "UI/UX Designer",
        "Sales Representative", "Marketing Specialist", "HR Coordinator", "Accountant",
        "Customer Support", "Quality Assurance", "Project Manager", "Business Analyst",
        "Technical Writer", "System Administrator", "Office Manager", "Financial Analyst",
        "Content Creator", "Operations Manager", "Research Analyst", "Executive Assistant"
    ]
    
    # Get the highest employee ID and start from there
    try:
        highest_id = Employee.objects.order_by('-employee_id').first().employee_id
        id_num = int(highest_id.replace('EMP', ''))
    except:
        id_num = 0
    
    # Create 30 more employees
    employees_created = 0
    for i in range(1, 31):
        id_num += 1
        employee_id = f"EMP{id_num:03d}"
        
        if not Employee.objects.filter(employee_id=employee_id).exists():
            first_name = random.choice(first_names)
            middle_name = random.choice(middle_names)
            last_name = random.choice(last_names)
            department = random.choice(departments)
            shift = random.choice(shifts)
            position = random.choice(positions)
            
            # Create a unique username
            username = f"employee{id_num}"
            email = f"{last_name.lower()}.{first_name.lower()}{id_num}@example.com"
            
            # Create user if it doesn't exist
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=username,  # Use username as password for simplicity
                    first_name=last_name,  # Vietnamese naming convention
                    last_name=first_name
                )
                
                UserProfile.objects.create(
                    user=user,
                    is_user=True
                )
                
                # Generate a random joining date within the last 2 years
                days_ago = random.randint(1, 730)  # Up to 2 years ago
                joining_date = (timezone.now() - timedelta(days=days_ago)).date()
                
                # Random salary between 10M and 50M VND
                salary = random.randint(10000000, 50000000)
                
                # Create employee
                Employee.objects.create(
                    employee_id=employee_id,
                    username=user,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    phone=f"0{random.randint(900000000, 999999999)}",
                    department=department,
                    shift=shift,
                    is_active=True
                )
                employees_created += 1
                print(f"Created employee: {employee_id} - {first_name} {last_name}")
    
    print(f"Created {employees_created} new employees")
    print("Employee data creation complete!")

if __name__ == "__main__":
    create_more_employees()
