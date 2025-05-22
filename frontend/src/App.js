import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeeDashboardPage from './pages/EmployeeDashboardPage';
import CheckInPage from './pages/CheckInPage';
import AttendanceReportPage from './pages/AttendanceReportPage';
import NotificationsPage from './pages/NotificationsPage';
import EmployeesPage from './pages/EmployeesPage';
import DepartmentsPage from './pages/DepartmentsPage';
import ShiftsPage from './pages/ShiftsPage';
import CalendarPage from './pages/CalendarPage';
import AdminPage from './pages/AdminPage';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import HomePage from './pages/HomePage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import SupportPage from './pages/SupportPage';

// Route bảo vệ cho người dùng đã đăng nhập
const ProtectedRoute = ({ children }) => {
  // Kiểm tra nếu localStorage có 'username' (có thể điều chỉnh nếu AuthContext lưu dưới key khác)
  const isAuthenticated = localStorage.getItem('username') !== null;
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return children;
};

// Route bảo vệ cho admin
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  return children;
};

// Dashboard Route - Hiển thị dashboard dựa vào vai trò người dùng - phải ở trong functional component
const DashboardSelector = () => {
  const { isAdmin, isEmployee, currentUser } = useAuth();
  
  console.log("DashboardSelector - currentUser:", currentUser);
  console.log("DashboardSelector - isAdmin():", isAdmin());
  console.log("DashboardSelector - isEmployee():", isEmployee());
  
  if (isAdmin()) {
    console.log("Rendering AdminDashboard");
    return <DashboardPage />;
  } else if (isEmployee()) {
    console.log("Rendering EmployeeDashboard");
    return <EmployeeDashboardPage />;
  } else {
    // Fallback nếu không xác định được vai trò
    console.log("Rendering Fallback Dashboard");
    return <DashboardPage />;
  }
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Giả lập thời gian tải (1 giây)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px'
      }}>
        Đang tải ứng dụng...
      </div>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <CssBaseline />
        <AuthProvider>
          <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
            <Router>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route 
                  path="/admin" 
                  element={
                    <AdminRoute>
                      <Layout>
                        <AdminPage />
                      </Layout>
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <HomePage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/employees" 
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <Layout>
                        <EmployeesPage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/employees/:id" 
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <Layout>
                        <EmployeeDetailPage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/notifications" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <NotificationsPage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/departments" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <DepartmentsPage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/shifts" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ShiftsPage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/calendar" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <CalendarPage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/support" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <SupportPage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/check-in" 
                  element={
                    <ProtectedRoute roles={['user']}>
                      <Layout>
                        <CheckInPage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <AttendanceReportPage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/Attendance-Report" 
                  element={<Navigate to="/reports" />} 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </SnackbarProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
