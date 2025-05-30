from django.urls import path, include
from rest_framework.routers import DefaultRouter
from employees.views import EmployeeViewSet, DepartmentViewSet, ShiftViewSet, FaceDataViewSet, UserProfileViewSet
from attendance.views import AttendanceViewSet
from .views import DashboardViewSet, login, register, change_password
from django.views.decorators.csrf import csrf_exempt

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'shifts', ShiftViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'face_data', FaceDataViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'users', UserProfileViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', csrf_exempt(login), name='login'),
    path('register/', register, name='register'),
    path('change-password/', change_password, name='change-password'),
] 