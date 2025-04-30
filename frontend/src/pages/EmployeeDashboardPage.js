import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Avatar, 
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Chip,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Person as PersonIcon, 
  AccessTime as AccessTimeIcon,
  EventAvailable as EventAvailableIcon,
  Check as CheckIcon,
  AccessTimeFilled as AccessTimeFilledIcon,
  MoreTime as MoreTimeIcon,
  CalendarMonth as CalendarMonthIcon,
  DepartureBoard as DepartureBoardIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/vi';
import { employeeApi, attendanceApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AttendanceCalendar from '../components/Dashboard/AttendanceCalendar';
import AttendanceTimeline from '../components/Dashboard/AttendanceTimeline';

// Định nghĩa các thành phần tùy chỉnh
const WelcomeCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
  color: theme.palette.primary.contrastText,
  marginBottom: theme.spacing(3),
  borderRadius: 16
}));

const StatsCard = styled(Card)(({ theme, color }) => ({
  padding: theme.spacing(2),
  borderRadius: 16,
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  backgroundImage: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
  color: '#fff',
  boxShadow: `0 10px 20px ${color}33`,
  transition: 'transform 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)'
  }
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(2),
  top: theme.spacing(2),
  width: 40,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
}));

const AttendanceInfoCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  overflow: 'hidden',
  height: '100%',
  boxShadow: theme.shadows[3],
  transition: 'transform 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)'
  }
}));

const AttendanceStatusChip = ({ status }) => {
  const theme = useTheme();
  let color = '#4caf50';
  let label = 'Đúng giờ';
  let icon = <CheckIcon fontSize="small" />;
  
  if (status === 'late') {
    color = theme.palette.warning.main;
    label = 'Đi muộn';
    icon = <AccessTimeFilledIcon fontSize="small" />;
  } else if (status === 'early') {
    color = theme.palette.warning.light;
    label = 'Về sớm';
    icon = <MoreTimeIcon fontSize="small" />;
  } else if (status === 'late_early') {
    color = theme.palette.error.light;
    label = 'Đi muộn/Về sớm';
    icon = <AccessTimeFilledIcon fontSize="small" />;
  } else if (status === 'absent') {
    color = theme.palette.error.main;
    label = 'Vắng mặt';
    icon = <NotificationsIcon fontSize="small" />;
  }
  
  return (
    <Chip 
      icon={icon}
      label={label}
      size="small"
      sx={{ 
        backgroundColor: color, 
        color: '#fff',
        fontWeight: 'bold'
      }}
    />
  );
};

