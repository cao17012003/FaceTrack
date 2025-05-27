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
import { departmentApi } from '../services/api';

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Fetch tất cả dữ liệu phòng ban, không lọc theo userId
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Lấy userId để ghi log, nhưng không dùng để lọc
        const userId = localStorage.getItem('userId');
        console.log('Fetching all departments (logged in user:', userId, ')');
        // Không gửi tham số username để lấy tất cả phòng ban
        const response = await departmentApi.getAll();
        console.log('All departments response:', response.data);
        // Hiển thị tất cả phòng ban, không lọc
        setDepartments(response.data);
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError('Có lỗi xảy ra khi tải danh sách phòng ban.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenDialog = (department = null) => {
    if (department) {
      setFormData({
        name: department.name,
        description: department.description || '',
      });
      setCurrentDepartment(department);
    } else {
      setFormData({
        name: '',
        description: '',
      });
      setCurrentDepartment(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: '',
      description: '',
    });
    setCurrentDepartment(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Xử lý lưu dữ liệu phòng ban
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      console.log('Retrieved userId from localStorage:', userId);
      if (!userId) {
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }

      const data = {
        name: formData.name,
        description: formData.description,
        username: parseInt(userId)
      };
      console.log('Sending data to API:', data);

      if (currentDepartment) {
        await departmentApi.update(currentDepartment.id, data);
      } else {
        const response = await departmentApi.create(data);
        console.log('API response:', response);
        if (response && response.data) {
          const { id, name } = response.data;
          localStorage.setItem('departmentInfo', JSON.stringify({ id, name }));
        }
      }
      
      // Làm mới danh sách và hiển thị tất cả phòng ban
      const response = await departmentApi.getAll();
      console.log('All departments:', response.data);
      // Không lọc theo userId nữa, hiển thị tất cả phòng ban
      console.log('Setting all departments without filtering');
      setDepartments(response.data);
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving department:', err);
      setError('Có lỗi xảy ra khi lưu thông tin phòng ban.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xóa phòng ban
  const handleDelete = async (name) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) {
      setLoading(true);
      try {
        await departmentApi.delete(name);
        // Làm mới danh sách và hiển thị tất cả phòng ban
        const response = await departmentApi.getAll();
        console.log('After delete - all departments:', response.data);
        // Không lọc theo userId nữa, hiển thị tất cả phòng ban
        setDepartments(response.data);
      } catch (err) {
        console.error('Error deleting department:', err);
        setError('Có lỗi xảy ra khi xóa phòng ban.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Quản lý phòng ban</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm phòng ban
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
                <TableCell>Tên phòng ban</TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.length > 0 ? (
                departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>{department.name}</TableCell>
                    <TableCell>{department.description}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(department)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => handleDelete(department.name)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    Không có dữ liệu phòng ban
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentDepartment ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Tên phòng ban"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Mô tả"
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentsPage;
