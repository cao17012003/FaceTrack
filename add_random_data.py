#!/usr/bin/env python3
import os
import django
import random
import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Import models after Django setup
from employees.models import Department, Shift, Employee

# List of departments to create
departments = [
    {"name": "IT", "description": "Information Technology Department"},
    {"name": "HR", "description": "Human Resources Department"},
    {"name": "Finance", "description": "Finance and Accounting Department"},
    {"name": "Marketing", "description": "Marketing and Sales Department"},
    {"name": "Operations", "description": "Operations and Logistics Department"},
    {"name": "R&D", "description": "Research and Development Department"},
    {"name": "Customer Support", "description": "Customer Service and Support Department"},
    {"name": "Executive", "description": "Executive Management Department"}
]

# List of shifts to create
shifts = [
    {"name": "Morning Shift", "start_time": datetime.time(8, 0), "end_time": datetime.time(17, 0), "description": "Standard day shift (8:00 AM - 5:00 PM)"},
    {"name": "Evening Shift", "start_time": datetime.time(17, 0), "end_time": datetime.time(2, 0), "description": "Evening shift (5:00 PM - 2:00 AM)"},
    {"name": "Night Shift", "start_time": datetime.time(22, 0), "end_time": datetime.time(7, 0), "description": "Night shift (10:00 PM - 7:00 AM)"},
    {"name": "Weekend Shift", "start_time": datetime.time(9, 0), "end_time": datetime.time(18, 0), "description": "Weekend shift (9:00 AM - 6:00 PM)"},
    {"name": "Flexible Shift", "start_time": datetime.time(7, 0), "end_time": datetime.time(16, 0), "description": "Flexible hours shift (7:00 AM - 4:00 PM)"}
]

# Create departments
created_departments = []
for dept in departments:
    department, created = Department.objects.get_or_create(
        name=dept["name"],
        defaults={"description": dept["description"]}
    )
    if created:
        print(f"Created department: {department.name}")
    else:
        print(f"Department already exists: {department.name}")
    created_departments.append(department)

# Create shifts
created_shifts = []
for shift_data in shifts:
    shift, created = Shift.objects.get_or_create(
        name=shift_data["name"],
        defaults={
            "start_time": shift_data["start_time"],
            "end_time": shift_data["end_time"],
            "description": shift_data["description"]
        }
    )
    if created:
        print(f"Created shift: {shift.name}")
    else:
        print(f"Shift already exists: {shift.name}")
    created_shifts.append(shift)

# Assign random departments and shifts to employees who don't have them
employees = Employee.objects.all()
updates_count = 0

for employee in employees:
    updated = False
    if not employee.department:
        employee.department = random.choice(created_departments)
        updated = True
    
    if not employee.shift:
        employee.shift = random.choice(created_shifts)
        updated = True
    
    if updated:
        employee.save()
        updates_count += 1
        print(f"Updated employee {employee.employee_id} - {employee.first_name} {employee.last_name}")
        print(f"  Department: {employee.department.name}")
        print(f"  Shift: {employee.shift.name}")

print(f"\nCreated {len(created_departments)} departments and {len(created_shifts)} shifts")
print(f"Updated {updates_count} employees with random departments and shifts")
