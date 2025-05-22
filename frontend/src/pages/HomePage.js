import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Stack,
  Divider,
  Chip,
  Container,
  useTheme,
  alpha,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
  CameraAlt as CameraIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  LaptopMac as LaptopIcon,
  Fingerprint as FingerprintIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { employeeApi, departmentApi, shiftApi, attendanceApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../translations';

// Modern stat card with gradient background
const StatCard = ({ title, value, icon, color, isLoading }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  return (
    <Card 
      sx={{
        height: '100%',
        background: isDark 
          ? `linear-gradient(45deg, ${alpha(theme.palette[color].dark, 0.8)}, ${alpha(theme.palette[color].main, 0.4)})`
          : `linear-gradient(45deg, ${alpha(theme.palette[color].light, 0.8)}, ${alpha(theme.palette[color].main, 0.3)})`,
        color: isDark ? '#fff' : theme.palette.text.primary,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          borderRadius: '50%',
          background: isDark 
            ? alpha(theme.palette[color].main, 0.15)
            : alpha(theme.palette[color].main, 0.07),
        }
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              backgroundColor: isDark 
                ? alpha(theme.palette[color].light, 0.2)
                : alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].main,
              p: 1,
              mr: 2,
              boxShadow: isDark 
                ? `0 0 10px ${alpha(theme.palette[color].main, 0.5)}`
                : 'none',
            }}
          >
            {icon}
          </Avatar>
          <Typography variant="h6" fontWeight="500" color="inherit">
            {title}
          </Typography>
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} color={color} />
          </Box>
        ) : (
          <Typography 
            variant="h3" 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              mb: 1.5,
              textShadow: isDark ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            {value}
          </Typography>
        )}
        
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            mt: 1
          }}
        >
          <TrendingUpIcon 
            sx={{ 
              fontSize: '1rem', 
              mr: 0.5,
              color: isDark 
                ? alpha(theme.palette.success.main, 0.8)
                : theme.palette.success.main
            }} 
          />
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 500,
              color: isDark 
                ? alpha(theme.palette.success.main, 0.8)
                : theme.palette.success.main
            }}
          >
            +{Math.floor(Math.random() * 20) + 5}% từ tháng trước
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Enhanced feature card
const FeatureCard = ({ title, description, icon, linkTo, color }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          right: -20,
          top: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: isDark 
            ? alpha(theme.palette[color].main, 0.15)
            : alpha(theme.palette[color].main, 0.07),
          zIndex: 0
        }}
      />
      
      <CardContent sx={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>
        <Avatar
          sx={{
            backgroundColor: isDark 
              ? alpha(theme.palette[color].main, 0.2)
              : alpha(theme.palette[color].main, 0.1),
            color: theme.palette[color].main,
            width: 48,
            height: 48,
            mb: 2,
            boxShadow: isDark 
              ? `0 0 10px ${alpha(theme.palette[color].main, 0.4)}`
              : 'none',
          }}
        >
          {icon}
        </Avatar>
        
        <Typography 
          variant="h6" 
          component="div" 
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          {title}
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          {description}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
        <Button 
          endIcon={<ArrowForwardIcon />} 
          component={Link} 
          to={linkTo}
          color={color}
          sx={{
            fontWeight: 600,
            '&:hover': {
              backgroundColor: isDark 
                ? alpha(theme.palette[color].main, 0.1)
                : alpha(theme.palette[color].main, 0.05),
            }
          }}
        >
          Truy cập
        </Button>
      </CardActions>
    </Card>
  );
};

const InfoBanner = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        background: isDark 
          ? `linear-gradient(120deg, ${alpha(theme.palette.primary.dark, 0.7)}, ${alpha(theme.palette.primary.main, 0.4)})`
          : `linear-gradient(120deg, ${alpha(theme.palette.primary.light, 0.2)}, ${alpha(theme.palette.primary.main, 0.08)})`,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          right: -30,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: isDark 
            ? alpha(theme.palette.primary.main, 0.1)
            : alpha(theme.palette.primary.main, 0.07),
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          left: '40%',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: isDark 
            ? alpha(theme.palette.primary.main, 0.15)
            : alpha(theme.palette.primary.main, 0.05),
          zIndex: 0
        }}
      />
      
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <FingerprintIcon 
            color="primary" 
            sx={{ 
              fontSize: '2.5rem',
              filter: isDark ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' : 'none'
            }} 
          />
          <Typography variant="h5" fontWeight="700" color="primary.main">
            FaceTrack-AI
          </Typography>
          <Chip 
            label="v1.0" 
            size="small" 
            color="primary" 
            variant={isDark ? "default" : "outlined"}
            sx={{ height: 22 }} 
          />
        </Stack>
        <Typography variant="body1" paragraph mb={3}>
          Hệ thống chấm công khuôn mặt hiện đại sử dụng trí tuệ nhân tạo để 
          nhận diện chính xác và chống giả mạo. Quản lý thông tin nhân viên 
          và dữ liệu chấm công một cách hiệu quả.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CameraIcon />}
            component={Link}
            to="/check-in"
            sx={{ fontWeight: 600 }}
          >
            Chấm công ngay
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<SpeedIcon />}
            component={Link}
            to="/attendance-reports"
          >
            Xem báo cáo
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

