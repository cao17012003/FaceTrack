import React, { useState, useEffect } from 'react';
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
  Grid
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  Money as MoneyIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { notificationApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, getEmployeeId } = useAuth();
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const employeeId = getEmployeeId();
      if (!employeeId) {
        setError('Không tìm thấy thông tin nhân viên');
        setLoading(false);
        return;
      }
      
      const response = await notificationApi.getAll({ employee_id: employeeId });
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Có lỗi xảy ra khi tải thông báo. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      const employeeId = getEmployeeId();
      if (!employeeId) return;
      
      await notificationApi.markAllAsRead(employeeId);
      fetchNotifications(); // Reload notifications
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      setError('Có lỗi xảy ra khi đánh dấu đã đọc. Vui lòng thử lại sau.');
    }
  };
  
  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications(); // Reload notifications
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Có lỗi xảy ra khi đánh dấu đã đọc. Vui lòng thử lại sau.');
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
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Hòm thư của tôi</Typography>
        <Button 
          variant="contained" 
          onClick={handleMarkAllAsRead}
          disabled={loading || notifications.filter(n => !n.is_read).length === 0}
        >
          Đánh dấu tất cả là đã đọc
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length > 0 ? (
        <Paper>
          <List>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    bgcolor: notification.is_read ? 'transparent' : 'rgba(25, 118, 210, 0.05)',
                    position: 'relative'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      {getIconForType(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Grid container alignItems="center" spacing={1}>
                        <Grid item xs>
                          <Typography variant="subtitle1" component="div">
                            {notification.title}
                          </Typography>
                        </Grid>
                        <Grid item>
                          <Chip 
                            size="small" 
                            label={formatDate(notification.created_at)}
                            variant="outlined"
                            color="primary"
                          />
                        </Grid>
                        {!notification.is_read && (
                          <Grid item>
                            <Chip 
                              size="small" 
                              color="error" 
                              label="Mới"
                              sx={{ ml: 1 }}
                            />
                          </Grid>
                        )}
                      </Grid>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          sx={{ display: 'block' }}
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {notification.message}
                        </Typography>
                        
                        {!notification.is_read && (
                          <Button 
                            size="small" 
                            variant="text" 
                            onClick={() => handleMarkAsRead(notification.id)}
                            sx={{ mt: 1 }}
                          >
                            Đánh dấu đã đọc
                          </Button>
                        )}
                      </React.Fragment>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Không có thông báo nào
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hiện tại bạn không có thông báo nào. Khi có thông báo mới, nó sẽ xuất hiện ở đây.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default NotificationsPage; 