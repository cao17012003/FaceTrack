from django.contrib import admin
from .models import Attendance

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'attendance_date', 'check_in_time', 'check_out_time', 'status', 'working_hours')
    list_filter = ('attendance_date', 'employee__department')
    search_fields = ('employee__first_name', 'employee__last_name', 'employee__employee_id')
    date_hierarchy = 'attendance_date'
    readonly_fields = ('created_at', 'updated_at')
    
    def status(self, obj):
        """Trả về trạng thái hiện tại của điểm danh"""
        return obj.status
    
    def working_hours(self, obj):
        """Trả về số giờ làm việc được tính toán"""
        hours = obj.working_hours
        if hours > 0:
            return f"{hours:.2f} giờ"
        return "N/A"
    
    working_hours.short_description = "Giờ làm việc"
    status.short_description = "Trạng thái"
