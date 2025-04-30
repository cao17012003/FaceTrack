import axios from 'axios';
import { AUTH_TOKEN_KEY } from '../config';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Timeout after 10 seconds
});

// Interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config.url,
        method: error.config.method,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('API Error Request:', {
        request: error.request,
        url: error.config?.url,
        method: error.config?.method
      });
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Thêm interceptor cho token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  
  // Log request để debug
  if (process.env.NODE_ENV !== 'production') {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
  }
  
  return config;
});

// Hàm retry khi gặp lỗi 500
const apiWithRetry = async (apiCall, maxRetries = 2) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed for API call`);
      lastError = error;
      
      // Chỉ retry nếu là lỗi 500 hoặc network error
      if (
        !error.response || 
        error.response.status !== 500 && 
        !error.message.includes('Network Error')
      ) {
        throw error;
      }
      
      // Chờ 1 giây trước khi thử lại
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw lastError;
};

// API cho xác thực
export const authApi = {
  login: (data) => api.post('/login/', data),
  register: (data) => api.post('/register/', data),
};

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
  // API lấy thông tin nhân viên hiện tại đang đăng nhập
  getCurrentEmployee: () => api.get('/employees/current/'),
};

// API cho phòng ban
export const departmentApi = {
  getAll: (params) => api.get('/departments/', { params }),
  getById: (id) => api.get(`/departments/${id}/`),
  create: (data) => api.post('/departments/', data),
  update: (id, data) => api.put(`/departments/${id}/`, data),
  delete: (id) => api.delete(`/departments/${id}/`),
};

// API cho ca làm việc
export const shiftApi = {
  getAll: (params) => api.get('/shifts/', { params }),
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
  // Lấy dữ liệu điểm danh dạng lịch
  getCalendarReport: (startDate, endDate, employeeId) => {
    const params = { start_date: startDate, end_date: endDate };
    if (employeeId) params.employee_id = employeeId;
    return api.get('/attendance/calendar_report/', { params });
  },
  // Lấy lịch sử điểm danh gần đây của nhân viên
  getRecentAttendance: (limit = 10) => api.get('/attendance/recent/', { params: { limit } }),
  // Lấy thông tin điểm danh hôm nay của nhân viên
  getTodayAttendance: () => api.get('/attendance/employee_today/'),
};

// API cho dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats/'),
  getAttendanceSummary: () => api.get('/dashboard/attendance_summary/'),
  getDepartmentSummary: () => api.get('/dashboard/department_summary/'),
  // Dashboard cá nhân hóa cho nhân viên
  getEmployeeStats: () => api.get('/dashboard/employee_stats/'),
  // Lấy dữ liệu điểm danh tùy chỉnh theo khoảng thời gian
  getCustomStats: (startDate, endDate) => api.get('/dashboard/custom_stats/', { 
    params: { start_date: startDate, end_date: endDate } 
  }),
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

// API cho hỗ trợ và khiếu nại
export const supportApi = {
  // Tickets
  getAllTickets: (params) => api.get('/tickets/', { params }),
  
  // Thêm cơ chế fallback cho getTicketById
  getTicketById: async (id) => {
    try {
      // Thử lấy thông tin chi tiết ticket
      return await apiWithRetry(() => api.get(`/tickets/${id}/`));
    } catch (error) {
      console.log(`Lỗi khi tải ticket ${id} trực tiếp:`, error);
      
      // Khởi tạo ticket mặc định trong trường hợp tất cả các phương án đều thất bại
      let fallbackTicket = {
        id: parseInt(id),
        title: `Yêu cầu hỗ trợ #${id}`,
        description: "Không thể tải chi tiết yêu cầu hỗ trợ do lỗi máy chủ.",
        status: 'open',
        created_at: new Date().toISOString(),
        _fromFallback: true,
        _error: error.message
      };
      
      try {
        // Thử lấy từ localStorage trước
        const cachedTickets = localStorage.getItem('cached_tickets');
        if (cachedTickets) {
          const tickets = JSON.parse(cachedTickets);
          const foundTicket = tickets.find(t => t.id === parseInt(id));
          
          if (foundTicket) {
            console.log(`Tìm thấy ticket ${id} trong cache!`);
            return {
              data: {
                ...foundTicket,
                _fromFallback: true,
                _source: 'cache'
              }
            };
          }
        }
        
        // Thử lấy từ danh sách tickets
        console.log(`Tìm trong danh sách tickets...`);
        const listResponse = await api.get('/tickets/my_tickets/');
        
        if (listResponse && listResponse.data && Array.isArray(listResponse.data)) {
          // Lưu vào cache cho lần sau
          localStorage.setItem('cached_tickets', JSON.stringify(listResponse.data));
          
          const foundTicket = listResponse.data.find(t => t.id === parseInt(id));
          
          if (foundTicket) {
            console.log(`Tìm thấy ticket ${id} trong danh sách!`);
            return {
              data: {
                ...foundTicket,
                _fromFallback: true,
                _source: 'list'
              }
            };
          }
        }
      } catch (fallbackError) {
        console.error('Tất cả các phương án fallback đều thất bại:', fallbackError);
      }
      
      // Trả về ticket mặc định nếu tất cả đều thất bại
      console.log(`Sử dụng ticket mặc định cho ID ${id}`);
      return {
        data: fallbackTicket
      };
    }
  },
  
  createTicket: (data) => api.post('/tickets/', data),
  updateTicket: (id, data) => api.put(`/tickets/${id}/`, data),
  deleteTicket: (id) => api.delete(`/tickets/${id}/`),
  changeTicketStatus: (id, status) => api.post(`/tickets/${id}/change_status/`, { status }),
  assignTicket: (id, adminId) => api.post(`/tickets/${id}/assign/`, { admin_id: adminId }),
  getTicketStats: () => api.get('/tickets/stats/'),
  
  getMyTickets: async (params) => {
    try {
      const response = await api.get('/tickets/my_tickets/', { params });
      
      // Lưu vào cache cho xử lý fallback
      if (response && response.data && Array.isArray(response.data)) {
        localStorage.setItem('cached_tickets', JSON.stringify(response.data));
      }
      
      return response;
    } catch (error) {
      console.error('Lỗi khi tải danh sách ticket:', error);
      
      // Thử lấy từ cache nếu có lỗi
      const cachedTickets = localStorage.getItem('cached_tickets');
      if (cachedTickets) {
        console.log('Sử dụng danh sách ticket từ cache');
        return {
          data: JSON.parse(cachedTickets),
          _fromFallback: true
        };
      }
      
      // Nếu không có cache, ném lỗi
      throw error;
    }
  },
  
  // Messages - thêm cơ chế fallback
  getMessages: async (ticketId) => {
    try {
      const response = await apiWithRetry(() => api.get('/messages/', { params: { ticket_id: ticketId } }));
      
      // Lưu cache tin nhắn cho ticket này
      if (response && response.data) {
        const cacheKey = `messages_${ticketId}`;
        localStorage.setItem(cacheKey, JSON.stringify(response.data));
      }
      
      return response;
    } catch (error) {
      console.error(`Không thể tải tin nhắn cho ticket ${ticketId}:`, error);
      
      // Thử lấy từ cache
      const cacheKey = `messages_${ticketId}`;
      const cachedMessages = localStorage.getItem(cacheKey);
      
      if (cachedMessages) {
        console.log(`Sử dụng tin nhắn từ cache cho ticket ${ticketId}`);
        return {
          data: JSON.parse(cachedMessages),
          _fromFallback: true,
          _source: 'cache'
        };
      }
      
      // Nếu không có cache, trả về mảng trống
      return {
        data: [],
        _fromFallback: true,
        _source: 'empty'
      };
    }
  },
  
  sendMessage: async (data) => {
    // Lưu tin nhắn dự phòng trước khi gửi
    const pendingMessage = {
      ...data,
      id: `temp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      attempts: 0,
      status: 'sending'
    };
    
    // Thêm vào danh sách tin nhắn đang chờ
    const pendingMessages = JSON.parse(localStorage.getItem('pendingMessages') || '[]');
    pendingMessages.push(pendingMessage);
    localStorage.setItem('pendingMessages', JSON.stringify(pendingMessages));
    
    try {
      // Thử gửi tin nhắn
      const response = await apiWithRetry(() => api.post('/messages/', data));
      
      // Nếu gửi thành công, xóa tin nhắn khỏi danh sách đang chờ
      const updatedPendingMessages = JSON.parse(localStorage.getItem('pendingMessages') || '[]');
      const filteredMessages = updatedPendingMessages.filter(
        msg => !(msg.ticket === data.ticket && msg.content === data.content && msg.id === pendingMessage.id)
      );
      localStorage.setItem('pendingMessages', JSON.stringify(filteredMessages));
      
      // Cập nhật cache tin nhắn
      try {
        const cacheKey = `messages_${data.ticket}`;
        const cachedMessages = JSON.parse(localStorage.getItem(cacheKey) || '[]');
        
        if (response && response.data) {
          cachedMessages.push(response.data);
          localStorage.setItem(cacheKey, JSON.stringify(cachedMessages));
        }
      } catch (cacheErr) {
        console.error('Lỗi khi cập nhật cache tin nhắn:', cacheErr);
      }
      
      return response;
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      
      // Cập nhật trạng thái tin nhắn đang chờ
      const updatedPendingMessages = JSON.parse(localStorage.getItem('pendingMessages') || '[]');
      const updatedMessages = updatedPendingMessages.map(msg => {
        if (msg.id === pendingMessage.id) {
          return {
            ...msg,
            attempts: msg.attempts + 1,
            status: 'failed',
            error: error.message
          };
        }
        return msg;
      });
      localStorage.setItem('pendingMessages', JSON.stringify(updatedMessages));
      
      // Vẫn ném lỗi để UI xử lý hiển thị lỗi
      throw error;
    }
  },
  
  // Thêm phương thức để gửi lại các tin nhắn đang chờ xử lý
  retrySendPendingMessages: async () => {
    const pendingMessages = JSON.parse(localStorage.getItem('pendingMessages') || '[]');
    
    if (pendingMessages.length === 0) {
      return { success: true, count: 0 };
    }
    
    const results = [];
    const remainingMessages = [];
    
    for (const message of pendingMessages) {
      try {
        // Nếu đã thử hơn 5 lần, bỏ qua
        if (message.attempts >= 5) {
          console.log(`Bỏ qua tin nhắn đã thử ${message.attempts} lần:`, message);
          continue;
        }
        
        // Thử gửi tin nhắn
        const response = await api.post('/messages/', {
          ticket: message.ticket,
          content: message.content,
          sender: message.sender
        });
        
        results.push({ success: true, message, response });
        
        // Cập nhật cache tin nhắn
        try {
          const cacheKey = `messages_${message.ticket}`;
          const cachedMessages = JSON.parse(localStorage.getItem(cacheKey) || '[]');
          
          if (response && response.data) {
            cachedMessages.push(response.data);
            localStorage.setItem(cacheKey, JSON.stringify(cachedMessages));
          }
        } catch (cacheErr) {
          console.error('Lỗi khi cập nhật cache tin nhắn:', cacheErr);
        }
      } catch (error) {
        console.error('Vẫn không thể gửi tin nhắn:', error);
        
        // Tăng số lần thử
        const updatedMessage = {
          ...message,
          attempts: (message.attempts || 0) + 1,
          lastAttempt: new Date().toISOString(),
          error: error.message
        };
        
        remainingMessages.push(updatedMessage);
        results.push({ success: false, message: updatedMessage, error });
      }
    }
    
    // Cập nhật localStorage
    localStorage.setItem('pendingMessages', JSON.stringify(remainingMessages));
    
    return {
      success: results.every(r => r.success),
      total: pendingMessages.length,
      sent: results.filter(r => r.success).length,
      pending: remainingMessages.length,
      results
    };
  },
  
  // Tải tin nhắn offline cho một ticket
  getPendingMessages: (ticketId) => {
    try {
      const allPendingMessages = JSON.parse(localStorage.getItem('pendingMessages') || '[]');
      return allPendingMessages.filter(msg => msg.ticket === ticketId);
    } catch (err) {
      console.error('Lỗi khi tải tin nhắn đang chờ:', err);
      return [];
    }
  }
};

// API cho người dùng
export const userApi = {
  getAll: () => api.get('/users/'), // Thêm endpoint để lấy danh sách user
  changePassword: (oldPassword, newPassword) => api.post('/change-password/', {
    old_password: oldPassword,
    new_password: newPassword
  }),
};

export default {
  auth: authApi,
  employee: employeeApi,
  department: departmentApi,
  shift: shiftApi,
  attendance: attendanceApi,
  dashboard: dashboardApi,
  notification: notificationApi,
  support: supportApi,
  user: userApi,
};