from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.first_name')
    
    class Meta:
        model = Notification
        fields = ['id', 'employee', 'employee_name', 'title', 'message', 
                  'type', 'is_read', 'created_at', 'updated_at']
        
class NotificationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['employee', 'title', 'message', 'type'] 