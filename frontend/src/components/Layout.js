import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  FormHelperText,
  Badge,
  useTheme,
  alpha,
  Stack,
  Container,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  CameraAlt as CameraIcon,
  CalendarMonth as CalendarIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  Notifications as NotificationsIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  SupportAgent as SupportIcon,
  Settings as SettingsIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Fingerprint as FingerprintIcon,
} from '@mui/icons-material';
import { useTranslation } from '../translations';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';
import axios from 'axios';
import { AUTH_TOKEN_KEY } from '../config';

const drawerWidth = 280;

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [userData, setUserData] = useState({
    username: '',
    fullName: '',
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [notificationCount, setNotificationCount] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleTheme, isDarkMode } = useAppTheme();
  const theme = useTheme();
  const { t } = useTranslation();
  const { currentUser, isAdmin, isEmployee, logout } = useAuth();
  
  // Initialize user data
  useEffect(() => {
    if (currentUser && currentUser.user) {
      setUserData(prev => ({
        ...prev,
        username: currentUser.user.username || '',
        fullName: `${currentUser.user.first_name || ''} ${currentUser.user.last_name || ''}`.trim(),
        email: currentUser.user.email || '',
      }));
      
      // Lấy số thông báo chưa đọc
      fetchNotificationCount();
    }
  }, [currentUser]);
  
  // Hàm lấy số lượng thông báo chưa đọc
  const fetchNotificationCount = async () => {
    try {
      if (!currentUser) return;
      
      // Lấy employee_id từ currentUser nếu có
      const employeeId = currentUser.employee?.employee_id;
      
      if (employeeId || isAdmin()) {
        // Gọi API để lấy số thông báo chưa đọc
        const response = await import('../services/api').then(module => 
          module.notificationApi.getUnreadCount(employeeId)
        );
        
        if (response && response.data && response.data.count !== undefined) {
          setNotificationCount(response.data.count);
        } else {
          setNotificationCount(0);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lấy số thông báo chưa đọc:', error);
      setNotificationCount(0);
    }
  };
  
  // Thiết lập interval để cập nhật số thông báo định kỳ (1 phút)
  useEffect(() => {
    if (currentUser) {
      // Lấy ngay lập tức khi mount
      fetchNotificationCount();
      
      // Thiết lập interval
      const interval = setInterval(fetchNotificationCount, 60000);
      
      // Cleanup interval khi unmount
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Check if the current page is AdminPage to hide sidebar
  const isAdminPage = location.pathname === '/admin';

  // Define menu items based on user role
  const getMenuItems = () => {
    // Common menu items for all logged-in users
    const commonMenuItems = [
      { text: t('menu.home'), path: '/', icon: <DashboardIcon />, allowedRoles: ['admin', 'employee'] },
      { text: t('menu.checkin'), path: '/check-in', icon: <CameraIcon />, allowedRoles: ['admin', 'employee'] },
      { text: t('menu.reports'), path: '/attendance-reports', icon: <AccessTimeIcon />, allowedRoles: ['admin', 'employee'] },
      { 
        text: t('menu.notifications'), 
        path: '/notifications', 
        icon: <Badge color="error" badgeContent={notificationCount} max={99}><NotificationsIcon /></Badge>, 
        allowedRoles: ['admin', 'employee'] 
      },
      { text: t('menu.support'), path: '/support', icon: <SupportIcon />, allowedRoles: ['admin', 'employee'] },
    ];
    
    // Menu items only for admin
    const adminMenuItems = [
      { text: t('menu.employees'), path: '/employees', icon: <PeopleIcon />, allowedRoles: ['admin'] },
      { text: t('menu.departments'), path: '/departments', icon: <BusinessIcon />, allowedRoles: ['admin'] },
      { text: t('menu.shifts'), path: '/shifts', icon: <ScheduleIcon />, allowedRoles: ['admin'] },
      { text: t('menu.calendar'), path: '/calendar', icon: <CalendarIcon />, allowedRoles: ['admin'] },
    ];
    
    let menuItems = [...commonMenuItems];
    
    if (isAdmin()) {
      menuItems = [...menuItems, ...adminMenuItems];
    }
    
    return menuItems;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/login');
  };
  
  const handleOpenEditDialog = () => {
    handleCloseUserMenu();
    setOpenEditDialog(true);
  };
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setErrors({});
  };
  
  const handleUserDataChange = (event) => {
    const { name, value } = event.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const validateForm = () => {
    let tempErrors = {};
    let formIsValid = true;
    
    // Validate email if provided
    if (userData.email && !/\S+@\S+\.\S+/.test(userData.email)) {
      tempErrors.email = 'Email không hợp lệ';
      formIsValid = false;
    }
    
    // Validate password fields if any password field is filled
    if (userData.newPassword || userData.confirmPassword || userData.oldPassword) {
      if (!userData.oldPassword) {
        tempErrors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại';
        formIsValid = false;
      }
      
      if (userData.newPassword && userData.newPassword.length < 6) {
        tempErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
        formIsValid = false;
      }
      
      if (userData.newPassword !== userData.confirmPassword) {
        tempErrors.confirmPassword = 'Mật khẩu không khớp';
        formIsValid = false;
      }
    }
    
    setErrors(tempErrors);
    return formIsValid;
  };
  
  const handleSubmitUserEdit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      // Chỉ gửi các trường đã được nhập
      const updateData = {
        first_name: userData.fullName.split(' ').slice(0, -1).join(' '),
        last_name: userData.fullName.split(' ').slice(-1).join(' '),
      };
      
      if (userData.email) {
        updateData.email = userData.email;
      }
      
      if (userData.oldPassword && userData.newPassword) {
        updateData.old_password = userData.oldPassword;
        updateData.new_password = userData.newPassword;
      }
      
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const userId = currentUser.user.id;
      
      const response = await userApi.updateUser(userId, updateData, token);
      
      // Cập nhật dữ liệu người dùng trong state
      if (response && response.data) {
        const updatedUser = {
          ...currentUser.user,
          first_name: updateData.first_name,
          last_name: updateData.last_name,
          email: updateData.email || currentUser.user.email,
        };
        
        // Cập nhật localStorage
        const updatedUserData = {
          ...currentUser,
          user: updatedUser,
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        // Cập nhật state
        setUserData({
          ...userData,
          fullName: `${updatedUser.first_name} ${updatedUser.last_name}`.trim(),
          email: updatedUser.email,
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        // Đóng dialog
        handleCloseEditDialog();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      // Xử lý lỗi nếu có
      const errorMessage = error.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật thông tin';
      
      if (error.response?.status === 400 && error.response?.data?.old_password) {
        setErrors({
          ...errors,
          oldPassword: 'Mật khẩu hiện tại không chính xác',
        });
      } else {
        setErrors({
          ...errors,
          general: errorMessage,
        });
      }
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          FaceCheckin-AI
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {getMenuItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              {t('common.appName')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Dark/Light mode toggle */}
            <Tooltip title={isDarkMode ? t('common.lightMode') : t('common.darkMode')}>
              <IconButton 
                color="inherit" 
                onClick={toggleTheme} 
                aria-label="toggle dark/light mode"
              >
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            
            {/* User menu */}
            {currentUser && (
              <Box>
                <Tooltip title={t('common.userMenu')}>
                  <IconButton
                    onClick={handleOpenUserMenu}
                    sx={{ p: 0 }}
                    aria-controls="user-menu"
                    aria-haspopup="true"
                  >
                    <Avatar sx={{ bgcolor: isAdmin() ? 'primary.main' : 'secondary.main' }}>
                      {currentUser && currentUser.user ? 
                        (currentUser.user.first_name ? currentUser.user.first_name.charAt(0) : 
                         currentUser.user.username ? currentUser.user.username.charAt(0).toUpperCase() : 'U')
                        : 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  id="user-menu"
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleCloseUserMenu}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem onClick={handleCloseUserMenu}>
                    <ListItemIcon>
                      <AccountIcon fontSize="small" />
                    </ListItemIcon>
                    <Box>
                      <Typography variant="body2">
                        {currentUser?.user?.username || 'User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isAdmin() ? 'Quản trị viên' : 'Nhân viên'}
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem onClick={handleOpenEditDialog}>
                    <ListItemIcon>
                      <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body2">Chỉnh sửa thông tin</Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body2">{t('common.logout')}</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      {!isAdminPage && (
        <Box
          component="nav"
          sx={{ 
            width: { sm: drawerWidth }, 
            flexShrink: { sm: 0 },
            zIndex: (theme) => theme.zIndex.drawer
          }}
          aria-label="mailbox folders"
        >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          p: { xs: 2, sm: 3 },
          mt: { xs: 2, sm: 0 },
          overflow: 'auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch'
        }}
      >
        <Toolbar />
        <Box sx={{ 
          width: '100%', 
          maxWidth: '100%', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch'
        }}>
          {children}
        </Box>
      </Box>
      
      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Chỉnh sửa thông tin tài khoản</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên đăng nhập"
                name="username"
                value={userData.username}
                disabled
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Họ và tên"
                name="fullName"
                value={userData.fullName}
                onChange={handleUserDataChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={userData.email}
                onChange={handleUserDataChange}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Đổi mật khẩu
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" error={!!errors.oldPassword}>
                <InputLabel>Mật khẩu hiện tại</InputLabel>
                <OutlinedInput
                  name="oldPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={userData.oldPassword}
                  onChange={handleUserDataChange}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  }
                  label="Mật khẩu hiện tại"
                />
                {errors.oldPassword && (
                  <FormHelperText>{errors.oldPassword}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" error={!!errors.newPassword}>
                <InputLabel>Mật khẩu mới</InputLabel>
                <OutlinedInput
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={userData.newPassword}
                  onChange={handleUserDataChange}
                  label="Mật khẩu mới"
                />
                {errors.newPassword && (
                  <FormHelperText>{errors.newPassword}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" error={!!errors.confirmPassword}>
                <InputLabel>Xác nhận mật khẩu mới</InputLabel>
                <OutlinedInput
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={userData.confirmPassword}
                  onChange={handleUserDataChange}
                  label="Xác nhận mật khẩu mới"
                />
                {errors.confirmPassword && (
                  <FormHelperText>{errors.confirmPassword}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="primary">
            Hủy
          </Button>
          <Button onClick={handleSubmitUserEdit} color="primary" variant="contained">
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Layout;