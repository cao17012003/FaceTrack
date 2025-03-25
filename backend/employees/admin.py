from django.contrib import admin
from .models import Employee, Department, Shift, FaceData

class FaceDataInline(admin.TabularInline):
    model = FaceData
    extra = 0
    readonly_fields = ['image']

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'first_name', 'last_name', 'department', 'shift', 'is_active']
    list_filter = ['department', 'shift', 'is_active']
    search_fields = ['employee_id', 'first_name', 'last_name', 'email']
    inlines = [FaceDataInline]

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']

@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_time', 'end_time']
    search_fields = ['name']

@admin.register(FaceData)
class FaceDataAdmin(admin.ModelAdmin):
    list_display = ['employee', 'created_at']
    list_filter = ['created_at']
    search_fields = ['employee__first_name', 'employee__last_name', 'employee__employee_id']
    readonly_fields = ['image']


