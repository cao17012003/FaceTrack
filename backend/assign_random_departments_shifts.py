import os
import django
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Import models after Django setup
from employees.models import Department, Shift, Employee

# Get all departments and shifts
departments = list(Department.objects.all())
shifts = list(Shift.objects.all())

if not departments:
    print("No departments found. Please run add_departments.py first.")
    exit(1)

if not shifts:
    print("No shifts found. Please run add_shifts.py first.")
    exit(1)

# Assign random departments and shifts to employees who don't have them
employees = Employee.objects.all()
updates_count = 0

for employee in employees:
    updated = False
    
    if not employee.department:
        employee.department = random.choice(departments)
        updated = True
    
    if not employee.shift:
        employee.shift = random.choice(shifts)
        updated = True
    
    if updated:
        employee.save()
        updates_count += 1
        print(f"Updated employee {employee.employee_id} - {employee.first_name} {employee.last_name}")
        print(f"  Department: {employee.department.name}")
        print(f"  Shift: {employee.shift.name}")

print(f"\nUpdated {updates_count} employees with random departments and shifts")
