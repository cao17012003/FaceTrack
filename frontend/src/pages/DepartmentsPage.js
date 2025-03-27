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
    username: '', // Trường username
  });

  // Fetch dữ liệu phòng ban và lọc theo username
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await departmentApi.getAll();
        const currentUsername = localStorage.getItem('username'); // Lấy username từ localStorage

        // Nếu username là 'admin' thì hiển thị tất cả phòng ban, ngược lại lọc theo username
        const filteredDepartments = currentUsername === 'admin'
          ? response.data
          : response.data.filter(department => department.username === currentUsername);

        setDepartments(filteredDepartments);
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu phòng ban. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Mở form thêm hoặc chỉnh sửa phòng ban
  const handleOpenDialog = (department = null) => {
    const loggedInUsername = localStorage.getItem('username');  // Lấy tên đăng nhập từ localStorage
    if (department) {
      setFormData({
        name: department.name,
        description: department.description || '',
        username: department.username || loggedInUsername,  // Đảm bảo username được điền vào
      });
      setCurrentDepartment(department);
    } else {
      setFormData({
        name: '',
        description: '',
        username: loggedInUsername,  // Khi tạo mới, username tự động điền từ localStorage
      });
      setCurrentDepartment(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Xử lý thay đổi dữ liệu từ form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Xử lý lưu dữ liệu phòng ban
  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (currentDepartment) {
        // Cập nhật phòng ban
        await departmentApi.update(currentDepartment.id, formData);
      } else {
        // Tạo mới phòng ban
        const createdDepartmentResponse = await departmentApi.create(formData);
        // Lưu lại id và name của phòng ban mới tạo vào localStorage
        if (createdDepartmentResponse && createdDepartmentResponse.data) {
          const { id, name } = createdDepartmentResponse.data;
          localStorage.setItem('departmentInfo', JSON.stringify({ id, name }));
          console.log('Đã lưu department:', { id, name });
        }
      }
      
      // Làm mới danh sách phòng ban
      const response = await departmentApi.getAll();
      const currentUsername = localStorage.getItem('username');
      const filteredDepartments = currentUsername === 'admin'
        ? response.data
        : response.data.filter(department => department.username === currentUsername);
      setDepartments(filteredDepartments);
      
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving department:', err);
      setError('Có lỗi xảy ra khi lưu thông tin phòng ban.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xóa phòng ban
  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) {
      setLoading(true);
      try {
        await departmentApi.delete(id);
        
        // Làm mới danh sách phòng ban
        const response = await departmentApi.getAll();
        const currentUsername = localStorage.getItem('username');
        const filteredDepartments = currentUsername === 'admin'
          ? response.data
          : response.data.filter(department => department.username === currentUsername);
        setDepartments(filteredDepartments);
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
                <TableCell>Tên đăng nhập</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.length > 0 ? (
                departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>{department.name}</TableCell>
                    <TableCell>{department.description}</TableCell>
                    <TableCell>{department.username}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(department)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => handleDelete(department.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Không có dữ liệu phòng ban
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Department Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
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
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="username"
                label="Tên đăng nhập"
                fullWidth
                value={formData.username}  // Lấy giá trị từ formData
                onChange={handleInputChange}
                required
                InputProps={{
                  readOnly: true,  // Không cho phép chỉnh sửa username
                }}
              />
            </Grid>
          </Grid>
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

export default DepartmentsPage;
