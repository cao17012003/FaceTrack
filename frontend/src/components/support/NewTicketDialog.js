import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import { supportApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const NewTicketDialog = ({ open, onClose, onTicketCreated }) => {
  const { getEmployeeId, getUserInfo } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Vui lòng nhập tiêu đề');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Vui lòng nhập mô tả vấn đề');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Lấy employee ID từ người dùng hiện tại
    const employeeId = getEmployeeId();
    
    if (!employeeId) {
      setError('Không thể xác định ID nhân viên. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }
    
    // Lấy thông tin người dùng
    const userInfo = getUserInfo();
    const employeeName = userInfo?.fullName || '';
    
    // Tạo một ID tạm thời để theo dõi ticket trong trường hợp có lỗi server
    const tempId = Date.now();
    
    // Tạo dữ liệu ticket tạm thời để có thể hiển thị ngay trong UI nếu cần
    const temporaryTicket = {
      id: tempId,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      category: formData.category,
      employee: employeeId, 
      employee_name: employeeName,
      status: 'open',
      created_at: new Date().toISOString(),
      _isTemporary: true
    };
    
    try {
      // Chuẩn bị dữ liệu ticket
      const ticketData = {
        ...formData,
        employee: employeeId,      // Gán employee ID
        assigned_to: 1,            // Mặc định gán cho admin với ID là 1
        status: 'open',            // Đặt trạng thái mặc định
        created_at: new Date().toISOString() // Thêm thời gian tạo
      };
      
      // In ra console để debug
      console.log("Creating ticket with data:", ticketData);
      
      // Gửi yêu cầu tạo ticket lên server
      const response = await supportApi.createTicket(ticketData);
      
      // Kiểm tra response
      if (response && response.data) {
        console.log("Ticket created successfully:", response.data);
        
        // Tạo đối tượng ticket với thông tin đầy đủ
        const createdTicket = {
          ...response.data,
          employee_name: employeeName, // Thêm tên nhân viên
          status: response.data.status || 'open',
          created_at: response.data.created_at || new Date().toISOString()
        };
        
        // Thêm vào danh sách cache cho các trường hợp fallback
        try {
          const cachedTickets = JSON.parse(localStorage.getItem('cached_tickets') || '[]');
          cachedTickets.unshift(createdTicket); // Thêm vào đầu mảng
          localStorage.setItem('cached_tickets', JSON.stringify(cachedTickets));
        } catch (cacheErr) {
          console.error('Lỗi khi cập nhật cache tickets:', cacheErr);
        }
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          category: ''
        });
        
        // Gọi callback với dữ liệu ticket mới
        onTicketCreated(createdTicket);
      } else {
        throw new Error('Không nhận được dữ liệu từ server');
      }
    } catch (err) {
      console.error('Lỗi khi tạo ticket:', err);
      
      // Xử lý lỗi cụ thể từ server
      if (err.response) {
        console.error('Chi tiết lỗi từ server:', err.response.data);
        
        if (err.response.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (err.response.status === 500) {
          setError('Máy chủ đang gặp sự cố. Đã lưu yêu cầu hỗ trợ của bạn.');
          
          // Thêm vào danh sách cache cho các trường hợp fallback
          try {
            const cachedTickets = JSON.parse(localStorage.getItem('cached_tickets') || '[]');
            cachedTickets.unshift(temporaryTicket); // Thêm vào đầu mảng
            localStorage.setItem('cached_tickets', JSON.stringify(cachedTickets));
          } catch (cacheErr) {
            console.error('Lỗi khi cập nhật cache tickets:', cacheErr);
          }
          
          // Reset form
          setFormData({
            title: '',
            description: '',
            priority: 'medium',
            category: ''
          });
          
          // Gọi callback với dữ liệu ticket tạm để hiển thị trong UI
          onTicketCreated(temporaryTicket);
          
          // Đóng dialog và kết thúc xử lý
          onClose();
          return;
        } else {
          setError(`Lỗi khi tạo yêu cầu: ${err.response.data.message || 'Vui lòng thử lại sau.'}`);
        }
      } else if (err.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
        
        // Sử dụng ticket tạm thời trong trường hợp không có kết nối
        try {
          const cachedTickets = JSON.parse(localStorage.getItem('cached_tickets') || '[]');
          cachedTickets.unshift(temporaryTicket); // Thêm vào đầu mảng
          localStorage.setItem('cached_tickets', JSON.stringify(cachedTickets));
        } catch (cacheErr) {
          console.error('Lỗi khi cập nhật cache tickets:', cacheErr);
        }
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          category: ''
        });
        
        // Gọi callback với dữ liệu ticket tạm để hiển thị trong UI
        onTicketCreated({
          ...temporaryTicket,
          _offlineCreated: true
        });
        
        // Đóng dialog và kết thúc xử lý
        onClose();
        return;
      } else {
        setError('Có lỗi xảy ra khi tạo yêu cầu hỗ trợ. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: ''
      });
      setError(null);
      onClose();
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Tạo yêu cầu hỗ trợ mới</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TextField
          autoFocus
          name="title"
          label="Tiêu đề"
          fullWidth
          value={formData.title}
          onChange={handleChange}
          margin="normal"
          disabled={loading}
          required
        />
        
        <TextField
          name="description"
          label="Mô tả vấn đề"
          multiline
          rows={5}
          fullWidth
          value={formData.description}
          onChange={handleChange}
          margin="normal"
          disabled={loading}
          required
          placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
        />
        
        <Box sx={{ display: 'flex', mt: 2, gap: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Độ ưu tiên</InputLabel>
            <Select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              disabled={loading}
            >
              <MenuItem value="low">Thấp</MenuItem>
              <MenuItem value="medium">Trung bình</MenuItem>
              <MenuItem value="high">Cao</MenuItem>
              <MenuItem value="urgent">Khẩn cấp</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <TextField
              name="category"
              label="Phân loại"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
              placeholder="Ví dụ: Lỗi phần mềm, Vấn đề về tài khoản, ..."
            />
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Hủy bỏ
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewTicketDialog; 