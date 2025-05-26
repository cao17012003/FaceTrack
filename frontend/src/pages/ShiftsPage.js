import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import vi from 'date-fns/locale/vi';
import { shiftApi } from '../services/api';

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const ShiftsPage = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    start_time: null,
    end_time: null,
    description: '',
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem('userId');
        console.log('Fetching shifts for user:', userId);
        const response = await shiftApi.getAll({ username: userId });
        console.log('Shifts response:', response.data);
        setShifts(response.data);
      } catch (err) {
        console.error('Error fetching shifts:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu ca làm việc. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenDialog = (shift = null) => {
    if (shift) {
      // Create Date objects for time fields
      const startTime = shift.start_time ? new Date(`2000-01-01T${shift.start_time}`) : null;
      const endTime = shift.end_time ? new Date(`2000-01-01T${shift.end_time}`) : null;
      
      setFormData({
        name: shift.name,
        start_time: startTime,
        end_time: endTime,
        description: shift.description || '',
      });
      setCurrentShift(shift);
    } else {
      setFormData({
        name: '',
        start_time: null,
        end_time: null,
        description: '',
      });
      setCurrentShift(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleTimeChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      console.log('Retrieved userId from localStorage:', userId);
      if (!userId) {
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }

      // Format time values for API
      const dataToSubmit = {
        ...formData,
        start_time: formData.start_time 
          ? `${formData.start_time.getHours().toString().padStart(2, '0')}:${formData.start_time.getMinutes().toString().padStart(2, '0')}`
          : null,
        end_time: formData.end_time 
          ? `${formData.end_time.getHours().toString().padStart(2, '0')}:${formData.end_time.getMinutes().toString().padStart(2, '0')}`
          : null,
        username: parseInt(userId)
      };
      
      if (currentShift) {
        // Update
        await shiftApi.update(currentShift.name, dataToSubmit);
      } else {
        // Create
        const createdShiftResponse = await shiftApi.create(dataToSubmit);
        // Lưu lại thông tin ca làm việc mới tạo vào localStorage
        if (createdShiftResponse && createdShiftResponse.data) {
          // Shift sử dụng name làm primary key, không có trường id
          const { name } = createdShiftResponse.data;
          localStorage.setItem('shiftInfo', JSON.stringify({ name }));
          console.log('Đã lưu shift:', { name });
        }
      }
      
      // Refresh shift list
      const response = await shiftApi.getAll({ username: userId });
      setShifts(response.data);
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving shift:', err);
      setError('Có lỗi xảy ra khi lưu thông tin ca làm việc.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ca làm việc này?')) {
      setLoading(true);
      try {
        await shiftApi.delete(id); // id ở đây thực ra là name của ca làm việc
        
        // Refresh shift list
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
          return;
        }
        const response = await shiftApi.getAll({ username: userId });
        setShifts(response.data);
      } catch (err) {
        console.error('Error deleting shift:', err);
        setError('Có lỗi xảy ra khi xóa ca làm việc.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Quản lý ca làm việc</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm ca làm việc
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && !openDialog ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên ca</TableCell>
                <TableCell>Giờ bắt đầu</TableCell>
                <TableCell>Giờ kết thúc</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shifts.length > 0 ? (
                shifts.map((shift) => (
                  <TableRow key={shift.name}>
                    <TableCell>{shift.name}</TableCell>
                    <TableCell>{shift.start_time}</TableCell>
                    <TableCell>{shift.end_time}</TableCell>
                    <TableCell>{shift.description}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(shift)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => handleDelete(shift.name)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Không có dữ liệu ca làm việc
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentShift ? 'Chỉnh sửa ca làm việc' : 'Thêm ca làm việc mới'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Tên ca làm việc"
                  fullWidth
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TimePicker
                  label="Giờ bắt đầu"
                  value={formData.start_time}
                  onChange={(value) => handleTimeChange('start_time', value)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TimePicker
                  label="Giờ kết thúc"
                  value={formData.end_time}
                  onChange={(value) => handleTimeChange('end_time', value)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Mô tả"
                  fullWidth
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShiftsPage;
