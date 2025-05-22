import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Tab,
  Tabs,
  SwipeableDrawer,
  TextField,
  InputAdornment,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  Money as MoneyIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  DeleteOutline as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { notificationApi, employeeApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { currentUser, getEmployeeId, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  // Add state to track expanded notification
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);
  
  // State cho dialogue xác nhận xóa
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  
  // State cho chức năng tạo thông báo mới
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'system',
    target: 'all', // 'all' hoặc 'specific'
    employee_ids: []
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Tính toán số lượng thông báo chưa đọc
  const unreadCount = useMemo(() => {
    if (isAdmin()) {
      // Admin đếm thông báo chưa đọc bởi admin
      return notifications.filter(notification => !notification.is_read_by_admin).length;
    } else {
      // Nhân viên đếm thông báo chưa đọc bởi nhân viên
      return notifications.filter(notification => !notification.is_read).length;
    }
  }, [notifications, isAdmin]);
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  useEffect(() => {
    // Lọc thông báo dựa trên tab hiện tại và các bộ lọc
    let filtered = [...notifications];
    
    // Lọc theo tab
    if (activeTab === 1) {
      if (isAdmin()) {
        // Admin xem thông báo chưa đọc bởi admin
        filtered = filtered.filter(n => !n.is_read_by_admin);
      } else {
        // Nhân viên xem thông báo chưa đọc bởi nhân viên
      filtered = filtered.filter(n => !n.is_read);
      }
    } else if (activeTab === 2) {
      if (isAdmin()) {
        // Admin xem thông báo đã đọc bởi admin
        filtered = filtered.filter(n => n.is_read_by_admin);
      } else {
        // Nhân viên xem thông báo đã đọc bởi nhân viên
      filtered = filtered.filter(n => n.is_read);
      }
    }
    
    // Lọc theo loại thông báo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }
    
    // Lọc theo thời gian
    const now = new Date();
    if (dateFilter === 'today') {
      filtered = filtered.filter(n => {
        const notifDate = new Date(n.created_at);
        return notifDate.toDateString() === now.toDateString();
      });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(n => {
        const notifDate = new Date(n.created_at);
        return notifDate >= weekAgo;
      });
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(n => {
        const notifDate = new Date(n.created_at);
        return notifDate >= monthAgo;
      });
    }
    
    // Lọc theo tìm kiếm
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(term) || 
        n.message.toLowerCase().includes(term)
      );
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, activeTab, typeFilter, dateFilter, searchTerm]);
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const employeeId = getEmployeeId();
      if (!employeeId && !isAdmin()) {
        setError('Không tìm thấy thông tin nhân viên');
        setLoading(false);
        return;
      }
      
      let response;
      if (isAdmin()) {
        // Admin có thể xem tất cả thông báo
        response = await notificationApi.getAll();
      } else {
        // Nhân viên chỉ xem thông báo của mình
        response = await notificationApi.getAll({ employee_id: employeeId });
      }
      
      setNotifications(response.data);
    } catch (err) {
      console.error('Lỗi khi tải thông báo:', err);
      setError('Có lỗi xảy ra khi tải thông báo. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      const employeeId = getEmployeeId();
      
      // Nếu không phải admin và không có employeeId thì return
      if (!isAdmin() && !employeeId) return;
      
      // Sử dụng employeeId nếu là nhân viên, nếu là admin thì có thể không cần employeeId
      await notificationApi.markAllAsRead(employeeId);
      
      // Cập nhật lại danh sách thông báo và badge count
      fetchNotifications();
      setSuccess('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc:', err);
      setError('Có lỗi xảy ra khi đánh dấu đã đọc. Vui lòng thử lại sau.');
    }
  };
  
  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      
      // Cập nhật lại danh sách thông báo sau khi đánh dấu đã đọc
      fetchNotifications();
      
      setSuccess('Đã đánh dấu thông báo là đã đọc');
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc:', err);
      setError('Có lỗi xảy ra khi đánh dấu đã đọc. Vui lòng thử lại sau.');
    }
  };
  
  const handleDeleteNotification = async (id) => {
    try {
      // Chỉ admin mới có quyền xóa thông báo
      if (!isAdmin()) {
        setError('Chỉ admin mới có quyền xóa thông báo');
        setDeleteConfirmOpen(false);
        return;
      }
      
      await notificationApi.delete(id);
      fetchNotifications();
      setSuccess('Đã xóa thông báo thành công');
      handleCloseMenu();
      setDeleteConfirmOpen(false);
    } catch (err) {
      console.error('Lỗi khi xóa thông báo:', err);
      if (err.response && err.response.data) {
        // Hiển thị thông báo lỗi chi tiết từ API
        setError(`Không thể xóa thông báo: ${err.response.data.error || 'Chỉ admin mới có quyền xóa thông báo'}`);
      } else {
        setError('Có lỗi xảy ra khi xóa thông báo.');
      }
      setDeleteConfirmOpen(false);
    }
  };
  
  const handleOpenMenu = (event, notification) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };
  
  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleClearFilters = () => {
    setTypeFilter('all');
    setDateFilter('all');
    setSearchTerm('');
    setFilterDrawerOpen(false);
  };
  
  // Hàm xử lý tạo thông báo mới
  const fetchEmployees = async () => {
    if (isAdmin()) {
      setLoadingEmployees(true);
      try {
        const response = await employeeApi.getAll();
        // Đảm bảo mỗi employee có đầy đủ thông tin cần thiết
        const employeesWithIds = response.data.map(employee => ({
          ...employee,
          fullName: `${employee.first_name || ''} ${employee.last_name || ''}`.trim()
        }));
        setEmployees(employeesWithIds);
      } catch (err) {
        console.error('Lỗi khi tải danh sách nhân viên:', err);
        setError('Không thể tải danh sách nhân viên');
      } finally {
        setLoadingEmployees(false);
      }
    }
  };
  
  const handleOpenCreateDialog = () => {
    if (isAdmin()) {
      fetchEmployees();
      setCreateDialogOpen(true);
    }
  };
  
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewNotification({
      title: '',
      message: '',
      type: 'system',
      target: 'all',
      employee_ids: []
    });
    setFormErrors({});
  };
  
  const handleNotificationChange = (e) => {
    const { name, value } = e.target;
    setNewNotification(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Xóa lỗi khi người dùng bắt đầu nhập
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const errors = {};
    if (!newNotification.title.trim()) {
      errors.title = 'Tiêu đề không được để trống';
    }
    if (!newNotification.message.trim()) {
      errors.message = 'Nội dung không được để trống';
    }
    if (newNotification.target === 'specific' && newNotification.employee_ids.length === 0) {
      errors.employee_ids = 'Vui lòng chọn ít nhất một nhân viên';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleCreateNotification = async () => {
    if (!validateForm()) return;
    
    try {
      let data = {
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type
      };
      
      if (newNotification.target === 'all') {
        // Gửi thông báo cho tất cả nhân viên
        const response = await employeeApi.getAll();
        const allEmployees = response.data;
        
        // Tạo danh sách promises để gửi thông báo đến tất cả nhân viên
        const promises = allEmployees.map(employee => 
          notificationApi.create({
            ...data,
            employee: employee.employee_id  // Sử dụng employee_id thay vì id
          })
        );
        
        await Promise.all(promises);
      } else if (newNotification.target === 'specific') {
        // Gửi thông báo cho từng nhân viên được chọn
        const promises = newNotification.employee_ids.map(employeeId => 
          notificationApi.create({
            ...data,
            employee: employeeId  // Gửi trực tiếp employee_id
          })
        );
        
        await Promise.all(promises);
      }
      
      setSuccess('Đã tạo thông báo thành công');
      handleCloseCreateDialog();
      fetchNotifications();
    } catch (err) {
      console.error('Lỗi khi tạo thông báo:', err);
      if (err.response && err.response.data) {
        // Hiển thị thông báo lỗi chi tiết từ API nếu có
        setError(`Lỗi: ${JSON.stringify(err.response.data)}`);
      } else {
        setError('Có lỗi xảy ra khi tạo thông báo mới. Vui lòng kiểm tra lại thông tin.');
      }
    }
  };
  
  const getIconForType = (type) => {
    switch(type) {
      case 'system':
        return <InfoIcon color="info" />;
      case 'attendance':
        return <AccessTimeIcon color="success" />;
      case 'leave':
        return <EmailIcon color="warning" />;
      case 'payroll':
        return <MoneyIcon color="error" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };
  
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'HH:mm - dd/MM/yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  const getTypeLabel = (type) => {
    switch(type) {
      case 'system':
        return 'Hệ thống';
      case 'attendance':
        return 'Chấm công';
      case 'leave':
        return 'Nghỉ phép';
      case 'payroll':
        return 'Lương thưởng';
      default:
        return 'Khác';
    }
  };
  
  const openDeleteConfirm = (notification) => {
    setNotificationToDelete(notification);
    setDeleteConfirmOpen(true);
    handleCloseMenu();
  };
  
  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setNotificationToDelete(null);
  };
  
  // Handler for expanding/collapsing notifications
  const handleToggleExpand = (notificationId) => {
    if (expandedNotificationId === notificationId) {
      setExpandedNotificationId(null); // Collapse if already expanded
    } else {
      setExpandedNotificationId(notificationId); // Expand if not expanded
      
      // If notification is unread, mark it as read when expanded
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        if ((isAdmin() && !notification.is_read_by_admin) || 
            (!isAdmin() && !notification.is_read)) {
          handleMarkAsRead(notificationId);
        }
      }
    }
  };
  
  return (
    <Box>
      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(null)}
        message={success}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Hòm thư của tôi
          {unreadCount > 0 && (
            <Badge
              color="error"
              badgeContent={unreadCount}
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        
        <Box>
          {isAdmin() && (
            <Tooltip title="Tạo thông báo mới">
              <Button 
                variant="contained" 
                color="success"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
                sx={{ mr: 1 }}
              >
                Tạo thông báo
              </Button>
            </Tooltip>
          )}
          
          <Tooltip title="Làm mới">
            <IconButton onClick={fetchNotifications} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Bộ lọc">
            <IconButton onClick={() => setFilterDrawerOpen(true)} sx={{ mr: 1 }}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          
          <Button 
            variant="contained" 
            onClick={handleMarkAllAsRead}
            disabled={loading || notifications.filter(n => !n.is_read).length === 0}
            startIcon={<CheckCircleIcon />}
          >
            Đánh dấu tất cả là đã đọc
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Tìm kiếm thông báo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchTerm('')} size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          size="small"
          variant="outlined"
        />
      </Box>
      
      <Tabs 
        value={activeTab} 
        onChange={handleChangeTab} 
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label="Tất cả" />
        <Tab 
          label="Chưa đọc" 
          icon={unreadCount > 0 ? <Badge color="error" badgeContent={unreadCount} /> : null}
          iconPosition="end"
        />
        <Tab label="Đã đọc" />
      </Tabs>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredNotifications.length > 0 ? (
        <Paper elevation={3}>
          <List>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  alignItems="flex-start"
                  onClick={() => handleToggleExpand(notification.id)}
                  sx={{ 
                    bgcolor: isAdmin() 
                      ? notification.is_read_by_admin ? 'transparent' : 'rgba(25, 118, 210, 0.05)'
                      : notification.is_read ? 'transparent' : 'rgba(25, 118, 210, 0.05)',
                    position: 'relative',
                    transition: 'background-color 0.3s',
                    '&:hover': {
                      bgcolor: isAdmin()
                        ? notification.is_read_by_admin ? 'rgba(0, 0, 0, 0.04)' : 'rgba(25, 118, 210, 0.1)'
                        : notification.is_read ? 'rgba(0, 0, 0, 0.04)' : 'rgba(25, 118, 210, 0.1)',
                    },
                    cursor: 'pointer' // Show pointer cursor to indicate clickable
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: isAdmin() 
                                        ? notification.is_read_by_admin ? 'action.disabled' : 'primary.main'
                                        : notification.is_read ? 'action.disabled' : 'primary.main' }}>
                      {getIconForType(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Grid container alignItems="center" spacing={1}>
                        <Grid item xs>
                          <Typography 
                            variant="subtitle1" 
                            component="div"
                            sx={{ 
                              fontWeight: isAdmin()
                                ? notification.is_read_by_admin ? 'normal' : 'bold'
                                : notification.is_read ? 'normal' : 'bold',
                            }}
                          >
                            {notification.title}
                          </Typography>
                        </Grid>
                        <Grid item>
                          <Chip 
                            size="small" 
                            label={getTypeLabel(notification.type)}
                            color={isAdmin()
                                 ? notification.is_read_by_admin ? "default" : "primary"
                                 : notification.is_read ? "default" : "primary"}
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                          <Chip 
                            size="small" 
                            label={formatDate(notification.created_at)}
                            variant="outlined"
                            color="secondary"
                          />
                        </Grid>
                        {isAdmin() 
                          ? !notification.is_read_by_admin && (
                            <Grid item>
                              <Chip 
                                size="small" 
                                color="error" 
                                label="Mới"
                              />
                            </Grid>
                          )
                          : !notification.is_read && (
                          <Grid item>
                            <Chip 
                              size="small" 
                              color="error" 
                              label="Mới"
                            />
                          </Grid>
                        )}
                      </Grid>
                    }
                    secondary={
                      <React.Fragment>
                        {/* Only show message if notification is expanded */}
                        {expandedNotificationId === notification.id && (
                        <Typography
                          sx={{ 
                            display: 'block', 
                            mt: 1,
                              fontWeight: isAdmin() 
                                  ? notification.is_read_by_admin ? 'normal' : 500
                                  : notification.is_read ? 'normal' : 500,
                          }}
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {notification.message}
                        </Typography>
                        )}
                        
                        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                          {isAdmin() 
                            ? !notification.is_read_by_admin && (
                            <Button 
                              size="small" 
                              variant="outlined"
                              color="primary"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent notification expansion
                                  handleMarkAsRead(notification.id);
                                }}
                                startIcon={<CheckCircleIcon />}
                                sx={{ mr: 1 }}
                              >
                                Đánh dấu đã đọc
                              </Button>
                            )
                            : !notification.is_read && (
                              <Button 
                                size="small" 
                                variant="outlined"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent notification expansion
                                  handleMarkAsRead(notification.id);
                                }}
                              startIcon={<CheckCircleIcon />}
                              sx={{ mr: 1 }}
                            >
                              Đánh dấu đã đọc
                            </Button>
                          )}
                          
                          {/* Only show menu button if user is admin or notification is unread */}
                          {(isAdmin() || !notification.is_read) && (
                          <IconButton
                            size="small"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent notification expansion
                                handleOpenMenu(e, notification);
                              }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                          )}
                        </Box>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }} elevation={3}>
          <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Không có thông báo nào
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || typeFilter !== 'all' || dateFilter !== 'all' 
              ? 'Không tìm thấy thông báo nào phù hợp với bộ lọc của bạn.'
              : 'Hiện tại bạn không có thông báo nào. Khi có thông báo mới, nó sẽ xuất hiện ở đây.'}
          </Typography>
          {(searchTerm || typeFilter !== 'all' || dateFilter !== 'all') && (
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }}
              onClick={handleClearFilters}
            >
              Xóa bộ lọc
            </Button>
          )}
        </Paper>
      )}
      
      {/* Menu cho từng thông báo */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {selectedNotification && (isAdmin() 
          ? !selectedNotification.is_read_by_admin 
          : !selectedNotification.is_read) && (
          <MenuItem onClick={() => {
            handleMarkAsRead(selectedNotification.id);
            handleCloseMenu();
          }}>
            <ListItemAvatar sx={{ minWidth: 36 }}>
              <CheckCircleIcon fontSize="small" />
            </ListItemAvatar>
            <ListItemText primary="Đánh dấu đã đọc" />
          </MenuItem>
        )}
        
        {isAdmin() && (
          <MenuItem onClick={() => openDeleteConfirm(selectedNotification)}>
            <ListItemAvatar sx={{ minWidth: 36 }}>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemAvatar>
            <ListItemText primary="Xóa thông báo" />
          </MenuItem>
        )}
      </Menu>
      
      {/* Drawer cho bộ lọc */}
      <SwipeableDrawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onOpen={() => setFilterDrawerOpen(true)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Bộ lọc thông báo</Typography>
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Loại thông báo</Typography>
          <Box sx={{ mb: 3 }}>
            <Button
              variant={typeFilter === 'all' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setTypeFilter('all')}
              sx={{ mr: 1, mb: 1 }}
            >
              Tất cả
            </Button>
            <Button
              variant={typeFilter === 'system' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setTypeFilter('system')}
              sx={{ mr: 1, mb: 1 }}
              color="info"
            >
              Hệ thống
            </Button>
            <Button
              variant={typeFilter === 'attendance' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setTypeFilter('attendance')}
              sx={{ mr: 1, mb: 1 }}
              color="success"
            >
              Chấm công
            </Button>
            <Button
              variant={typeFilter === 'leave' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setTypeFilter('leave')}
              sx={{ mr: 1, mb: 1 }}
              color="warning"
            >
              Nghỉ phép
            </Button>
            <Button
              variant={typeFilter === 'payroll' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setTypeFilter('payroll')}
              sx={{ mr: 1, mb: 1 }}
              color="error"
            >
              Lương thưởng
            </Button>
          </Box>
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Thời gian</Typography>
          <Box sx={{ mb: 3 }}>
            <Button
              variant={dateFilter === 'all' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setDateFilter('all')}
              sx={{ mr: 1, mb: 1 }}
            >
              Tất cả
            </Button>
            <Button
              variant={dateFilter === 'today' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setDateFilter('today')}
              sx={{ mr: 1, mb: 1 }}
            >
              Hôm nay
            </Button>
            <Button
              variant={dateFilter === 'week' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setDateFilter('week')}
              sx={{ mr: 1, mb: 1 }}
            >
              Tuần này
            </Button>
            <Button
              variant={dateFilter === 'month' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setDateFilter('month')}
              sx={{ mr: 1, mb: 1 }}
            >
              Tháng này
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button 
              variant="outlined" 
              onClick={handleClearFilters}
            >
              Xóa bộ lọc
            </Button>
            <Button 
              variant="contained" 
              onClick={() => setFilterDrawerOpen(false)}
            >
              Áp dụng
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>
      
      {/* Dialog tạo thông báo mới */}
      <Dialog 
        open={createDialogOpen} 
        onClose={handleCloseCreateDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Tạo thông báo mới</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              name="title"
              label="Tiêu đề thông báo"
              fullWidth
              value={newNotification.title}
              onChange={handleNotificationChange}
              margin="normal"
              error={!!formErrors.title}
              helperText={formErrors.title}
            />
            
            <TextField
              name="message"
              label="Nội dung thông báo"
              fullWidth
              multiline
              rows={4}
              value={newNotification.message}
              onChange={handleNotificationChange}
              margin="normal"
              error={!!formErrors.message}
              helperText={formErrors.message}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Loại thông báo</InputLabel>
              <Select
                name="type"
                value={newNotification.type}
                onChange={handleNotificationChange}
              >
                <MenuItem value="system">Hệ thống</MenuItem>
                <MenuItem value="attendance">Chấm công</MenuItem>
                <MenuItem value="leave">Nghỉ phép</MenuItem>
                <MenuItem value="payroll">Lương thưởng</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Gửi đến</InputLabel>
              <Select
                name="target"
                value={newNotification.target}
                onChange={handleNotificationChange}
              >
                <MenuItem value="all">Tất cả nhân viên</MenuItem>
                <MenuItem value="specific">Nhân viên cụ thể</MenuItem>
              </Select>
            </FormControl>
            
            {newNotification.target === 'specific' && (
              <FormControl fullWidth margin="normal" error={!!formErrors.employee_ids}>
                <InputLabel>Chọn nhân viên</InputLabel>
                <Select
                  name="employee_ids"
                  multiple
                  value={newNotification.employee_ids}
                  onChange={handleNotificationChange}
                  renderValue={(selected) => `Đã chọn ${selected.length} nhân viên`}
                >
                  {loadingEmployees ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Đang tải danh sách nhân viên...
                    </MenuItem>
                  ) : employees.length === 0 ? (
                    <MenuItem disabled>Không có nhân viên nào</MenuItem>
                  ) : (
                    employees.map((employee) => (
                      <MenuItem key={employee.employee_id} value={employee.employee_id}>
                        {employee.first_name} {employee.last_name} ({employee.employee_id})
                      </MenuItem>
                    ))
                  )}
                </Select>
                {formErrors.employee_ids && (
                  <FormHelperText>{formErrors.employee_ids}</FormHelperText>
                )}
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Hủy bỏ</Button>
          <Button 
            onClick={handleCreateNotification} 
            variant="contained" 
            color="primary"
          >
            Gửi thông báo
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog xác nhận xóa thông báo */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={closeDeleteConfirm}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          {isAdmin() ? (
            <Typography>
              Bạn có chắc chắn muốn xóa thông báo này không? Hành động này không thể hoàn tác.
            </Typography>
          ) : (
            <Typography color="error">
              Chỉ admin mới có quyền xóa thông báo.
            </Typography>
          )}
          {notificationToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {notificationToDelete.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(notificationToDelete.created_at)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm}>
            {isAdmin() ? 'Hủy bỏ' : 'Đóng'}
          </Button>
          {isAdmin() && (
            <Button 
              onClick={() => handleDeleteNotification(notificationToDelete?.id)} 
              color="error" 
              variant="contained"
            >
              Xóa
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationsPage; 