import React from 'react';
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
} from '@mui/icons-material';
import { useTranslation } from '../translations';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = React.useState(null);
  const [openEditDialog, setOpenEditDialog] = React.useState(false);
  const [userData, setUserData] = React.useState({
    username: 'admin',
    fullName: '',
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleTheme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { currentUser, isAdmin, isEmployee, logout } = useAuth();
  
  // Debug user information
  React.useEffect(() => {
    console.log('Current user in Layout:', currentUser);
    // Initialize user data from currentUser if available
    if (currentUser) {
      setUserData(prev => ({
        ...prev,
        username: currentUser.username || 'admin',
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
      }));
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
      { text: t('menu.notifications'), path: '/notifications', icon: <NotificationsIcon />, allowedRoles: ['admin', 'employee'] },
    ];
    
    // Menu items only for admin
    const adminMenuItems = [
      { text: t('menu.employees'), path: '/employees', icon: <PeopleIcon />, allowedRoles: ['admin'] },
      { text: t('menu.departments'), path: '/departments', icon: <BusinessIcon />, allowedRoles: ['admin'] },
      { text: t('menu.shifts'), path: '/shifts', icon: <ScheduleIcon />, allowedRoles: ['admin'] },
      { text: t('menu.calendar'), path: '/calendar', icon: <CalendarIcon />, allowedRoles: ['admin'] },
    ];
    
    let menuItems = [...commonMenuItems];
    
    // Bỏ tạm thởi điều kiện kiểm tra admin để test
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
    if (validateForm()) {
      try {
        // Here you would make an API call to update the user information
        console.log('Updating user with data:', userData);
        
        // Mock success for now
        alert('Thông tin tài khoản đã được cập nhật!');
        handleCloseEditDialog();
        
        // In a real app, you would call your API here
        // const response = await userApi.update(userData);
        // if (response.success) {
        //   // Update the auth context with new user information
        //   // updateCurrentUser(response.data);
        //   handleCloseEditDialog();
        // }
      } catch (error) {
        console.error('Error updating user:', error);
        alert('Đã có lỗi xảy ra khi cập nhật thông tin.');
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
                      {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
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
                    <Typography variant="body2">
                      {"admin"}
                    </Typography>
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