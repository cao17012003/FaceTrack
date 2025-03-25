// src/services/auth.js

// Hàm giả lập lấy thông tin user hiện tại
export const getCurrentUser = async () => {
  try {
    // Đây là implement giả lập
    // Trong thực tế, bạn sẽ lấy từ localStorage, context, hoặc gọi API
    const username = localStorage.getItem('username') || 'default_user';
    return {
      username: username
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return {
      username: 'default_user' // Giá trị mặc định nếu có lỗi
    };
  }
};

// Hàm để set username (tùy chọn, dùng khi login)
export const setCurrentUser = (username) => {
  localStorage.setItem('username', username);
};

// Hàm để clear user (tùy chọn, dùng khi logout)
export const clearCurrentUser = () => {
  localStorage.removeItem('username');
};