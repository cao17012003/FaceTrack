from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('employees.urls')),
    path('api/', include('attendance.urls')),
    path('api/', include('authentication.urls')),
    path('api/', include('notifications.urls')),
    
    # Static và media URLs
    path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT}),
] 