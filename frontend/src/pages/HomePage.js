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
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material';
import { employeeApi, departmentApi, shiftApi, attendanceApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../translations';

const StatCard = ({ title, value, icon, color, isLoading }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            p: 1,
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { sx: { color: `${color}.main` } })}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
          {value}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const FeatureCard = ({ title, description, icon, linkTo, color }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flexGrow: 1 }}>
      <Box
        sx={{
          backgroundColor: `${color}.light`,
          borderRadius: '50%',
          p: 1,
          width: 'fit-content',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {React.cloneElement(icon, { sx: { color: `${color}.main` } })}
      </Box>
      <Typography variant="h6" component="div" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
    <CardActions>
      <Button size="small" component={Link} to={linkTo}>
        Truy cập
      </Button>
    </CardActions>
  </Card>
);

const HomePage = () => {
  const { currentUser, isAdmin, isEmployee } = useAuth();
  const { t } = useTranslation();
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
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('home.welcome')}, {currentUser?.fullName}!
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t('home.quickAccess')}
        </Typography>
        
        <Grid container spacing={3}>
          {/* Tất cả người dùng có thể truy cập */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {t('menu.checkin')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('home.checkInDescription')}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" component={Link} to="/check-in">
                  {t('home.goTo')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {t('menu.reports')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('home.reportsDescription')}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" component={Link} to="/attendance-reports">
                  {t('home.goTo')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          {/* Chỉ admin mới có thể truy cập */}
          {isAdmin() && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {t('menu.employees')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('home.employeesDescription')}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" component={Link} to="/employees">
                      {t('home.goTo')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {t('menu.departments')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('home.departmentsDescription')}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" component={Link} to="/departments">
                      {t('home.goTo')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {t('menu.shifts')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('home.shiftsDescription')}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" component={Link} to="/shifts">
                      {t('home.goTo')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {t('menu.calendar')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('home.calendarDescription')}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" component={Link} to="/calendar">
                      {t('home.goTo')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
      
      {isEmployee() && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('home.employeeNotice')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('home.employeeInfo')}
          </Typography>
        </Paper>
      )}
      
      {isAdmin() && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('home.adminNotice')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('home.adminInfo')}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default HomePage; 