const EmployeeDashboardPage = () => {
  console.log("EmployeeDashboardPage Component Start");
  const { currentUser } = useAuth();
  console.log("EmployeeDashboardPage currentUser:", JSON.stringify(currentUser, null, 2));
  const theme = useTheme();
  const [employeeInfo, setEmployeeInfo] = useState({
    employee_id: "EMP001",
    first_name: "Nhân viên",
    last_name: "Mẫu",
    department: { name: "Phòng Công nghệ" },
    shift: { 
      name: "Ca Hành Chính", 
      start_time: "08:00:00", 
      end_time: "17:30:00" 
    },
    email: "employee@example.com",
    phone: "0123456789",
    profile_image: null
  });
  const [attendanceStats, setAttendanceStats] = useState({
    totalPresent: 18,
    totalLate: 4,
    totalAbsent: 3,
    attendanceRate: 82
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [calendarData, setCalendarData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tạo dữ liệu mẫu cho giao diện
  const generateMockData = () => {
    // Dữ liệu mẫu cho điểm danh hôm nay
    const currentHour = moment().hour();
    const mockTodayAttendance = {
      employee_id: employeeInfo.employee_id,
      attendance_date: moment().format('YYYY-MM-DD'),
      check_in_time: currentHour >= 8 ? `${moment().format('YYYY-MM-DD')}T08:05:23` : null,
      check_out_time: currentHour >= 17 ? `${moment().format('YYYY-MM-DD')}T17:35:47` : null,
      status_code: 'on_time',
      status_text: 'Đúng giờ',
      working_hours: currentHour >= 17 ? 9.5 : (currentHour >= 8 ? currentHour - 8 : 0)
    };
    setTodayAttendance(mockTodayAttendance);
    
    // Dữ liệu mẫu cho lịch sử điểm danh
    const mockRecentAttendance = [];
    for (let i = 0; i < 5; i++) {
      const date = moment().subtract(i, 'days');
      const dateStr = date.format('YYYY-MM-DD');
      const isWeekend = date.day() === 0 || date.day() === 6;
      
      if (!isWeekend) {
        // Xác suất 70% đúng giờ, 20% đi muộn, 10% vắng mặt
        const rand = Math.random() * 100;
        let status_code = 'on_time';
        if (rand > 90) status_code = 'absent';
        else if (rand > 80) status_code = 'late_early';
        else if (rand > 70) status_code = 'late';
        else status_code = 'on_time';
        
        const startTime = "08:00:00";
        const endTime = "17:30:00";
        let checkInTime = null;
        let checkOutTime = null;
        
        if (status_code !== 'absent') {
          if (status_code === 'on_time') {
            checkInTime = `${dateStr}T${moment(startTime, 'HH:mm:ss').subtract(Math.floor(Math.random() * 15), 'minutes').format('HH:mm:ss')}`;
          } else {
            checkInTime = `${dateStr}T${moment(startTime, 'HH:mm:ss').add(Math.floor(Math.random() * 30), 'minutes').format('HH:mm:ss')}`;
          }
          
          if (status_code === 'early' || status_code === 'late_early') {
            checkOutTime = `${dateStr}T${moment(endTime, 'HH:mm:ss').subtract(Math.floor(Math.random() * 60), 'minutes').format('HH:mm:ss')}`;
          } else {
            checkOutTime = `${dateStr}T${moment(endTime, 'HH:mm:ss').add(Math.floor(Math.random() * 15), 'minutes').format('HH:mm:ss')}`;
          }
        }
        
        mockRecentAttendance.push({
          id: i + 1,
          employee_id: employeeInfo.employee_id,
          attendance_date: dateStr,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          status_code: status_code,
          status_text: status_code === 'on_time' ? 'Đúng giờ' : 
                     status_code === 'late' ? 'Đi muộn' : 
                     status_code === 'early' ? 'Về sớm' : 
                     status_code === 'late_early' ? 'Đi muộn/Về sớm' : 'Vắng mặt',
          working_hours: checkInTime && checkOutTime ? 8 + (Math.random() * 2 - 1) : 0
        });
      }
    }
    setRecentAttendance(mockRecentAttendance);
    
    // Dữ liệu mẫu cho lịch
    const today = moment().format('YYYY-MM-DD');
    const lastMonth = moment().subtract(30, 'days').format('YYYY-MM-DD');
    const mockCalendarData = {
      start_date: lastMonth,
      end_date: today,
      calendar_data: {},
      summary: {
        total_days: 30,
        working_days: 22,
        total_on_time: 18,
        total_late: 3,
        total_early: 2, 
        total_late_early: 1,
        total_absent: 3
      }
    };
    
    // Tạo dữ liệu giả cho từng ngày
    const startDate = moment(lastMonth);
    const endDate = moment(today);
    for (let m = moment(startDate); m.isSameOrBefore(endDate); m.add(1, 'days')) {
      const dateStr = m.format('YYYY-MM-DD');
      // Xác suất 70% đúng giờ, 15% đi muộn, 5% về sớm, 10% vắng mặt
      const rand = Math.random() * 100;
      let status_code = 'on_time';
      if (rand > 90) status_code = 'absent';
      else if (rand > 85) status_code = 'late_early';
      else if (rand > 70) status_code = 'late';
      else status_code = 'on_time';
      
      // Chỉ tạo dữ liệu cho ngày làm việc (thứ 2-6)
      const dayOfWeek = m.day();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const startTime = "08:00:00";
        const endTime = "17:30:00";
        let checkInTime = null;
        let checkOutTime = null;
        
        if (status_code !== 'absent') {
          if (status_code === 'on_time') {
            checkInTime = `${m.format('YYYY-MM-DD')}T${moment(startTime, 'HH:mm:ss').subtract(Math.floor(Math.random() * 15), 'minutes').format('HH:mm:ss')}`;
          } else {
            checkInTime = `${m.format('YYYY-MM-DD')}T${moment(startTime, 'HH:mm:ss').add(Math.floor(Math.random() * 30), 'minutes').format('HH:mm:ss')}`;
          }
          
          if (status_code === 'early' || status_code === 'late_early') {
            checkOutTime = `${m.format('YYYY-MM-DD')}T${moment(endTime, 'HH:mm:ss').subtract(Math.floor(Math.random() * 60), 'minutes').format('HH:mm:ss')}`;
          } else {
            checkOutTime = `${m.format('YYYY-MM-DD')}T${moment(endTime, 'HH:mm:ss').add(Math.floor(Math.random() * 15), 'minutes').format('HH:mm:ss')}`;
          }
        }
        
        mockCalendarData.calendar_data[dateStr] = [{
          employee_id: employeeInfo.employee_id,
          employee_name: `${employeeInfo.first_name} ${employeeInfo.last_name}`,
          department: employeeInfo.department.name,
          shift: employeeInfo.shift.name,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          status_code: status_code,
          status_text: status_code === 'on_time' ? 'Đúng giờ' : 
                     status_code === 'late' ? 'Đi muộn' : 
                     status_code === 'early' ? 'Về sớm' : 
                     status_code === 'late_early' ? 'Đi muộn/Về sớm' : 'Vắng mặt',
          working_hours: checkInTime && checkOutTime ? 8 + (Math.random() * 2 - 1) : 0
        }];
      }
    }
    setCalendarData(mockCalendarData);
  };
  
  moment.locale('vi');
  
  // Hàm lấy dữ liệu cá nhân và điểm danh
  useEffect(() => {
    console.log("EmployeeDashboardPage useEffect triggered");
    
    // Luôn tạo dữ liệu mẫu trước khi thử kết nối API
    generateMockData();
    
    const fetchEmployeeData = async () => {
      setIsLoading(true);
      try {
        // Lấy thông tin cá nhân - sử dụng getUserInfo từ useAuth
        if (currentUser) {
          const userInfo = currentUser || {};
          console.log("User info chi tiết:", JSON.stringify(userInfo, null, 2));
          
          // Nếu có thông tin user, cập nhật employeeInfo
          if (userInfo.user && userInfo.employee) {
            const updatedEmployeeInfo = {
              employee_id: userInfo.employee?.employee_id || "EMP001",
              first_name: userInfo.user?.first_name || "Nhân viên",
              last_name: userInfo.user?.last_name || "",
              department: userInfo.employee?.department || { name: "Phòng Công nghệ" },
              shift: userInfo.employee?.shift || { 
                name: "Ca Hành Chính", 
                start_time: "08:00:00", 
                end_time: "17:30:00"
              },
              email: userInfo.user?.email || "employee@example.com",
              phone: userInfo.employee?.phone || "0123456789",
              profile_image: userInfo.employee?.profile_image || null
            };
            console.log("Updated employee info:", JSON.stringify(updatedEmployeeInfo, null, 2));
            setEmployeeInfo(updatedEmployeeInfo);
          }
        }
        
        // Tạo dữ liệu ngày hiện tại và một tháng trước để sử dụng trong các API hiện có
        const today = moment().format('YYYY-MM-DD');
        const lastMonth = moment().subtract(30, 'days').format('YYYY-MM-DD');
        
        try {
          // Thử sử dụng API calendar_report nếu nó tồn tại
          const calendarResponse = await attendanceApi.getCalendarReport(lastMonth, today);
          if (calendarResponse && calendarResponse.data) {
            setCalendarData(calendarResponse.data);
          }
        } catch (error) {
          console.log("Không thể gọi API calendar_report, dùng dữ liệu mẫu");
          // Dữ liệu mẫu đã được tạo ở trên
        }
        
        try {
          // Thử sử dụng API getTodayAttendance nếu nó tồn tại
          const todayResponse = await attendanceApi.getToday();
          if (todayResponse && todayResponse.data && todayResponse.data.length > 0) {
            setTodayAttendance(todayResponse.data[0]);
          }
        } catch (error) {
          console.log("Không thể gọi API getTodayAttendance, dùng dữ liệu mẫu");
          // Dữ liệu mẫu đã được tạo ở trên
        }
        
        // Tính toán thống kê điểm danh từ dữ liệu lịch
        if (calendarData && calendarData.summary) {
          const summary = calendarData.summary;
          setAttendanceStats({
            totalPresent: summary.total_on_time || 0,
            totalLate: (summary.total_late || 0) + (summary.total_late_early || 0),
            totalAbsent: summary.total_absent || 0,
            attendanceRate: Math.round((summary.total_on_time / summary.working_days) * 100) || 0
          });
        }
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu nhân viên:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
        // Dữ liệu mẫu đã được tạo ở trên
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeData();
  }, [currentUser]);
  
  // Render màn hình loading nếu đang tải dữ liệu
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Thẻ chào mừng */}
      <WelcomeCard>
        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
          <Avatar
            src={employeeInfo?.profile_image}
            alt={employeeInfo?.first_name}
            sx={{ width: 80, height: 80, marginRight: 3, border: '3px solid white' }}
          />
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Xin chào, {employeeInfo?.first_name 
                ? `${employeeInfo.first_name} ${employeeInfo.last_name || ''}`.trim()
                : currentUser?.user?.username || 'Nhân viên'}!
            </Typography>
            <Typography variant="subtitle1">
              {moment().format('dddd, [ngày] D [tháng] M [năm] YYYY')}
            </Typography>
            {todayAttendance ? (
              <Box sx={{ mt: 1 }}>
                <AttendanceStatusChip status={todayAttendance.status_code || 'on_time'} />
                <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.8)' }}>
                  Check-in: {todayAttendance.check_in_time ? moment(todayAttendance.check_in_time).format('HH:mm:ss') : 'Chưa điểm danh'}
                  {todayAttendance.check_out_time ? ` | Check-out: ${moment(todayAttendance.check_out_time).format('HH:mm:ss')}` : ''}
                </Typography>
              </Box>
            ) : (
              <Button 
                variant="contained" 
                color="secondary" 
                sx={{ mt: 1, borderRadius: 3, textTransform: 'none', px: 3 }}
                href="/check-in"
              >
                Điểm Danh Ngay
              </Button>
            )}
          </Box>
        </CardContent>
      </WelcomeCard>

      {/* Thông tin thống kê */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Tổng số ngày điểm danh */}
        <Grid item xs={12} md={6} lg={3}>
          <StatsCard color={theme.palette.info.main}>
            <IconWrapper>
              <EventAvailableIcon fontSize="small" />
            </IconWrapper>
            <Typography variant="subtitle1" fontWeight={500}>
              Điểm danh đúng giờ
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>
              {attendanceStats.totalPresent}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.8)">
              ngày trong tháng này
            </Typography>
          </StatsCard>
        </Grid>

        {/* Số lần đi muộn */}
        <Grid item xs={12} md={6} lg={3}>
          <StatsCard color={theme.palette.warning.main}>
            <IconWrapper>
              <AccessTimeIcon fontSize="small" />
            </IconWrapper>
            <Typography variant="subtitle1" fontWeight={500}>
              Đi muộn/Về sớm
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>
              {attendanceStats.totalLate}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.8)">
              lần trong tháng này
            </Typography>
          </StatsCard>
        </Grid>

        {/* Vắng mặt */}
        <Grid item xs={12} md={6} lg={3}>
          <StatsCard color={theme.palette.error.main}>
            <IconWrapper>
              <PersonIcon fontSize="small" />
            </IconWrapper>
            <Typography variant="subtitle1" fontWeight={500}>
              Vắng mặt
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>
              {attendanceStats.totalAbsent}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.8)">
              ngày trong tháng này
            </Typography>
          </StatsCard>
        </Grid>

        {/* Tỷ lệ điểm danh */}
        <Grid item xs={12} md={6} lg={3}>
          <StatsCard color={theme.palette.success.main}>
            <IconWrapper>
              <CheckIcon fontSize="small" />
            </IconWrapper>
            <Typography variant="subtitle1" fontWeight={500}>
              Tỷ lệ điểm danh
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>
              {attendanceStats.attendanceRate}%
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.8)">
              đúng giờ tháng này
            </Typography>
          </StatsCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Thông tin cá nhân */}
        <Grid item xs={12} md={4}>
          <AttendanceInfoCard>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, bgcolor: theme.palette.primary.main, color: 'white' }}>
                <Typography variant="h6" fontWeight="bold">
                  Thông tin cá nhân
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Họ và tên" 
                      secondary={`${employeeInfo?.first_name} ${employeeInfo?.last_name}`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <DepartureBoardIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Phòng ban" 
                      secondary={employeeInfo?.department?.name || 'Chưa phân công'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Ca làm việc" 
                      secondary={employeeInfo?.shift?.name || 'Chưa phân ca'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarMonthIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Thời gian làm việc" 
                      secondary={employeeInfo?.shift ? 
                        `${moment(employeeInfo.shift.start_time, 'HH:mm:ss').format('HH:mm')} - ${moment(employeeInfo.shift.end_time, 'HH:mm:ss').format('HH:mm')}` : 
                        'Chưa phân ca'
                      } 
                    />
                  </ListItem>
                </List>
              </Box>
            </CardContent>
          </AttendanceInfoCard>

          {/* Lịch sử điểm danh gần đây */}
          <AttendanceInfoCard sx={{ mt: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, bgcolor: theme.palette.primary.main, color: 'white' }}>
                <Typography variant="h6" fontWeight="bold">
                  Điểm danh gần đây
                </Typography>
              </Box>
              <List>
                {recentAttendance.length > 0 ? (
                  recentAttendance.map((item, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ py: 2 }}>
                        <ListItemIcon>
                          <Avatar 
                            sx={{ 
                              bgcolor: item.status_code === 'on_time' ? 'success.main' : 
                                      (item.status_code === 'absent' ? 'error.main' : 'warning.main') 
                            }}
                          >
                            {item.status_code === 'on_time' ? <CheckIcon /> : 
                             (item.status_code === 'absent' ? <NotificationsIcon /> : <AccessTimeFilledIcon />)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {moment(item.attendance_date).format('DD/MM/YYYY')}
                              </Typography>
                              <AttendanceStatusChip status={item.status_code || 'on_time'} />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                Check-in: {item.check_in_time ? moment(item.check_in_time).format('HH:mm:ss') : 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Check-out: {item.check_out_time ? moment(item.check_out_time).format('HH:mm:ss') : 'N/A'}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < recentAttendance.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="Không có dữ liệu điểm danh gần đây" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </AttendanceInfoCard>
        </Grid>

        {/* Lịch điểm danh */}
        <Grid item xs={12} md={8}>
          <AttendanceInfoCard>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, bgcolor: theme.palette.primary.main, color: 'white' }}>
                <Typography variant="h6" fontWeight="bold">
                  Lịch điểm danh tháng {moment().format('MM/YYYY')}
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                {calendarData ? (
                  <AttendanceCalendar calendarData={calendarData} />
                ) : (
                  <Typography align="center">Không có dữ liệu lịch điểm danh</Typography>
                )}
              </Box>
            </CardContent>
          </AttendanceInfoCard>

          {/* Timeline điểm danh */}
          <AttendanceInfoCard sx={{ mt: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, bgcolor: theme.palette.primary.main, color: 'white' }}>
                <Typography variant="h6" fontWeight="bold">
                  Timeline điểm danh
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                {calendarData ? (
                  <AttendanceTimeline timelineData={recentAttendance} />
                ) : (
                  <Typography align="center">Không có dữ liệu timeline điểm danh</Typography>
                )}
              </Box>
            </CardContent>
          </AttendanceInfoCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeDashboardPage;
