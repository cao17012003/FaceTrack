from django.core.exceptions import ValidationError
from django.conf import settings
import re

def validate_password_strength(password):
    """
    Custom password validator kiểm tra độ mạnh của mật khẩu
    """
    errors = []
    
    # Kiểm tra độ dài tối thiểu
    if len(password) < settings.PASSWORD_VALIDATION['MIN_LENGTH']:
        errors.append(f'Mật khẩu phải có ít nhất {settings.PASSWORD_VALIDATION["MIN_LENGTH"]} ký tự')
    
    # Kiểm tra chữ hoa
    if settings.PASSWORD_VALIDATION['REQUIRE_UPPERCASE'] and not re.search(r'[A-Z]', password):
        errors.append('Mật khẩu phải chứa ít nhất 1 chữ cái in hoa')
    
    # Kiểm tra chữ thường
    if settings.PASSWORD_VALIDATION['REQUIRE_LOWERCASE'] and not re.search(r'[a-z]', password):
        errors.append('Mật khẩu phải chứa ít nhất 1 chữ cái thường')
    
    # Kiểm tra số
    if settings.PASSWORD_VALIDATION['REQUIRE_NUMBERS'] and not re.search(r'\d', password):
        errors.append('Mật khẩu phải chứa ít nhất 1 số')
    
    # Kiểm tra ký tự đặc biệt
    if settings.PASSWORD_VALIDATION['REQUIRE_SPECIAL_CHARS'] and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*(),.?":{}|<>)')
    
    # Kiểm tra khoảng trắng
    if settings.PASSWORD_VALIDATION['NO_SPACES'] and ' ' in password:
        errors.append('Mật khẩu không được chứa khoảng trắng')
    
    if errors:
        raise ValidationError(errors) 