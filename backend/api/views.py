from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token

from employees.models import Employee, Department, UserProfile
from attendance.models import Attendance
from employees.serializers import UserProfileSerializer, EmployeeSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """API endpoint xử lý đăng nhập"""
    username = request.data.get('username')
    password = request.data.get('password')
    role = request.data.get('role')

    if not username or not password:
        return Response({
            'success': False,
            'error': 'Vui lòng nhập đầy đủ thông tin đăng nhập'
        }, status=400)

    user = authenticate(username=username, password=password)
    
    if not user:
        return Response({
            'success': False,
            'error': 'Tên đăng nhập hoặc mật khẩu không chính xác'
        }, status=401)

    try:
        user_profile = UserProfile.objects.get(username=username)
    except UserProfile.DoesNotExist:
        # Tự động tạo UserProfile cho admin nếu chưa có
        if user.is_staff:
            user_profile = UserProfile.objects.create(
                username=username,
                is_admin=True,
                is_user=False
            )
        else:
            user_profile = UserProfile.objects.create(
                username=username,
                is_admin=False,
                is_user=True
            )

    # Kiểm tra quyền truy cập
    if role == 'admin' and not user_profile.is_admin:
        return Response({
            'success': False,
            'error': 'Tài khoản này không có quyền truy cập quản trị'
        }, status=403)
    elif role == 'user' and not user_profile.is_user:
        return Response({
            'success': False,
            'error': 'Tài khoản này không có quyền truy cập người dùng'
        }, status=403)

    # Lấy hoặc tạo token
    token, created = Token.objects.get_or_create(user=user)

    # Lấy thông tin employee nếu có
    try:
        employee = Employee.objects.get(username=username)
        employee_data = EmployeeSerializer(employee).data
    except Employee.DoesNotExist:
        employee_data = None

    return Response({
        'success': True,
        'token': token.key,
        'user': {
            'username': user.username,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser
        },
        'employee': employee_data
    })

