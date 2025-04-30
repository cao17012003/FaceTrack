from django.contrib import admin
from .models import SupportTicket, Message, Attachment

class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['created_at', 'is_read', 'is_from_admin']

class AttachmentInline(admin.TabularInline):
    model = Attachment
    extra = 0
    readonly_fields = ['uploaded_at']
    fields = ['file', 'filename', 'uploaded_at']

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'employee', 'status', 'priority', 'created_at', 'updated_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['title', 'description', 'employee__first_name', 'employee__last_name', 'employee__employee_id']
    date_hierarchy = 'created_at'
    inlines = [MessageInline, AttachmentInline]
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'ticket', 'sender', 'is_from_admin', 'is_read', 'created_at']
    list_filter = ['is_read', 'is_from_admin', 'created_at']
    search_fields = ['content', 'sender__username', 'ticket__title']
    date_hierarchy = 'created_at'
    inlines = [AttachmentInline]
    readonly_fields = ['created_at', 'is_read']

@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'filename', 'message', 'ticket', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['filename']
    date_hierarchy = 'uploaded_at'
    readonly_fields = ['uploaded_at']
