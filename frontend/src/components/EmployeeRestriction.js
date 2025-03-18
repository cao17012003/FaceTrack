import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Component kiểm tra xem nhân viên có được phép truy cập trang cụ thể không
const EmployeeRestriction = ({ children }) => {
  const { currentUser, isAdmin, isEmployee } = useAuth();

  // Nếu chưa đăng nhập, để component ProtectedRoute xử lý
  if (!currentUser) {
    return children;
  }

  // Nếu là admin, cho phép truy cập mọi trang
  if (isAdmin()) {
    return children;
  }

  // Nếu là nhân viên, kiểm tra xem đang ở trang được phép hay không
  if (isEmployee()) {
    // Lấy đường dẫn hiện tại
    const currentPath = window.location.pathname;
    
    // Các đường dẫn nhân viên được phép truy cập
    const allowedPaths = [
      '/',
      '/check-in',
      '/attendance-reports',
      '/login',
      '/profile'
    ];
    
    // Kiểm tra xem đường dẫn hiện tại có nằm trong danh sách cho phép không
    const isAllowedPath = allowedPaths.some(path => 
      currentPath === path || currentPath.startsWith('/attendance-reports')
    );
    
    if (isAllowedPath) {
      return children;
    } else {
      // Nếu không được phép, chuyển hướng về trang chủ
      return <Navigate to="/" />;
    }
  }

  // Mặc định cho phép truy cập (không nên xảy ra)
  return children;
};

export default EmployeeRestriction; 