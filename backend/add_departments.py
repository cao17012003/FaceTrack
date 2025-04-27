import os
import django
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Import models after Django setup
from employees.models import Department

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

# Create departments
created_count = 0
for dept in departments:
    department, created = Department.objects.get_or_create(
        name=dept["name"],
        defaults={"description": dept["description"]}
    )
    if created:
        print(f"Created department: {department.name}")
        created_count += 1
    else:
        print(f"Department already exists: {department.name}")

print(f"\nCreated {created_count} new departments.")
