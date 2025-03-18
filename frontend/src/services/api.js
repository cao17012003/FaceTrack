import axios from 'axios';

const API_URL = 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

// API cho nhân viên
export const employeeApi = {
  getAll: () => api.get('/employees/'),
  getById: (id) => api.get(`/employees/${id}/`),
  create: (data) => api.post('/employees/', data),
  update: (id, data) => api.put(`/employees/${id}/`, data),
  delete: (id) => api.delete(`/employees/${id}/`),
  getFaceData: (id) => api.get(`/employees/${id}/face_data/`),
  deleteFaceData: (faceId) => api.delete(`/face_data/${faceId}/`),
  registerFace: (id, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post(`/employees/${id}/register_face/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  recognizeFace: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('/employees/recognize_face/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// API cho phòng ban
export const departmentApi = {
  getAll: () => api.get('/departments/'),
  getById: (id) => api.get(`/departments/${id}/`),
  create: (data) => api.post('/departments/', data),
  update: (id, data) => api.put(`/departments/${id}/`, data),
  delete: (id) => api.delete(`/departments/${id}/`),
};

// API cho ca làm việc
export const shiftApi = {
  getAll: () => api.get('/shifts/'),
  getById: (id) => api.get(`/shifts/${id}/`),
  create: (data) => api.post('/shifts/', data),
  update: (id, data) => api.put(`/shifts/${id}/`, data),
  delete: (id) => api.delete(`/shifts/${id}/`),
};

// API cho chấm công
export const attendanceApi = {
  getAll: (params) => api.get('/attendance/', { params }),
  getById: (id) => api.get(`/attendance/${id}/`),
  create: (data) => api.post('/attendance/', data),
  update: (id, data) => api.put(`/attendance/${id}/`, data),
  delete: (id) => api.delete(`/attendance/${id}/`),
  checkInOut: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('/attendance/check_in_out/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getReport: (params) => api.get('/attendance/report/', { params }),
  getToday: () => api.get('/attendance/today/'),
  getStats: () => api.get('/attendance/stats/'),
  getWeeklyStats: () => api.get('/attendance/weekly_stats/'),
};

// API cho dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats/'),
  getAttendanceSummary: () => api.get('/dashboard/attendance_summary/'),
  getDepartmentSummary: () => api.get('/dashboard/department_summary/'),
};

// API cho thông báo
export const notificationApi = {
  getAll: (params) => api.get('/notifications/', { params }),
  getById: (id) => api.get(`/notifications/${id}/`),
  create: (data) => api.post('/notifications/', data),
  update: (id, data) => api.put(`/notifications/${id}/`, data),
  delete: (id) => api.delete(`/notifications/${id}/`),
  markAsRead: (id) => api.post(`/notifications/${id}/mark_as_read/`),
  markAllAsRead: (employeeId) => api.post('/notifications/mark_all_as_read/', { employee_id: employeeId }),
  getUnreadCount: (employeeId) => api.get('/notifications/unread_count/', { params: { employee_id: employeeId } }),
};

export default {
  employee: employeeApi,
  department: departmentApi,
  shift: shiftApi,
  attendance: attendanceApi,
  dashboard: dashboardApi,
  notification: notificationApi
}; 