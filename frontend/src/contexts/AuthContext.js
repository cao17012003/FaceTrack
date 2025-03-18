import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xem có thông tin đăng nhập trong localStorage không
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Lỗi khi đọc dữ liệu đăng nhập:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      console.log(`Đang đăng nhập với username: ${username} tại ${API_BASE_URL}/api/login/`);
      
      const response = await axios.post(`${API_BASE_URL}/api/login/`, {
        username,
        password
      });
      
      console.log('Phản hồi từ server:', response.data);

      if (response.data.success) {
        const userData = response.data;
        console.log('Đăng nhập thành công:', userData);
        setCurrentUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
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
    localStorage.removeItem('user');
  };

  // Kiểm tra xem người dùng hiện tại có phải là admin không
  const isAdmin = () => {
    // Tạm thời trả về true cho tất cả người dùng để test
    return true;
    // return currentUser && currentUser.user && currentUser.user.is_staff === true;
  };

  // Kiểm tra xem người dùng hiện tại có phải là nhân viên không
  const isEmployee = () => {
    return true;
    // return currentUser && currentUser.employee !== undefined;
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
      isEmployee: isEmployee()
    };
    
    if (isEmployee()) {
      userInfo.employeeId = currentUser.employee.employee_id;
      userInfo.department = currentUser.employee.department;
      userInfo.shift = currentUser.employee.shift;
    }
    
    return userInfo;
  };

  // Lấy employee_id của người dùng hiện tại
  const getEmployeeId = () => {
    // Hardcode employee_id cho mục đích test
    return "21011801";
    
    /* Bình thường sẽ là:
    if (isEmployee() && currentUser && currentUser.employee) {
      return currentUser.employee.employee_id;
    }
    return null;
    */
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