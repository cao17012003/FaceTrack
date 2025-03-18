import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import themeConfig from '../theme';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Lấy trạng thái chế độ sáng/tối từ localStorage hoặc mặc định là 'light'
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });
  
  // Lưu chế độ vào localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    // Cập nhật thuộc tính data-theme cho thẻ body
    document.body.setAttribute('data-theme', mode);
  }, [mode]);
  
  // Chuyển đổi giữa chế độ sáng và tối
  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  // Đặt một chế độ cụ thể
  const setThemeMode = (newMode) => {
    if (newMode === 'light' || newMode === 'dark') {
      setMode(newMode);
    }
  };

  // Kiểm tra xem có đang ở chế độ tối hay không
  const isDarkMode = mode === 'dark';
  
  // Tạo theme dựa trên mode hiện tại
  const theme = themeConfig(mode);
  
  return (
    <ThemeContext.Provider value={{ mode, isDarkMode, toggleTheme, setThemeMode }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 