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
  const { getEmployeeId } = useAuth();
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
    
    try {
      // In ra console để debug
      console.log("Creating ticket with employee ID:", employeeId);
      
      const response = await supportApi.createTicket({
        ...formData,
        employee: employeeId,      // Gán employee ID
        assigned_to: 1             // Mặc định gán cho admin với ID là 1
      });
      
      console.log("Ticket created successfully:", response.data);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: ''
      });
      
      // Gọi callback với dữ liệu ticket mới
      onTicketCreated(response.data);
    } catch (err) {
      console.error('Lỗi khi tạo ticket:', err);
      // In chi tiết lỗi để debug
      if (err.response) {
        console.error('Chi tiết lỗi từ server:', err.response.data);
      }
      setError('Có lỗi xảy ra khi tạo yêu cầu hỗ trợ. Vui lòng thử lại sau.');
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