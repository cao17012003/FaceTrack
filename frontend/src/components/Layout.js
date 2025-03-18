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
} from '@mui/icons-material';
import { useTranslation } from '../translations';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = React.useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleTheme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { currentUser, isAdmin, isEmployee, logout } = useAuth();

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
    
    // Bỏ tạm thời điều kiện kiểm tra admin để test
    // if (isAdmin()) {
      menuItems = [...menuItems, ...adminMenuItems];
    // }
    
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              {t('common.appName')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Dark/Light mode toggle */}
            <Tooltip title={isDarkMode ? t('common.lightMode') : t('common.darkMode')}>
              <IconButton 
                color="inherit" 
                onClick={toggleTheme} 
                sx={{ ml: 1 }}
                aria-label="toggle dark/light mode"
              >
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            
            {/* User menu */}
            {currentUser && (
              <Box sx={{ ml: 2 }}>
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
                    <Typography variant="body2">{currentUser.fullName}</Typography>
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
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
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
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default Layout; 