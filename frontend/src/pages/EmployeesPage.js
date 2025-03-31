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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Avatar,
  ImageList,
  ImageListItem,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Face as FaceIcon,
  Person,
  CameraAlt,
  Close as CloseIcon,
  Save as SaveIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { employeeApi, departmentApi, shiftApi } from '../services/api';
import WebcamCapture from '../components/WebcamCapture';
import { useSnackbar } from 'notistack';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openFaceDialog, setOpenFaceDialog] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '', // lưu id của phòng ban
    shift: '',      // lưu id của ca làm việc
    is_active: true,
    profile_image: null,
  });

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      console.log('Current userId:', userId);

      if (!userId) {
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }

      const [employeesRes, departmentsRes, shiftsRes] = await Promise.all([
        employeeApi.getAll(),
        departmentApi.getAll(),
        shiftApi.getAll(),
      ]);

      console.log('All departments:', departmentsRes.data);
      console.log('All shifts:', shiftsRes.data);
      console.log('All employees:', employeesRes.data);

      // Lọc nhân viên dựa trên userId
      const filteredEmployees = employeesRes.data.filter(employee => {
        console.log('Processing employee:', employee);
        // Convert to string for comparison
        const employeeUsername = String(employee.username);
        const userIdStr = String(userId);
        return employeeUsername === userIdStr || userIdStr === '1';
      });

      console.log('Filtered employees:', filteredEmployees);

      setEmployees(filteredEmployees);
      setDepartments(departmentsRes.data);
      setShifts(shiftsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (employee) => {
    const userId = localStorage.getItem('userId'); // Thay thế username bằng userId
    setFormData({
      username: employee.username || userId,  // Lấy userId từ localStorage
      employee_id: employee.employee_id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department?.id || '', // Lấy id của phòng ban
      shift: employee.shift?.id || '',           // Lấy id của ca làm việc
    });
    setCurrentEmployee(employee);
    setOpenDialog(true);
  };

  const handleOpenDialog = (employee = null) => {
    const loggedInUserId = localStorage.getItem('userId'); // Đổi tên biến để tránh trùng lặp

    if (employee) {
      setFormData({
        username: loggedInUserId,
        employee_id: employee.employee_id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department?.id || '',
        shift: employee.shift?.id || '',
        is_active: employee.is_active,
      });
      setCurrentEmployee(employee);
    } else {
      setFormData({
        username: loggedInUserId,
        employee_id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        department: '',
        shift: '',
        is_active: true,
      });
      setCurrentEmployee(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenFaceDialog = (employee) => {
    setCurrentEmployee(employee);
    setOpenFaceDialog(true);
  };

  const handleCloseFaceDialog = () => {
    setOpenFaceDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      console.log('Submitting with userId:', userId);

      if (!userId) {
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }

      const data = {
        ...formData,
        username: userId,
        department: formData.department || null,
        shift: formData.shift || null
      };

      console.log('Submitting data:', data);

      if (currentEmployee) {
        await employeeApi.update(currentEmployee.id, data);
        enqueueSnackbar('Cập nhật thông tin nhân viên thành công', { variant: 'success' });
      } else {
        await employeeApi.create(data);
        enqueueSnackbar('Thêm nhân viên mới thành công', { variant: 'success' });
      }

      handleCloseDialog();
      fetchData();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
      return;
    }

    setLoading(true);
    try {
      await employeeApi.delete(employeeId);
      enqueueSnackbar('Xóa nhân viên thành công', { variant: 'success' });
      fetchData();
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError('Có lỗi xảy ra khi xóa nhân viên. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceCapture = async (imageFile) => {
    setLoading(true);
    try {
      await employeeApi.registerFace(currentEmployee.id, imageFile);
      handleCloseFaceDialog();
      enqueueSnackbar('Đăng ký khuôn mặt thành công!', { variant: 'success' });
    } catch (err) {
      console.error('Error registering face:', err);
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi đăng ký khuôn mặt.');
    } finally {
      setLoading(false);
    }
  };

  const EmployeeDetailDialog = ({ open, employee, onClose }) => {
    const [faceData, setFaceData] = useState([]);
    const [faceDataSummary, setFaceDataSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({
      username: '',
      employee_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: '',
      shift: '',
    });
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
      if (employee && open) {
        setLoading(true);
        const loggedInUsername = localStorage.getItem('username');
        employeeApi.getFaceData(employee.id)
          .then(response => {
            if (response.data.face_data) {
              setFaceData(response.data.face_data);
              setFaceDataSummary(response.data.summary);
            } else {
              setFaceData(response.data);
            }
          })
          .catch(err => {
            console.error('Error fetching face data:', err);
          })
          .finally(() => {
            setLoading(false);
          });
        
        setEditData({
          username: employee.username || loggedInUsername,
          employee_id: employee.employee_id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email || '',
          phone: employee.phone || '',
          department: employee.department?.id || '',
          shift: employee.shift?.id || '',
        });
      }
    }, [employee, open]);

    const handleImageClick = (image) => {
      setSelectedImage(image);
      setImageDialogOpen(true);
    };

    const handleImageDialogClose = () => {
      setImageDialogOpen(false);
      setSelectedImage(null);
    };

    const handleDeleteFaceData = (faceId) => {
      if (window.confirm('Bạn có chắc chắn muốn xóa dữ liệu khuôn mặt này không?')) {
        setLoading(true);
        employeeApi.deleteFaceData(faceId)
          .then(response => {
            setFaceData(faceData.filter(face => face.id !== faceId));
            enqueueSnackbar('Xóa dữ liệu khuôn mặt thành công!', { variant: 'success' });
          })
          .catch(err => {
            console.error('Error deleting face data:', err);
            enqueueSnackbar('Có lỗi xảy ra khi xóa dữ liệu khuôn mặt.', { variant: 'error' });
          })
          .finally(() => {
            setLoading(false);
          });
      }
    };

    const handleEditModeToggle = () => {
      setEditMode(!editMode);
    };

    const handleEditInputChange = (e) => {
      const { name, value } = e.target;
      setEditData({
        ...editData,
        [name]: value,
      });
    };

    const handleSaveChanges = () => {
      if (!employee) return;

      setLoading(true);
      employeeApi.update(employee.id, editData)
        .then(() => {
          enqueueSnackbar('Cập nhật thông tin nhân viên thành công!', { variant: 'success' });
          fetchData();
          setEditMode(false);
          onClose();
        })
        .catch(err => {
          console.error('Error updating employee:', err);
          enqueueSnackbar('Có lỗi xảy ra khi cập nhật thông tin nhân viên.', { variant: 'error' });
        })
        .finally(() => {
          setLoading(false);
        });
    };

    if (!employee) return null;

    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Thông tin nhân viên</Typography>
          <Button 
            variant={editMode ? "outlined" : "contained"} 
            color={editMode ? "warning" : "primary"} 
            onClick={handleEditModeToggle}
            startIcon={editMode ? <CloseIcon /> : <EditIcon />}
          >
            {editMode ? "Hủy chỉnh sửa" : "Chỉnh sửa"}
          </Button>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              {editMode ? (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      name="username"
                      label="Tên đăng nhập"
                      fullWidth
                      value={editData.username}
                      onChange={handleEditInputChange}
                      required
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="employee_id"
                      label="Mã nhân viên"
                      fullWidth
                      value={editData.employee_id}
                      onChange={handleEditInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="first_name"
                      label="Tên"
                      fullWidth
                      value={editData.first_name}
                      onChange={handleEditInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="last_name"
                      label="Họ"
                      fullWidth
                      value={editData.last_name}
                      onChange={handleEditInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="email"
                      label="Email"
                      type="email"
                      fullWidth
                      value={editData.email}
                      onChange={handleEditInputChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="phone"
                      label="Số điện thoại"
                      fullWidth
                      value={editData.phone}
                      onChange={handleEditInputChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Phòng ban</InputLabel>
                      <Select
                        name="department"
                        value={editData.department || ''}  // Đảm bảo giá trị không phải là undefined
                        onChange={handleEditInputChange}
                        label="Phòng ban"
                      >
                        <MenuItem value="">
                          <em>Không có phòng ban</em>
                        </MenuItem>
                        {departments.map((dept) => (
                          <MenuItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Ca làm việc</InputLabel>
                      <Select
                        name="shift"
                        value={editData.shift || ''}  // Đảm bảo giá trị không phải là undefined
                        onChange={handleEditInputChange}
                        label="Ca làm việc"
                      >
                        <MenuItem value="">
                          <em>Không có ca làm việc</em>
                        </MenuItem>
                        {shifts.map((shift) => (
                          <MenuItem key={shift.id} value={shift.id}>
                            {shift.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Button 
                      variant="contained" 
                      color="success" 
                      fullWidth
                      onClick={handleSaveChanges}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    >
                      Lưu thay đổi
                    </Button>
                  </Grid>
                </Grid>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar 
                      src={employee.profile_image} 
                      sx={{ width: 100, height: 100 }}
                    >
                      <Person sx={{ width: 60, height: 60 }} />
                    </Avatar>
                    <Typography variant="h5">{employee.first_name} {employee.last_name}</Typography>
                  </Box>
                  <Typography variant="body1"><strong>Tên đăng nhập:</strong> {employee.username}</Typography>
                  <Typography variant="body1"><strong>Mã nhân viên:</strong> {employee.employee_id}</Typography>
                  <Typography variant="body1"><strong>Phòng ban:</strong> {employee.department?.name || 'Chưa phân phòng'}</Typography>
                  <Typography variant="body1"><strong>Ca làm việc:</strong> {employee.shift?.name || 'Chưa phân ca'}</Typography>
                  <Typography variant="body1"><strong>Email:</strong> {employee.email || 'Chưa cập nhật'}</Typography>
                  <Typography variant="body1"><strong>Điện thoại:</strong> {employee.phone || 'Chưa cập nhật'}</Typography>
                  <Typography variant="body1"><strong>Ngày tạo:</strong> {new Date(employee.created_at).toLocaleDateString('vi-VN')}</Typography>
                </>
              )}
            </Box>
            {/* Phần hiển thị dữ liệu khuôn mặt */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Dữ liệu khuôn mặt đã đăng ký
              </Typography>
              
              {faceDataSummary && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Thống kê dữ liệu khuôn mặt
                  </Typography>
                  <Typography variant="body2">
                    Tổng số khuôn mặt đã đăng ký: <strong>{faceDataSummary.total_face_data}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Số lần điểm danh trong 7 ngày qua: <strong>{faceDataSummary.total_recent_attendances}</strong>
                  </Typography>
                  {faceDataSummary.last_attendance && (
                    <Typography variant="body2">
                      Lần điểm danh gần nhất: <strong>{new Date(faceDataSummary.last_attendance).toLocaleString('vi-VN')}</strong>
                    </Typography>
                  )}
                </Box>
              )}
              
              {loading && !editMode ? (
                <CircularProgress />
              ) : faceData.length > 0 ? (
                <ImageList cols={3} gap={8}>
                  {faceData.map((face) => (
                    <ImageListItem key={face.id} sx={{ position: 'relative' }}>
                      <img
                        src={face.image}
                        alt={`Khuôn mặt của ${employee.first_name}`}
                        loading="lazy"
                        style={{ borderRadius: 8, cursor: 'pointer' }}
                        onClick={() => handleImageClick(face)}
                      />
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0, 
                          bgcolor: 'rgba(0,0,0,0.5)',
                          borderRadius: '0 0 0 8px',
                          p: 0.5
                        }}
                      >
                        <Tooltip title="Xóa khuôn mặt này">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFaceData(face.id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          left: 0, 
                          right: 0, 
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          p: 0.5,
                          fontSize: '0.75rem',
                          textAlign: 'center'
                        }}
                      >
                        {new Date(face.created_at).toLocaleDateString('vi-VN')}
                        {face.successful_matches > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            <Tooltip title="Số lần nhận diện thành công trong 7 ngày">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <CheckIcon fontSize="small" sx={{ fontSize: '0.7rem' }} />
                                <span>{face.successful_matches} lần</span>
                              </Box>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                    </ImageListItem>
                  ))}
                </ImageList>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, backgroundColor: 'background.paper', borderRadius: 1 }}>
                  <CameraAlt sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">Chưa có dữ liệu khuôn mặt</Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => {
                      onClose();
                      setCurrentEmployee(employee);
                      setOpenFaceDialog(true);
                    }}
                    sx={{ mt: 2 }}
                  >
                    Đăng ký khuôn mặt
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={onClose}>Đóng</Button>
            {!editMode && (
              <Button 
                color="primary" 
                onClick={() => {
                  onClose();
                  setCurrentEmployee(employee);
                  setOpenFaceDialog(true);
                }}
                startIcon={<CameraAlt />}
                sx={{ ml: 1 }}
              >
                Đăng ký khuôn mặt
              </Button>
            )}
          </Box>
        </DialogContent>
        
        <Dialog open={imageDialogOpen} onClose={handleImageDialogClose} maxWidth="md">
          <DialogTitle>
            Ảnh khuôn mặt của {employee.first_name} {employee.last_name}
          </DialogTitle>
          <DialogContent>
            {selectedImage && (
              <Box>
                <img 
                  src={selectedImage.image} 
                  alt={`Khuôn mặt của ${employee.first_name}`} 
                  style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Ngày đăng ký:</strong> {new Date(selectedImage.created_at).toLocaleString('vi-VN')}
                </Typography>
                {selectedImage.liveness_score !== 'N/A' && (
                  <Typography variant="body2">
                    <strong>Điểm sống:</strong> {typeof selectedImage.liveness_score === 'number' ? selectedImage.liveness_score.toFixed(2) : selectedImage.liveness_score}
                  </Typography>
                )}
                {selectedImage.last_used && (
                  <Typography variant="body2">
                    <strong>Sử dụng gần nhất:</strong> {new Date(selectedImage.last_used).toLocaleString('vi-VN')}
                  </Typography>
                )}
                {selectedImage.successful_matches > 0 && (
                  <Typography variant="body2">
                    <strong>Số lần điểm danh thành công:</strong> {selectedImage.successful_matches} lần
                  </Typography>
                )}
                {selectedImage.recent_matches && selectedImage.recent_matches.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Điểm danh gần đây sử dụng dữ liệu khuôn mặt này
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selectedImage.recent_matches.map((attendance, index) => (
                        <Paper key={index} sx={{ p: 1 }}>
                          <Typography variant="body2">
                            <strong>Ngày:</strong> {new Date(attendance.date).toLocaleDateString('vi-VN')}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Giờ vào:</strong> {attendance.check_in_time ? new Date(attendance.check_in_time).toLocaleTimeString('vi-VN') : 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Giờ ra:</strong> {attendance.check_out_time ? new Date(attendance.check_out_time).toLocaleTimeString('vi-VN') : 'N/A'}
                          </Typography>
                          {(attendance.check_in_image || attendance.check_out_image) && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              {attendance.check_in_image && (
                                <Tooltip title="Ảnh điểm danh vào">
                                  <Box 
                                    component="img" 
                                    src={attendance.check_in_image} 
                                    alt="Check-in" 
                                    sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }}
                                  />
                                </Tooltip>
                              )}
                              {attendance.check_out_image && (
                                <Tooltip title="Ảnh điểm danh ra">
                                  <Box 
                                    component="img" 
                                    src={attendance.check_out_image} 
                                    alt="Check-out" 
                                    sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="contained" 
                    color="error" 
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      handleDeleteFaceData(selectedImage.id);
                      handleImageDialogClose();
                    }}
                  >
                    Xóa khuôn mặt này
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Dialog>
    );
  };

  const handleViewEmployee = (employee) => {
    setCurrentEmployee(employee);
    setOpenDialog(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Quản lý nhân viên</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm nhân viên
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && !openDialog && !openFaceDialog ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên đăng nhập</TableCell>
                <TableCell>Mã nhân viên</TableCell>
                <TableCell>Họ tên</TableCell>
                <TableCell>Phòng ban</TableCell>
                <TableCell>Ca làm việc</TableCell>
                <TableCell>Thông tin liên hệ</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow 
                  key={employee.id || employee.employee_id}
                  hover
                  onClick={() => handleViewEmployee(employee)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{employee.username}</TableCell>
                  <TableCell>{employee.employee_id}</TableCell>
                  <TableCell>{employee.first_name} {employee.last_name}</TableCell>
                  <TableCell>
                    {typeof employee.department === 'string' 
                      ? employee.department 
                      : employee.department?.name || 'Chưa phân phòng'}
                  </TableCell>
                  <TableCell>
                    {typeof employee.shift === 'string'
                      ? employee.shift
                      : employee.shift?.name || 'Chưa phân ca'}
                  </TableCell>
                  <TableCell>
                    <div>{employee.email}</div>
                    <div>{employee.phone}</div>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Sửa">
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEmployee(employee);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Đăng ký khuôn mặt">
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFaceDialog(employee);
                        }}
                      >
                        <FaceIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEmployee(employee.employee_id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Employee Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentEmployee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="username"
                label="Tên đăng nhập"
                fullWidth
                value={formData.username}
                onChange={handleInputChange}
                required
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="employee_id"
                label="Mã nhân viên"
                fullWidth
                value={formData.employee_id}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="first_name"
                label="Tên"
                fullWidth
                value={formData.first_name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="last_name"
                label="Họ"
                fullWidth
                value={formData.last_name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Số điện thoại"
                fullWidth
                value={formData.phone}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Phòng ban</InputLabel>
                <Select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  label="Phòng ban"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Ca làm việc</InputLabel>
                <Select
                  name="shift"
                  value={formData.shift}
                  onChange={handleInputChange}
                  label="Ca làm việc"
                >
                  {shifts.map((shift) => (
                    <MenuItem key={shift.id} value={shift.id}>
                      {shift.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

      {/* Face Registration Dialog */}
      <Dialog open={openFaceDialog} onClose={handleCloseFaceDialog} maxWidth="md" fullWidth>
        <DialogTitle>Đăng ký khuôn mặt</DialogTitle>
        <DialogContent>
          {currentEmployee && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                Nhân viên: {currentEmployee.first_name} {currentEmployee.last_name}
              </Typography>
              <Typography variant="body2">
                Mã nhân viên: {currentEmployee.employee_id}
              </Typography>
            </Box>
          )}
          <WebcamCapture
            onCapture={handleFaceCapture}
            isLoading={loading}
            error={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFaceDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Employee Detail Dialog */}
      <EmployeeDetailDialog
        open={openDialog}
        employee={currentEmployee}
        onClose={handleCloseDialog}
      />
    </Box>
  );
};

export default EmployeesPage;
