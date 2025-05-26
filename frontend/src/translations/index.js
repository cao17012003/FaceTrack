// English translations for the application
export const translations = {
  // Menu and navigation
  menu: {
    home: "",
    checkin: "Check In",
    employees: "Employees",
    departments: "Departments",
    shifts: "Shifts",
    reports: "Attendance Reports",
    calendar: "Calendar",
    notifications: "Notifications",
    support: "Support & Complaints"
  },
  // Common
  common: {
    appName: "Face Recognition Attendance System",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    add: "Add New",
    search: "Search",
    filter: "Filter",
    yes: "Yes",
    no: "No",
    confirm: "Confirm",
    success: "Success",
    error: "Error",
    all: "All",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    toggleTheme: "Toggle Light/Dark Mode",
    userMenu: "User Menu",
    logout: "Logout",
    profile: "Profile",
    accessDenied: "Access Denied",
    permissionError: "You don't have permission to access this page",
    noData: "No data available"
  },
  // Login
  login: {
    title: "Login",
    username: "Username",
    password: "Password",
    submit: "Login",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    requiredFields: "Please enter both username and password",
    invalidCredentials: "Invalid username or password",
    loginSuccess: "Login successful",
    testCredentials: "Test credentials"
  },
  // Home
  home: {
    welcome: "Welcome",
    quickAccess: "Quick Access",
    goTo: "Access",
    checkInDescription: "Check in using face recognition technology",
    reportsDescription: "View your attendance reports",
    employeesDescription: "Manage employee information",
    departmentsDescription: "Manage department information",
    shiftsDescription: "Manage work shifts",
    calendarDescription: "View attendance calendar",
    employeeNotice: "Employee Notice",
    employeeInfo: "You only have access to the check-in page and your attendance reports. For more information, please contact the administrator.",
    adminNotice: "Administrator Notice",
    adminInfo: "As an administrator, you have full access to all features of the system."
  },
  // Check-in
  checkin: {
    title: "Check In",
    faceDetection: "Face Detection",
    checkInButton: "Check In",
    checkOutButton: "Check Out",
    noFaceDetected: "No face detected",
    multipleFaces: "Multiple faces detected",
    lookAtCamera: "Please look at the camera",
    processing: "Processing...",
    success: "Check-in successful",
    failure: "Check-in failed",
    employee: "Employee",
    time: "Time",
    date: "Date",
    status: "Status",
    onTime: "On Time",
    late: "Late",
    earlyLeave: "Left Early"
  },
  // Calendar
  calendar: {
    title: "Attendance Calendar",
    view: "View",
    month: "Month",
    week: "Week",
    day: "Day",
    list: "List",
    employee: "Employee",
    department: "Department",
    checkInEvent: "In",
    checkOutEvent: "Out",
    details: "Attendance Details",
    employeeId: "Employee ID",
    date: "Date",
    time: "Time",
    type: "Type",
    checkinType: "Check In",
    checkoutType: "Check Out",
    statusLate: "Late",
    statusEarly: "Left Early",
    statusOnTime: "On Time",
    previous: "Previous",
    next: "Next",
    today: "Today",
    showMore: "more events",
    errorFetchingData: "Error loading attendance data",
    startDate: "Start Date",
    endDate: "End Date"
  },
  // Report
  report: {
    title: "Attendance Report",
    personalReport: "Personal Report",
    onlyViewOwn: "You can only view your own attendance report"
  }
};

// Hook for easy use in components
import { useLanguage } from '../contexts/LanguageContext';

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key) => {
    // Support for nested keys like 'menu.home'
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        // Return key if translation not found
        return key;
      }
    }
    
    return value;
  };
  
  return { t, language };
}; 