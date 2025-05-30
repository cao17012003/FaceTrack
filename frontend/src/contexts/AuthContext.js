import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY, USER_DATA_KEY } from '../config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xem có thông tin đăng nhập trong localStorage không
    const savedUser = localStorage.getItem(USER_DATA_KEY);
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Lỗi khi đọc dữ liệu đăng nhập:', error);
        localStorage.removeItem(USER_DATA_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password, role) => {
    try {
      // Use relative URL since we have proxy configured
      const loginUrl = '/api/login/';
      console.log(`Đang đăng nhập với username: ${username} và role: ${role} tại ${loginUrl}`);
      
      const response = await axios.post(loginUrl, {
        username,
        password,
        role
      });
      
      console.log('Phản hồi từ server:', response.data);

      if (response.data.success) {
        // Kiểm tra xem vai trò người dùng có khớp với vai trò đã chọn không
        const userProfile = response.data.user_profile || {};
        
        const isUserAdmin = userProfile.is_admin || false;
        const isUserEmployee = userProfile.is_user || false;
        
        // Kiểm tra quyền truy cập theo vai trò đã chọn khi đăng nhập
        if (role === 'admin' && !isUserAdmin) {
          throw new Error('Tài khoản này không có quyền truy cập với vai trò Quản trị viên');
        } else if (role === 'user' && !isUserEmployee) {
          throw new Error('Tài khoản này không có quyền truy cập với vai trò Nhân viên');
        }

        const userData = {
          ...response.data,
          role: role  // Lưu đúng vai trò mà người dùng đã chọn khi đăng nhập
        };
        
        console.log('Đăng nhập thành công:', userData);
        setCurrentUser(userData);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
        return userData;
      } else {
        console.error('Lỗi đăng nhập (success=false):', response.data.error);
        throw new Error(response.data.error || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      
      if (error.response) {
        console.error('Chi tiết lỗi từ server:', error.response.data);
        console.error('Mã trạng thái:', error.response.status);
        throw new Error(error.response.data.error || 'Đăng nhập thất bại');
      } else if (error.request) {
        console.error('Không nhận được phản hồi từ server:', error.request);
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      }
      throw error;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  };

  // Kiểm tra xem người dùng hiện tại có phải là admin không
  const isAdmin = () => {
    if (!currentUser) return false;
    return currentUser.role === 'admin';
  };

  // Kiểm tra xem người dùng hiện tại có phải là nhân viên không
  const isEmployee = () => {
    if (!currentUser) return false;
    return currentUser.role === 'user';
  };

  // Lấy thông tin đầy đủ của người dùng
  const getUserInfo = () => {
    if (!currentUser) return null;
    
    const userInfo = {
      fullName: currentUser.user 
        ? `${currentUser.user.first_name || ''} ${currentUser.user.last_name || ''}`.trim() 
        : 'Người dùng',
      username: currentUser.user ? currentUser.user.username : '',
      email: currentUser.user ? currentUser.user.email : '',
      isAdmin: isAdmin(),
      isEmployee: isEmployee(),
      role: currentUser.role
    };
    
    if (isEmployee()) {
      userInfo.employeeId = currentUser.employee?.employee_id;
      userInfo.department = currentUser.employee?.department;
      userInfo.shift = currentUser.employee?.shift;
    }
    
    return userInfo;
  };

  // Lấy employee_id của người dùng hiện tại
  const getEmployeeId = () => {
    if (isEmployee() && currentUser && currentUser.employee) {
      return currentUser.employee.employee_id;
    }
    return null;
  };

  const value = {
    currentUser,
    login,
    logout,
    isAdmin,
    isEmployee,
    getUserInfo,
    getEmployeeId
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext; 