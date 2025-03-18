import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Component bảo vệ route chỉ cho phép người dùng admin truy cập
const AdminRoute = () => {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser) {
    // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
    return <Navigate to="/login" />;
  }

  if (!isAdmin()) {
    // Nếu không phải admin, chuyển hướng về trang chủ
    return <Navigate to="/" />;
  }

  // Nếu là admin, hiển thị component con bên trong route
  return <Outlet />;
};

export default AdminRoute; 