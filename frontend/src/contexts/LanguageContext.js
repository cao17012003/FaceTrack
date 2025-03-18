import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_LANGUAGE } from '../config';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  // Khởi tạo ngôn ngữ từ localStorage hoặc mặc định (vi)
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem('language');
    return savedLang || DEFAULT_LANGUAGE || 'vi';
  });
  
  // Lưu ngôn ngữ vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem('language', language);
    // Cập nhật thuộc tính lang cho thẻ html
    document.documentElement.lang = language;
  }, [language]);
  
  // Hàm thay đổi ngôn ngữ
  const changeLanguage = (newLang) => {
    if (newLang) {
      setLanguage(newLang);
    }
  };
  
  const value = {
    language,
    changeLanguage
  };
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext; 