import axios from 'axios';
import { AUTH_TOKEN_KEY, API_BASE_URL } from '../config';

// Sử dụng đường dẫn tương đối cho API URL
const API_URL = process.env.REACT_APP_API_URL || '/api';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000, // Tăng timeout lên 30 giây
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Error Request:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error);
      return Promise.reject(new Error('Request timeout - Vui lòng thử lại sau'));
    }
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response);
      return Promise.reject(error);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request:', error.request);
      return Promise.reject(new Error('Không thể kết nối đến server - Vui lòng kiểm tra kết nối mạng'));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
      return Promise.reject(error);
    }
  }
);

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
  login: (data) => axiosInstance.post('/login/', data),
  register: (data) => axiosInstance.post('/register/', data),
};

// API cho nhân viên
export const employeeApi = {
  getAll: () => axiosInstance.get('/employees/'),
  getById: (id) => axiosInstance.get(`/employees/${id}/`),
  create: (data) => axiosInstance.post('/employees/', data),
  update: (id, data) => axiosInstance.put(`/employees/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/employees/${id}/`),
  getFaceData: (id) => axiosInstance.get(`/employees/${id}/face_data/`),
  deleteFaceData: (faceId) => axiosInstance.delete(`/face_data/${faceId}/`),
  registerFace: (id, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return axiosInstance.post(`/employees/${id}/register_face/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  recognizeFace: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return axiosInstance.post('/employees/recognize_face/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  // API lấy thông tin nhân viên hiện tại đang đăng nhập
  getCurrentEmployee: () => axiosInstance.get('/employees/current/'),
};

// API cho phòng ban
export const departmentApi = {
  getAll: (params) => axiosInstance.get('/departments/', { params }),
  getById: (id) => axiosInstance.get(`/departments/${id}/`),
  create: (data) => axiosInstance.post('/departments/', data),
  update: (id, data) => axiosInstance.put(`/departments/${id}/`, data),
  // Sử dụng endpoint delete_by_name thay vì xóa theo id để tránh lỗi 'undefined'
  delete: (nameOrId) => axiosInstance.delete('/departments/delete_by_name/', { data: { name: nameOrId } }),
};

// API cho ca làm việc
export const shiftApi = {
  getAll: (params) => axiosInstance.get('/shifts/', { params }),
  getById: (id) => axiosInstance.get(`/shifts/${id}/`),
  create: (data) => axiosInstance.post('/shifts/', data),
  update: (id, data) => axiosInstance.put(`/shifts/${id}/`, data),
  // Sử dụng endpoint delete_by_name thay vì xóa theo id để tránh lỗi 'undefined'
  delete: (nameOrId) => axiosInstance.delete('/shifts/delete_by_name/', { data: { name: nameOrId } }),
};

// API cho chấm công
export const attendanceApi = {
  getAll: (params) => axiosInstance.get('/attendance/', { params }),
  getById: (id) => axiosInstance.get(`/attendance/${id}/`),
  create: (data) => axiosInstance.post('/attendance/', data),
  update: (id, data) => axiosInstance.put(`/attendance/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/attendance/${id}/`),
  checkInOut: (imageFile, employeeId) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // Include employee ID to verify the check-in request is for the logged-in user
    if (employeeId) {
      formData.append('employee_id', employeeId);
    }
    
    return axiosInstance.post('/attendance/check_in_out/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getReport: (params) => axiosInstance.get('/attendance/report/', { params }),
  getToday: () => axiosInstance.get('/attendance/today/'),
  getStats: () => axiosInstance.get('/attendance/stats/'),
  getWeeklyStats: () => axiosInstance.get('/attendance/weekly_stats/'),
  // Lấy dữ liệu điểm danh dạng lịch
  getCalendarReport: (startDate, endDate, employeeId) => {
    const params = { start_date: startDate, end_date: endDate };
    if (employeeId) params.employee_id = employeeId;
    return axiosInstance.get('/attendance/calendar_report/', { params });
  },
  // Lấy lịch sử điểm danh gần đây của nhân viên
  getRecentAttendance: (limit = 10) => axiosInstance.get('/attendance/recent/', { params: { limit } }),
  // Lấy thông tin điểm danh hôm nay của nhân viên
  getTodayAttendance: () => axiosInstance.get('/attendance/employee_today/'),
};

// API cho dashboard
export const dashboardApi = {
  getStats: () => axiosInstance.get('/dashboard/stats/'),
  getAttendanceSummary: () => axiosInstance.get('/dashboard/attendance_summary/'),
  getDepartmentSummary: () => axiosInstance.get('/dashboard/department_summary/'),
  // Dashboard cá nhân hóa cho nhân viên
  getEmployeeStats: () => axiosInstance.get('/dashboard/employee_stats/'),
  // Lấy dữ liệu điểm danh tùy chỉnh theo khoảng thời gian
  getCustomStats: (startDate, endDate) => axiosInstance.get('/dashboard/custom_stats/', {
    params: { start_date: startDate, end_date: endDate }
  }),
};

// API cho thông báo
export const notificationApi = {
  getAll: (params) => axiosInstance.get('/notifications/', { params }),
  getById: (id) => axiosInstance.get(`/notifications/${id}/`),
  create: (data) => axiosInstance.post('/notifications/', data),
  update: (id, data) => axiosInstance.put(`/notifications/${id}/`, data),
  delete: (id) => axiosInstance.delete(`/notifications/${id}/`),
  markAsRead: (id) => axiosInstance.post(`/notifications/${id}/mark_as_read/`),
  markAllAsRead: (employeeId) => axiosInstance.post('/notifications/mark_all_as_read/', { employee_id: employeeId }),
  getUnreadCount: (employeeId) => axiosInstance.get('/notifications/unread_count/', { params: { employee_id: employeeId } }),
};

// API cho hỗ trợ và khiếu nại
export const supportApi = {
  // Tickets
  getAllTickets: async (params) => {
    try {
      // Admin sẽ nhận tất cả tickets, user thường sẽ chỉ nhận tickets của họ
      // Backend tự động xử lý việc phân quyền này
      console.log("Gọi API lấy danh sách tickets với params:", params);
      const response = await apiWithRetry(() => axiosInstance.get('/tickets/', { params }));
      
      // Lưu vào cache cho xử lý fallback
      if (response && response.data && Array.isArray(response.data)) {
        localStorage.setItem('cached_tickets', JSON.stringify(response.data));
        console.log(`Đã lưu ${response.data.length} tickets vào cache`);
      }
      
      return response;
    } catch (error) {
      console.error('Lỗi khi lấy tất cả tickets:', error);
      throw error;
    }
  },

  // Thêm cơ chế fallback cho getTicketById
  getTicketById: async (id) => {
    try {
      // Thử lấy thông tin chi tiết ticket
      return await apiWithRetry(() => axiosInstance.get(`/tickets/${id}/`));
    } catch (error) {
      console.log(`Lỗi khi tải ticket ${id} trực tiếp:`, error);

      // Kiểm tra lỗi 403 (Forbidden) - Không đủ quyền xem ticket này
      if (error.response && error.response.status === 403) {
        throw error; // Ném lại lỗi để UI hiển thị thông báo không có quyền
      }

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
            
            // Kiểm tra xem ticket có phải của user hiện tại không
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const employeeId = currentUser?.employee?.employee_id;
            
            // Nếu không phải admin và ticket không phải của user này, ném lỗi quyền truy cập
            const isAdmin = currentUser?.role === 'admin';
            if (!isAdmin && foundTicket.employee && foundTicket.employee !== employeeId) {
              console.error("Không có quyền xem ticket của người khác");
              throw new Error('Forbidden');
            }
            
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
        const listResponse = await axiosInstance.get('/tickets/my_tickets/');

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
        
        // Nếu lỗi là Forbidden, ném lại để UI xử lý
        if (fallbackError.message === 'Forbidden') {
          throw { 
            response: { 
              status: 403, 
              data: { error: 'Bạn không có quyền xem ticket này' } 
            } 
          };
        }
      }

      // Trả về ticket mặc định nếu tất cả đều thất bại
      console.log(`Sử dụng ticket mặc định cho ID ${id}`);
      return {
        data: fallbackTicket
      };
    }
  },

  createTicket: (data) => axiosInstance.post('/tickets/', data),
  updateTicket: (id, data) => axiosInstance.put(`/tickets/${id}/`, data),
  deleteTicket: (id) => axiosInstance.delete(`/tickets/${id}/`),
  changeTicketStatus: (id, status) => axiosInstance.post(`/tickets/${id}/change_status/`, { status }),
  assignTicket: (id, adminId) => axiosInstance.post(`/tickets/${id}/assign/`, { admin_id: adminId }),
  getTicketStats: () => axiosInstance.get('/tickets/stats/'),

  getMyTickets: async (params) => {
    try {
      // Sử dụng endpoint /tickets/ chung nhưng hệ thống backend sẽ lọc theo user hiện tại
      const response = await apiWithRetry(() => axiosInstance.get('/tickets/', { params }));

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
          _fromFallback: true,
          _source: 'cache'
        };
      }

      // Nếu không có cache, trả về danh sách trống để tránh lỗi ứng dụng
      console.log('Không tìm thấy cache, trả về danh sách trống');
      return {
        data: [],
        _fromFallback: true,
        _source: 'empty'
      };
    }
  },

  // Messages - thêm cơ chế fallback
  getMessages: async (ticketId) => {
    try {
      const response = await apiWithRetry(() => axiosInstance.get('/messages/', { params: { ticket_id: ticketId } }));

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
      const response = await apiWithRetry(() => axiosInstance.post('/messages/', data));

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
        const response = await axiosInstance.post('/messages/', {
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
  getAll: () => axiosInstance.get('/users/'), // Thêm endpoint để lấy danh sách user
  changePassword: (oldPassword, newPassword, token) => axiosInstance.post('/change-password/', {
    old_password: oldPassword,
    new_password: newPassword
  }, {
    headers: {
      Authorization: `Token ${token}`,
    },
  }),
  updateUser: (userId, data, token) => axiosInstance.put(`/users/${userId}/`, data, {
    headers: {
      Authorization: `Token ${token}`,
    },
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