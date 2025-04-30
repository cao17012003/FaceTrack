import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  Badge as BadgeIcon,
  Today as TodayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Face as FaceIcon,
  Camera as CameraIcon
} from '@mui/icons-material';
import { employeeApi, attendanceApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { isAdmin } = useAuth();
  
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [faceData, setFaceData] = useState([]);
  const [loadingFaceData, setLoadingFaceData] = useState(false);
  
  useEffect(() => {
    fetchEmployeeData();
  }, [id]);
  
  const fetchEmployeeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await employeeApi.getById(id);
      setEmployee(response.data);
      
      // Tải dữ liệu điểm danh gần đây
      try {
        const attendanceResponse = await attendanceApi.getAll({ employee_id: id, limit: 10 });
        setRecentAttendance(attendanceResponse.data.results || []);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu điểm danh:', err);
      }
      
      // Tải dữ liệu khuôn mặt
      fetchFaceData();
    } catch (err) {
      console.error('Lỗi khi tải thông tin nhân viên:', err);
      setError('Không thể tải thông tin nhân viên. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFaceData = async () => {
    setLoadingFaceData(true);
    try {
      const response = await employeeApi.getFaceData(id);
      setFaceData(response.data || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu khuôn mặt:', err);
    } finally {
      setLoadingFaceData(false);
    }
  };
  
  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleEditEmployee = () => {
    // Chuyển hướng đến trang chỉnh sửa
    navigate(`/employees/${id}/edit`);
  };
  
  const handleDeleteFaceData = async (faceId) => {
    try {
      await employeeApi.deleteFaceData(faceId);
      enqueueSnackbar('Đã xóa dữ liệu khuôn mặt thành công', { variant: 'success' });
      fetchFaceData(); // Tải lại dữ liệu
    } catch (err) {
      console.error('Lỗi khi xóa dữ liệu khuôn mặt:', err);
      enqueueSnackbar('Không thể xóa dữ liệu khuôn mặt', { variant: 'error' });
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !employee) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error || 'Không tìm thấy thông tin nhân viên'}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Chi tiết nhân viên
        </Typography>
        
        {isAdmin() && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEditEmployee}
          >
            Chỉnh sửa
          </Button>
        )}
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                sx={{ width: 120, height: 120, mb: 2 }}
                alt={`${employee.first_name} ${employee.last_name}`}
                src={employee.avatar}
              />
              <Typography variant="h5" textAlign="center">
                {employee.first_name} {employee.last_name}
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                {employee.position || 'Không có chức vụ'}
              </Typography>
              <Chip 
                label={employee.is_active ? 'Đang hoạt động' : 'Không hoạt động'} 
                color={employee.is_active ? 'success' : 'default'}
                sx={{ mt: 1 }}
              />
            </Box>
            <Divider />
            <CardContent>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <BadgeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="ID Nhân viên" 
                    secondary={employee.employee_id} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email" 
                    secondary={employee.email || 'Không có email'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Số điện thoại" 
                    secondary={employee.phone || 'Không có số điện thoại'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <BusinessIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Phòng ban" 
                    secondary={employee.department?.name || 'Không có phòng ban'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <AccessTimeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Ca làm việc" 
                    secondary={employee.shift?.name || 'Không có ca làm việc'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TodayIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Ngày tham gia" 
                    secondary={employee.join_date ? format(new Date(employee.join_date), 'dd/MM/yyyy') : 'Không có thông tin'} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ width: '100%' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleChangeTab} 
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Thông tin chi tiết" />
              <Tab label="Điểm danh gần đây" />
              <Tab label="Dữ liệu khuôn mặt" />
            </Tabs>
            
            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Thông tin chi tiết</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Giới tính
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {employee.gender || 'Không có thông tin'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngày sinh
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {employee.date_of_birth ? format(new Date(employee.date_of_birth), 'dd/MM/yyyy') : 'Không có thông tin'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Địa chỉ
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {employee.address || 'Không có thông tin'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      CMND/CCCD
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {employee.id_card || 'Không có thông tin'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>Thông tin bổ sung</Typography>
                <Typography variant="body1">
                  {employee.notes || 'Không có thông tin bổ sung'}
                </Typography>
              </Box>
            )}
            
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Điểm danh gần đây</Typography>
                {recentAttendance.length === 0 ? (
                  <Typography variant="body1" color="text.secondary">
                    Không có dữ liệu điểm danh gần đây
                  </Typography>
                ) : (
                  <List>
                    {recentAttendance.map((record) => (
                      <ListItem key={record.id} divider>
                        <ListItemText
                          primary={format(new Date(record.date), 'dd/MM/yyyy')}
                          secondary={
                            <>
                              <Typography component="span" variant="body2">
                                Check-in: {record.check_in ? format(new Date(record.check_in), 'HH:mm:ss') : 'Chưa check-in'}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2">
                                Check-out: {record.check_out ? format(new Date(record.check_out), 'HH:mm:ss') : 'Chưa check-out'}
                              </Typography>
                            </>
                          }
                        />
                        <Chip 
                          label={record.status} 
                          color={
                            record.status === 'on_time' ? 'success' : 
                            record.status === 'late' ? 'warning' : 
                            record.status === 'absent' ? 'error' : 'default'
                          }
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
            
            {tabValue === 2 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Dữ liệu khuôn mặt</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<CameraIcon />}
                    // onClick={handleRegisterFace}
                  >
                    Đăng ký khuôn mặt mới
                  </Button>
                </Box>
                
                {loadingFaceData ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : faceData.length === 0 ? (
                  <Typography variant="body1" color="text.secondary">
                    Chưa có dữ liệu khuôn mặt. Hãy đăng ký khuôn mặt mới.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {faceData.map((face) => (
                      <Grid item xs={12} sm={6} md={4} key={face.id}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="200"
                            image={face.image}
                            alt="Face data"
                          />
                          <CardContent sx={{ pt: 1, pb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                Đăng ký: {format(new Date(face.created_at), 'dd/MM/yyyy HH:mm')}
                              </Typography>
                              <Button
                                size="small"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDeleteFaceData(face.id)}
                              >
                                Xóa
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeDetailPage; 