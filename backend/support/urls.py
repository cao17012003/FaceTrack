from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupportTicketViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'tickets', SupportTicketViewSet, basename='support-ticket')
router.register(r'messages', MessageViewSet, basename='support-message')

# URL patterns cho các actions đặc biệt
special_patterns = [
    path('tickets/my_tickets/', SupportTicketViewSet.as_view({'get': 'my_tickets'}), name='my-tickets'),
]

urlpatterns = special_patterns + [
    path('', include(router.urls)),
] 