class DashboardViewSet(viewsets.ViewSet):
    """
    ViewSet cho Dashboard, cung cấp các API thống kê
    """
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Lấy thống kê tổng hợp cho dashboard"""
        try:
            user = request.user
            # Ngày hiện tại
            today = timezone.localdate()
            
            # Kiểm tra nếu là nhân viên thông thường
            if not user.is_staff and not user.is_superuser:
                try:
                    employee = Employee.objects.get(user=user)
                    # Thống kê cá nhân
                    today_present = Attendance.objects.filter(
                        employee=employee,
                        attendance_date=today
                    ).exists()
                    
                    checked_out_today = Attendance.objects.filter(
                        employee=employee,
                        attendance_date=today,
                        check_out_time__isnull=False
                    ).exists()
                    
                    currently_working = Attendance.objects.filter(
                        employee=employee,
                        attendance_date=today,
                        check_in_time__isnull=False,
                        check_out_time__isnull=True
                    ).exists()
                    
                    # Thống kê phòng ban của nhân viên
                    if employee.department:
                        department_employee_count = Employee.objects.filter(
                            department=employee.department, 
                            is_active=True
                        ).count()
                        
                        department_present_count = Attendance.objects.filter(
                            employee__department=employee.department,
                            attendance_date=today
                        ).count()
                    else:
                        department_employee_count = 0
                        department_present_count = 0
                    
                    return Response({
                        'employee_name': f"{employee.first_name} {employee.last_name}",
                        'employee_id': employee.employee_id,
                        'today_present': 1 if today_present else 0,
                        'checked_out': 1 if checked_out_today else 0,
                        'currently_working': 1 if currently_working else 0,
                        'department_name': employee.department.name if employee.department else None,
                        'department_employee_count': department_employee_count,
                        'department_present_count': department_present_count,
                        'department_attendance_rate': round((department_present_count / department_employee_count * 100) if department_employee_count > 0 else 0, 2)
                    })
                except Employee.DoesNotExist:
                    return Response({
                        'error': 'Không tìm thấy thông tin nhân viên'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # Nếu là admin, hiển thị toàn bộ thống kê
            # Tổng số nhân viên
            total_employees = Employee.objects.filter(is_active=True).count()
            
            # Tổng số nhân viên đi làm hôm nay
            today_present = Attendance.objects.filter(attendance_date=today).count()
            
            # Số nhân viên đã check-out hôm nay
            today_checked_out = Attendance.objects.filter(
                attendance_date=today, 
                check_out_time__isnull=False
            ).count()
            
            # Số nhân viên đang làm việc (đã check-in nhưng chưa check-out)
            currently_working = Attendance.objects.filter(
                attendance_date=today,
                check_in_time__isnull=False,
                check_out_time__isnull=True
            ).count()
            
            # Số phòng ban
            total_departments = Department.objects.count()
            
            return Response({
                'total_employees': total_employees,
                'today_present': today_present,
                'today_checked_out': today_checked_out,
                'currently_working': currently_working,
                'total_departments': total_departments,
                'attendance_rate': round((today_present / total_employees * 100) if total_employees > 0 else 0, 2)
            })
        except Exception as e:
            import traceback
            print(f"Lỗi khi lấy thống kê: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'error': str(e)
            }, status=500)
    
    @action(detail=False, methods=['get'])
    def attendance_summary(self, request):
        """Lấy thống kê tóm tắt điểm danh theo các ngày trong tuần"""
        try:
            user = request.user
            # Lấy các ngày trong tuần hiện tại
            today = timezone.localdate()
            start_of_week = today - timedelta(days=today.weekday())  # Monday
            
            # Nếu là nhân viên thông thường
            if not user.is_staff and not user.is_superuser:
                try:
                    employee = Employee.objects.get(user=user)
                    
                    # Tạo danh sách các ngày trong tuần
                    days = []
                    for i in range(7):  # 0 = Monday, 6 = Sunday
                        day = start_of_week + timedelta(days=i)
                        if day > today:
                            # Nếu ngày trong tương lai, không có dữ liệu
                            days.append({
                                'date': day.strftime('%Y-%m-%d'),
                                'day_name': day.strftime('%a'),
                                'count': 0,
                                'present': False
                            })
                        else:
                            # Kiểm tra xem nhân viên có đi làm vào ngày này không
                            present = Attendance.objects.filter(
                                employee=employee,
                                attendance_date=day
                            ).exists()
                            
                            days.append({
                                'date': day.strftime('%Y-%m-%d'),
                                'day_name': day.strftime('%a'),
                                'count': 1 if present else 0,
                                'present': present
                            })
                    
                    return Response({
                        'employee_id': employee.employee_id,
                        'days': days
                    })
                except Employee.DoesNotExist:
                    return Response({
                        'error': 'Không tìm thấy thông tin nhân viên'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # Nếu là admin, hiển thị thống kê toàn công ty
            # Tạo danh sách các ngày trong tuần
            days = []
            for i in range(7):  # 0 = Monday, 6 = Sunday
                day = start_of_week + timedelta(days=i)
                if day > today:
                    # Nếu ngày trong tương lai, không có dữ liệu
                    days.append({
                        'date': day.strftime('%Y-%m-%d'),
                        'day_name': day.strftime('%a'),
                        'count': 0
                    })
                else:
                    # Đếm số nhân viên đi làm vào ngày này
                    count = Attendance.objects.filter(attendance_date=day).count()
                    days.append({
                        'date': day.strftime('%Y-%m-%d'),
                        'day_name': day.strftime('%a'),
                        'count': count
                    })
            
            return Response({
                'days': days
            })
        except Exception as e:
            import traceback
            print(f"Lỗi khi lấy thống kê tóm tắt điểm danh: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'error': str(e)
            }, status=500)
    
    @action(detail=False, methods=['get'])
    def department_summary(self, request):
        """Lấy thống kê tóm tắt theo phòng ban"""
        try:
            user = request.user
            # Nếu là nhân viên thông thường
            if not user.is_staff and not user.is_superuser:
                try:
                    employee = Employee.objects.get(user=user)
                    
                    # Nếu nhân viên không thuộc phòng ban nào
                    if not employee.department:
                        return Response({
                            'departments': []
                        })
                    
                    # Chỉ hiển thị thông tin phòng ban của nhân viên
                    department = employee.department
                    total_employees = Employee.objects.filter(department=department, is_active=True).count()
                    
                    # Đếm số nhân viên đi làm hôm nay trong phòng ban
                    today = timezone.localdate()
                    present_today = Attendance.objects.filter(
                        employee__department=department,
                        attendance_date=today
                    ).count()
                    
                    departments = [{
                        'id': department.id,
                        'name': department.name,
                        'total_employees': total_employees,
                        'present_today': present_today,
                        'attendance_rate': round((present_today / total_employees * 100) if total_employees > 0 else 0, 2)
                    }]
                    
                    return Response({
                        'departments': departments
                    })
                except Employee.DoesNotExist:
                    return Response({
                        'error': 'Không tìm thấy thông tin nhân viên'
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # Nếu là admin, hiển thị thống kê toàn bộ phòng ban
            departments = []
            today = timezone.localdate()
            
            for department in Department.objects.all():
                total_employees = Employee.objects.filter(department=department, is_active=True).count()
                
                # Đếm số nhân viên đi làm hôm nay trong phòng ban
                present_today = Attendance.objects.filter(
                    employee__department=department,
                    attendance_date=today
                ).count()
                
                departments.append({
                    'id': department.id,
                    'name': department.name,
                    'total_employees': total_employees,
                    'present_today': present_today,
                    'attendance_rate': round((present_today / total_employees * 100) if total_employees > 0 else 0, 2)
                })
            
            return Response({
                'departments': departments
            })
        except Exception as e:
            import traceback
            print(f"Lỗi khi lấy thống kê tóm tắt theo phòng ban: {str(e)}")
            print(traceback.format_exc())
            return Response({
                'error': str(e)
            }, status=500)
