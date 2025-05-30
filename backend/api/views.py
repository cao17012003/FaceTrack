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
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.conf import settings
from .validators import validate_password_strength

from employees.models import Employee, Department, UserProfile
from attendance.models import Attendance
from employees.serializers import UserProfileSerializer, EmployeeSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """API endpoint xử lý đăng ký tài khoản mới"""
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    role = request.data.get('role', 'user')  # Mặc định là user

    if not username or not password:
        return Response({
            'success': False,
            'error': 'Vui lòng nhập đầy đủ thông tin đăng ký'
        }, status=400)

    # Kiểm tra username đã tồn tại chưa
    if User.objects.filter(username=username).exists():
        return Response({
            'success': False,
            'error': 'Tên đăng nhập đã tồn tại'
        }, status=400)

    try:
        # Tạo user mới
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_staff=(role == 'admin')
        )

        # Tạo UserProfile
        UserProfile.objects.create(
            user=user,  # Sử dụng user thay vì username
            is_admin=(role == 'admin'),
            is_user=(role == 'user')
        )

        return Response({
            'success': True,
            'message': 'Đăng ký tài khoản thành công'
        }, status=201)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=400)

@csrf_exempt
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

    # Xác thực user
    user = authenticate(username=username, password=password)
    
    # Nếu không tìm thấy user thông thường, kiểm tra xem có phải là employee ID không
    if not user:
        try:
            # Chỉ kiểm tra employee khi password và username giống nhau (xử lý login lần đầu)
            # Điều này đảm bảo người dùng không thể sử dụng ID nhân viên để đăng nhập sau khi đã đổi mật khẩu
            if username == password:
                # Kiểm tra xem có employee với ID này không
                employee = Employee.objects.get(employee_id=username)
                if employee.username:
                    # Nếu employee có liên kết với user, chỉ tiếp tục nếu user chưa đổi mật khẩu
                    user_obj = employee.username
                    # Kiểm tra xem mật khẩu ban đầu có phải là employee_id không
                    if user_obj.check_password(username):
                        user = user_obj
                else:
                    # Nếu employee chưa có user, tạo mới
                    user_obj = User.objects.create_user(
                        username=username,
                        password=username,  # Mật khẩu giống với employee_id
                        first_name=employee.first_name,
                        last_name=employee.last_name,
                        email=employee.email if employee.email else ''
                    )
                    # Liên kết employee với user
                    employee.username = user_obj
                    employee.save()
                    user = user_obj
        except Employee.DoesNotExist:
            # Không tìm thấy employee có ID này
            pass
    
    if not user:
        return Response({
            'success': False,
            'error': 'Tên đăng nhập hoặc mật khẩu không chính xác'
        }, status=401)

    try:
        user_profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        # Tự động tạo UserProfile nếu chưa có
        user_profile = UserProfile.objects.create(
            user=user,
            is_admin=user.is_staff,
            is_user=not user.is_staff
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
        employee = Employee.objects.filter(username=user).first()  # Sử dụng filter().first() thay vì get()
        employee_data = EmployeeSerializer(employee).data if employee else None
    except Exception as e:
        print(f"Lỗi khi lấy thông tin employee: {str(e)}")
        employee_data = None

    # Serialize UserProfile để gửi về client
    user_profile_data = {
        'id': user_profile.id,
        'is_admin': user_profile.is_admin,
        'is_user': user_profile.is_user
    }

    return Response({
        'success': True,
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email
        },
        'user_profile': user_profile_data,
        'employee': employee_data
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """API endpoint xử lý đổi mật khẩu"""
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response({
            'success': False,
            'error': 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới',
            'sample_password': settings.PASSWORD_VALIDATION['SAMPLE_PASSWORD']
        }, status=400)
    
    # Kiểm tra mật khẩu cũ
    if not user.check_password(old_password):
        return Response({
            'success': False,
            'error': 'Mật khẩu hiện tại không chính xác',
            'sample_password': settings.PASSWORD_VALIDATION['SAMPLE_PASSWORD']
        }, status=400)
    
    # Kiểm tra điều kiện password mới
    try:
        validate_password(new_password, user=user)
        validate_password_strength(new_password)
    except ValidationError as e:
        return Response({
            'success': False,
            'error': 'Mật khẩu mới không hợp lệ',
            'password_errors': e.messages,
            'sample_password': settings.PASSWORD_VALIDATION['SAMPLE_PASSWORD']
        }, status=400)
    
    # Đặt mật khẩu mới
    user.set_password(new_password)
    user.save()
    
    # Xóa tất cả các token hiện tại để đảm bảo người dùng phải đăng nhập lại với mật khẩu mới
    Token.objects.filter(user=user).delete()
    
    # Tạo token mới
    token, _ = Token.objects.get_or_create(user=user)
    
    # Buộc hết hạn các phiên làm việc Django
    from django.contrib.sessions.models import Session
    from django.contrib.auth import logout
    
    try:
        # Xóa hết session nếu có thể để đảm bảo người dùng phải đăng nhập lại
        for session in Session.objects.all():
            session_data = session.get_decoded()
            if session_data.get('_auth_user_id') == str(user.id):
                session.delete()
    except:
        # Bỏ qua lỗi nếu xảy ra khi xử lý session
        pass
    
    return Response({
        'success': True,
        'message': 'Đổi mật khẩu thành công. Vui lòng sử dụng mật khẩu mới để đăng nhập lại.',
        'token': token.key
    })

class DashboardViewSet(viewsets.ViewSet):
    """
    ViewSet cho Dashboard, cung cấp các API thống kê
    """
    permission_classes = [IsAuthenticated]  # Bắt buộc đăng nhập để xem dữ liệu
    
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
                    employee = Employee.objects.get(username=user)
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
                    employee = Employee.objects.get(username=user)
                    
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
                    employee = Employee.objects.get(username=user)
                    
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
                        'id': department.name,
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
                    'id': department.name,
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