const HomePage = () => {
  const { currentUser, isAdmin, isEmployee, getUserInfo } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  
  // Log để kiểm tra dữ liệu
  console.log("currentUser:", currentUser);
  console.log("getUserInfo:", getUserInfo());
  console.log("isAdmin:", isAdmin());
  
  const [stats, setStats] = useState({
    employees: 0,
    departments: 0,
    shifts: 0,
    todayAttendance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [employeesRes, departmentsRes, shiftsRes, attendanceRes] = await Promise.all([
          employeeApi.getAll(),
          departmentApi.getAll(),
          shiftApi.getAll(),
          attendanceApi.getToday(),
        ]);

        setStats({
          employees: employeesRes.data.length,
          departments: departmentsRes.data.length,
          shifts: shiftsRes.data.length,
          todayAttendance: attendanceRes.data.total,
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu tổng quan. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography 
        variant="h4" 
        gutterBottom
        fontWeight="bold"
        sx={{ 
          mb: 3, 
          position: 'relative',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: '-8px',
            left: 0,
            width: '40px',
            height: '4px',
            backgroundColor: theme.palette.primary.main,
            borderRadius: '2px'
          }
        }}
      >
        {t('home.welcome')}, {currentUser && currentUser.user 
          ? `${currentUser.user.first_name || ''} ${currentUser.user.last_name || ''}`.trim() || currentUser.user.username
          : 'User'}!
      </Typography>
      
      <InfoBanner />
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      <Typography 
        variant="h5" 
        gutterBottom 
        fontWeight="600"
        sx={{ mb: 2 }}
      >
        Tổng quan hệ thống
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Nhân viên"
            value={stats.employees}
            icon={<PeopleIcon />}
            color="primary"
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Phòng ban"
            value={stats.departments}
            icon={<BusinessIcon />}
            color="secondary"
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ca làm việc"
            value={stats.shifts}
            icon={<ScheduleIcon />}
            color="info"
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Điểm danh hôm nay"
            value={stats.todayAttendance}
            icon={<AccessTimeIcon />}
            color="success"
            isLoading={loading}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h5" 
          gutterBottom 
          fontWeight="600"
          sx={{ mb: 2 }}
        >
          Truy cập nhanh
        </Typography>
        
        <Grid container spacing={3}>
          {/* Tất cả người dùng có thể truy cập */}
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard
              title={t('menu.checkin')}
              description={t('home.checkInDescription')}
              icon={<CameraIcon />}
              linkTo="/check-in"
              color="primary"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard
              title={t('menu.reports')}
              description={t('home.reportsDescription')}
              icon={<AccessTimeIcon />}
              linkTo="/attendance-reports"
              color="info"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <FeatureCard
              title="Hỗ trợ"
              description="Được hỗ trợ khi gặp vấn đề sử dụng hệ thống"
              icon={<LaptopIcon />}
              linkTo="/support"
              color="success"
            />
          </Grid>
          
          {/* Chỉ admin mới có thể truy cập */}
          {isAdmin() && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <FeatureCard
                  title={t('menu.employees')}
                  description={t('home.employeesDescription')}
                  icon={<PeopleIcon />}
                  linkTo="/employees"
                  color="secondary"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <FeatureCard
                  title={t('menu.departments')}
                  description="Quản lý và sắp xếp các phòng ban trong công ty"
                  icon={<BusinessIcon />}
                  linkTo="/departments"
                  color="warning"
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <FeatureCard
                  title={t('menu.shifts')}
                  description="Quản lý ca làm việc và lịch trình nhân viên"
                  icon={<ScheduleIcon />}
                  linkTo="/shifts"
                  color="error"
                />
              </Grid>
            </>
          )}
        </Grid>
      </Box>

    </Container>
  );
};

export default HomePage; 