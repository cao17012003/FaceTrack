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
    department: '', 
    shift: '',      
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
      console.log('Departments data structure:', departmentsRes.data.length > 0 ? JSON.stringify(departmentsRes.data[0]) : 'No departments');
      console.log('All shifts:', shiftsRes.data);
      console.log('Shifts data structure:', shiftsRes.data.length > 0 ? JSON.stringify(shiftsRes.data[0]) : 'No shifts');
      console.log('All employees:', employeesRes.data);
      console.log('Employee data structure:', employeesRes.data.length > 0 ? JSON.stringify(employeesRes.data[0]) : 'No employees');
      
      // Check specific employee data
      const emp002 = employeesRes.data.find(emp => emp.employee_id === 'EMP002');
      if (emp002) {
        console.log('EMP002 details:', JSON.stringify(emp002));
        console.log('EMP002 department:', emp002.department);
        console.log('EMP002 shift:', emp002.shift);
      }

      // Lọc nhân viên dựa trên userId
      const filteredEmployees = employeesRes.data;
      
      // Uncomment this for production filtering
      // const filteredEmployees = employeesRes.data.filter(employee => {
      //   console.log('Processing employee:', employee);
      //   // Convert to string for comparison
      //   const employeeUsername = String(employee.username);
      //   const userIdStr = String(userId);
      //   return employeeUsername === userIdStr || userIdStr === '1';
      // });

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
    if (!employee || (!employee.id && !employee.employee_id)) {
      console.error('Invalid employee object or missing ID:', employee);
      enqueueSnackbar('Thông tin nhân viên không hợp lệ', { variant: 'error' });
      return;
    }
    
    console.log('DEBUGGING EMPLOYEE EDIT:');
    console.log('Employee to edit:', JSON.stringify(employee, null, 2));
    console.log('Department type:', typeof employee.department);
    console.log('Department value:', JSON.stringify(employee.department, null, 2));
    console.log('Shift type:', typeof employee.shift);
    console.log('Shift value:', JSON.stringify(employee.shift, null, 2));
    
    const userId = localStorage.getItem('userId'); // Thay thế username bằng userId
    
    // Xác định giá trị department/shift từ dữ liệu nhân viên
    let departmentValue = '';
    if (employee.department) {
      // Handle various possible structures of department data
      if (typeof employee.department === 'string') {
        departmentValue = employee.department;
      } else if (typeof employee.department === 'object') {
        // Try to extract the name using different possible property paths
        departmentValue = employee.department.name || employee.department.id || '';
        console.log('Department object value extracted:', departmentValue);
      }
    }
    
    let shiftValue = '';
    if (employee.shift) {
      // Handle various possible structures of shift data
      if (typeof employee.shift === 'string') {
        shiftValue = employee.shift;
      } else if (typeof employee.shift === 'object') {
        // Try to extract the name using different possible property paths
        shiftValue = employee.shift.name || employee.shift.id || '';
        console.log('Shift object value extracted:', shiftValue);
      }
    }
    
    console.log('Determined department value:', departmentValue);
    console.log('Determined shift value:', shiftValue);
    
    setFormData({
      username: employee.username || userId,  // Lấy userId từ localStorage
      employee_id: employee.employee_id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email || '',
      phone: employee.phone || '',
      department: departmentValue,
      shift: shiftValue,
    });
    setCurrentEmployee({...employee}); // Tạo bản sao để tránh tham chiếu
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
    setError(null);
    try {
      const userId = localStorage.getItem('userId');
      console.log('Submitting with userId:', userId);

      if (!userId) {
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }

      // Validate required fields
      if (!formData.employee_id) {
        setError('Mã nhân viên là bắt buộc');
        setLoading(false);
        return;
      }

      if (!formData.first_name) {
        setError('Tên là bắt buộc');
        setLoading(false);
        return;
      }

      if (!formData.last_name) {
        setError('Họ là bắt buộc');
        setLoading(false);
        return;
      }

      const data = {
        ...formData,
        // Convert userId to integer for proper handling
        username: parseInt(userId, 10),
        department: formData.department || null,
        shift: formData.shift || null,
        is_active: formData.is_active === undefined ? true : formData.is_active
      };

      console.log('Submitting data:', data);

      if (currentEmployee) {
        await employeeApi.update(currentEmployee.employee_id, data);
        enqueueSnackbar('Cập nhật thông tin nhân viên thành công', { variant: 'success' });
      } else {
        await employeeApi.create(data);
        enqueueSnackbar('Thêm nhân viên mới thành công', { variant: 'success' });
      }

      handleCloseDialog();
      fetchData();
    } catch (err) {
      console.error('Error submitting form:', err);
      const errorMessage = err.response?.data?.error || 
                          (err.response?.data && typeof err.response.data === 'object' 
                            ? Object.values(err.response.data).flat().join(', ') 
                            : 'Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại sau.');
      setError(errorMessage);
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
      // Check if currentEmployee and its employee_id are valid before proceeding
      if (!currentEmployee || !currentEmployee.employee_id) {
        throw new Error('Thông tin nhân viên không hợp lệ hoặc chưa được chọn');
      }
      
      await employeeApi.registerFace(currentEmployee.employee_id, imageFile);
      handleCloseFaceDialog();
      enqueueSnackbar('Đăng ký khuôn mặt thành công!', { variant: 'success' });
    } catch (err) {
      console.error('Error registering face:', err);
      setError(err.response?.data?.error || err.message || 'Có lỗi xảy ra khi đăng ký khuôn mặt.');
      enqueueSnackbar(err.response?.data?.error || err.message || 'Có lỗi xảy ra khi đăng ký khuôn mặt.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Khai báo component EmployeeDetailDialog trong EmployeesPage
  const EmployeeDetailDialog = ({ open, employee, onClose }) => {
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [faceData, setFaceData] = useState([]);
    const [faceDataSummary, setFaceDataSummary] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [openImageDialog, setOpenImageDialog] = useState(false);
    const [editData, setEditData] = useState({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: '',
      shift: '',
      id: null, // Thêm ID vào state
    });

    // Load dữ liệu nhân viên khi dialog mở
    useEffect(() => {
      if (employee && open) {
        // Lấy dữ liệu khuôn mặt của nhân viên nếu có ID hoặc employee_id
        const employeeId = employee.id || employee.employee_id;
        if (employeeId) {
          setLoading(true);
          employeeApi.getFaceData(employeeId)
            .then(response => {
              // Debug log để xem dữ liệu trả về
              console.log('Face data response:', response);
              console.log('Face data raw:', JSON.stringify(response.data));
              
              // Xử lý cấu trúc dữ liệu API trả về
              let faceDataArray = [];
              let summaryData = null;
              
              if (response.data && response.data.face_data && Array.isArray(response.data.face_data)) {
                faceDataArray = response.data.face_data;
                summaryData = response.data.summary;
              } else if (Array.isArray(response.data)) {
                faceDataArray = response.data;
              } else if (response.data && typeof response.data === 'object') {
                if (Array.isArray(response.data.results)) {
                  faceDataArray = response.data.results;
                } else {
                  faceDataArray = [response.data];
                }
              }
              
              console.log('Processed face data array:', faceDataArray);
              setFaceData(faceDataArray);
              
              // Tạo tóm tắt dữ liệu khuôn mặt
              let summary = {};
              if (summaryData) {
                summary = {
                  total_face_data: summaryData.total_face_data || faceDataArray.length,
                  total_recent_attendances: summaryData.total_recent_attendances || 0,
                  last_attendance: summaryData.last_attendance || null
                };
              } else {
                let totalMatches = faceDataArray.reduce((sum, face) => sum + (face.successful_matches || 0), 0);
                summary = {
                  total_face_data: faceDataArray.length,
                  total_recent_attendances: totalMatches,
                  last_attendance: faceDataArray.length > 0 ? faceDataArray[0].last_matched_at : null
                };
              }
              setFaceDataSummary(summary);
              console.log('Face data summary:', summary);
            })
            .catch(err => {
              console.error('Error fetching face data:', err);
              setError('Không thể tải dữ liệu khuôn mặt. Vui lòng thử lại sau.');
            })
            .finally(() => {
              setLoading(false);
            });
        }

        // Cập nhật dữ liệu chỉnh sửa và đảm bảo lưu ID hoặc employee_id
        setEditData({
          first_name: employee.first_name || '',
          last_name: employee.last_name || '',
          email: employee.email || '',
          phone: employee.phone || '',
          department: typeof employee.department === 'string' ? employee.department : employee.department?.name || '',
          shift: typeof employee.shift === 'string' ? employee.shift : employee.shift?.name || '',
          id: employee.id || employee.employee_id, // Lưu ID để sử dụng khi cập nhật
          employee_id: employee.employee_id, // Đảm bảo lưu employee_id
        });
        
        console.log('Edit data initialized:', {
          department: typeof employee.department === 'string' ? employee.department : employee.department?.name || '',
          shift: typeof employee.shift === 'string' ? employee.shift : employee.shift?.name || '',
        });
      }
    }, [employee, open]);

    const handleImageDialogClose = () => {
      setImageDialogOpen(false);
      setSelectedImage(null);
    };
    
    const handleImageClick = (face) => {
      // Lưu trực tiếp đối tượng face để có thể truy cập các thuộc tính khác
      const imageUrl = face.image || (face.face_image && `data:image/jpeg;base64,${face.face_image}`);
      console.log('Clicked face:', face);
      console.log('Image URL:', imageUrl);
      setSelectedImage({
        ...face,
        displayImage: imageUrl
      });
      setImageDialogOpen(true);
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
      // Kiểm tra ID hoặc employee_id
      const employeeId = employee.id || employee.employee_id;
      if (!employee || !employeeId) {
        enqueueSnackbar('Không thể xác định ID nhân viên. Vui lòng thử lại.', { variant: 'error' });
        return;
      }

      console.log('Updating employee with ID:', employeeId);
      console.log('Update data before sending:', editData);
      
      // Prepare data for update
      const dataToSend = {
        ...editData,
        department: editData.department || null,
        shift: editData.shift || null
      };
      
      console.log('Final data to send:', dataToSend);
      setLoading(true);
      employeeApi.update(employeeId, dataToSend)
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
          <Typography component="div">Thông tin nhân viên</Typography>
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
                  <Grid item xs={12} sm={6} md={4} key="first-name">
                    <TextField
                      name="first_name"
                      label="Tên"
                      fullWidth
                      value={editData.first_name}
                      onChange={handleEditInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} key="last-name">
                    <TextField
                      name="last_name"
                      label="Họ"
                      fullWidth
                      value={editData.last_name}
                      onChange={handleEditInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} key="email">
                    <TextField
                      name="email"
                      label="Email"
                      type="email"
                      fullWidth
                      value={editData.email}
                      onChange={handleEditInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} key="phone">
                    <TextField
                      name="phone"
                      label="Số điện thoại"
                      fullWidth
                      value={editData.phone}
                      onChange={handleEditInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} key="department">
                    <FormControl fullWidth>
                      <InputLabel>Phòng ban</InputLabel>
                      <Select
                        name="department"
                        value={editData.department || ''}
                        onChange={handleEditInputChange}
                        displayEmpty
                        label="Phòng ban"
                      >
                        <MenuItem key="no-department" value="">
                          <em>Không có phòng ban</em>
                        </MenuItem>
                        {Array.isArray(departments) && departments.map(dept => (
                          <MenuItem key={dept.name} value={dept.name}>{dept.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} key="shift">
                    <FormControl fullWidth>
                      <InputLabel>Ca làm việc</InputLabel>
                      <Select
                        name="shift"
                        value={editData.shift || ''}
                        onChange={handleEditInputChange}
                        displayEmpty
                        label="Ca làm việc"
                      >
                        <MenuItem key="no-shift" value="">
                          <em>Không có ca làm việc</em>
                        </MenuItem>
                        {Array.isArray(shifts) && shifts.map(shift => (
                          <MenuItem key={shift.name} value={shift.name}>{shift.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} key="save-button">
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
                  <Typography variant="body1"><strong>Phòng ban:</strong> {employee.department?.name || employee.department || 'Chưa phân phòng'}</Typography>
                  <Typography variant="body1"><strong>Ca làm việc:</strong> {employee.shift?.name || employee.shift || 'Chưa phân ca'}</Typography>
                  <Typography variant="body1"><strong>Email:</strong> {employee.email || 'Chưa cập nhật'}</Typography>
                  <Typography variant="body1"><strong>Điện thoại:</strong> {employee.phone || 'Chưa cập nhật'}</Typography>
                  <Typography variant="body1"><strong>Ngày tạo:</strong> {employee.created_at ? new Date(employee.created_at).toLocaleDateString('vi-VN') : ''}</Typography>
                </>
              )}
            </Box>
            {/* Phần hiển thị dữ liệu khuôn mặt */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Dữ liệu khuôn mặt đã đăng ký
              </Typography>
              
              {faceDataSummary && Array.isArray(faceData) && faceData.length > 0 && (
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
                      Lần điểm danh gần nhất: <strong>{faceDataSummary.last_attendance ? new Date(faceDataSummary.last_attendance).toLocaleString('vi-VN') : 'Chưa có'}</strong>
                    </Typography>
                  )}
                </Box>
              )}
              
              {loading && !editMode ? (
                <CircularProgress />
              ) : Array.isArray(faceData) && faceData.length > 0 ? (
                <ImageList cols={3} gap={8}>
                  {faceData.map((face, index) => {
                    console.log('Rendering face item:', face);
                    return (
                      <ImageListItem key={face.id || index} sx={{ position: 'relative' }}>
                        <img
                          src={getFaceImageUrl(face)}
                          alt={`Khuôn mặt của ${employee.first_name}`}
                          loading="lazy"
                          style={{
                            borderRadius: 8,
                            cursor: 'pointer',
                            width: '100%',
                            height: '180px',
                            objectFit: 'cover',
                            border: face.imageError ? '2px solid red' : '1px solid #ccc',
                            background: '#f5f5f5',
                            display: 'block',
                          }}
                          onClick={() => handleImageClick(face)}
                          onError={e => {
                            e.target.onerror = null;
                            e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg';
                            e.target.style.border = '2px solid red';
                          }}
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
                          {face.created_at ? new Date(face.created_at).toLocaleDateString('vi-VN') : 'N/A'}
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
                    );
                  })}
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
                  src={selectedImage.displayImage || selectedImage} 
                  alt={`Khuôn mặt của ${employee.first_name}`} 
                  style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Ngày đăng ký:</strong> {selectedImage && selectedImage.created_at ? new Date(selectedImage.created_at).toLocaleString('vi-VN') : 'N/A'}
                </Typography>
                {selectedImage.liveness_score !== 'N/A' && (
                  <Typography variant="body2">
                    <strong>Điểm sống:</strong> {typeof selectedImage.liveness_score === 'number' ? selectedImage.liveness_score.toFixed(2) : selectedImage.liveness_score}
                  </Typography>
                )}
                {selectedImage.last_used && (
                  <Typography variant="body2">
                    <strong>Sử dụng gần nhất:</strong> {selectedImage && selectedImage.last_used ? new Date(selectedImage.last_used).toLocaleString('vi-VN') : 'Chưa sử dụng'}
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
                        // Thêm key cho mỗi match
                        <Paper key={attendance.id || index} sx={{ p: 1 }}>
                          <Typography variant="body2">
                            <strong>Ngày:</strong> {attendance.date ? new Date(attendance.date).toLocaleDateString('vi-VN') : 'N/A'}
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

  // Hàm lấy URL ảnh khuôn mặt đúng cho frontend
  const getFaceImageUrl = (face) => {
    if (face.image) {
      // Thay thế mọi domain nội bộ bằng localhost
      return face.image.replace('http://backend:8000', 'http://localhost:8000').replace('http://nginx:8000', 'http://localhost:8000');
    }
    if (face.face_image) {
      return `data:image/jpeg;base64,${face.face_image}`;
    }
    return '';
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
              {employees.map((employee, index) => (
                // Đảm bảo rằng mỗi hàng đều có key duy nhất
                <TableRow 
                  key={employee.id || employee.employee_id || `employee-${index}`}
                  hover
                  onClick={() => handleViewEmployee(employee)}
                  sx={{ cursor: 'pointer' }}
                > 
                  <TableCell>{employee.username}</TableCell>
                  <TableCell>{employee.employee_id}</TableCell>
                  <TableCell>{employee.first_name} {employee.last_name}</TableCell>
                  <TableCell>
                    {employee.department
                      ? (typeof employee.department === 'string' 
                         ? employee.department 
                         : (employee.department?.name || employee.department_name || 'Chưa phân phòng'))
                      : 'Chưa phân phòng'}
                  </TableCell>
                  <TableCell>
                    {employee.shift
                      ? (typeof employee.shift === 'string'
                         ? employee.shift
                         : (employee.shift?.name || employee.shift_name || 'Chưa phân ca'))
                      : 'Chưa phân ca'}
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
                  value={formData.department || ''}
                  onChange={handleInputChange}
                  label="Phòng ban"
                >
                  <MenuItem key="no-department" value="">
                    <em>Không có phòng ban</em>
                  </MenuItem>
                  {departments && departments.map((dept) => {
                    console.log('Department in dropdown:', dept.name);
                    return (
                      <MenuItem key={dept.name} value={dept.name}>
                        {dept.name || 'Unnamed Department'}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Ca làm việc</InputLabel>
                <Select
                  name="shift"
                  value={formData.shift || ''}
                  onChange={handleInputChange}
                  label="Ca làm việc"
                >
                  <MenuItem key="no-shift" value="">
                    <em>Không có ca làm việc</em>
                  </MenuItem>
                  {shifts && shifts.map((shift) => {
                    console.log('Shift in dropdown:', shift.name);
                    return (
                      <MenuItem key={shift.name} value={shift.name}>
                        {shift.name || 'Unnamed Shift'}
                      </MenuItem>
                    );
                  })}
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
