import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Component bảo vệ route chỉ cho phép người dùng đã đăng nhập truy cập
const ProtectedRoute = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
    return <Navigate to="/login" />;
  }

  // Nếu đã đăng nhập, hiển thị component con bên trong route
  return <Outlet />;
};

export default ProtectedRoute; 