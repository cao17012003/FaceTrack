import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  useTheme,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import moment from 'moment';
import 'moment/locale/vi';

// Component hiển thị ô lịch
const CalendarCell = styled(Paper)(({ theme, status }) => {
  let bgColor = '#ffffff';
  let textColor = theme.palette.text.primary;
  let borderColor = theme.palette.divider;

  switch (status) {
    case 'on_time':
      bgColor = theme.palette.success.light;
      borderColor = theme.palette.success.main;
      textColor = theme.palette.success.contrastText;
      break;
    case 'late':
      bgColor = theme.palette.warning.light;
      borderColor = theme.palette.warning.main;
      textColor = theme.palette.warning.contrastText;
      break;
    case 'early':
      bgColor = theme.palette.info.light;
      borderColor = theme.palette.info.main;
      textColor = theme.palette.info.contrastText;
      break;
    case 'late_early':
      bgColor = theme.palette.error.light;
      borderColor = theme.palette.error.main;
      textColor = theme.palette.error.contrastText;
      break;
    case 'absent':
      bgColor = '#ffebee'; // light red
      borderColor = theme.palette.error.light;
      textColor = theme.palette.error.main;
      break;
    case 'weekend':
      bgColor = '#f5f5f5'; // light gray
      break;
    case 'future':
      bgColor = '#fafafa'; // very light gray
      break;
    default:
      break;
  }

  return {
    backgroundColor: bgColor,
    color: textColor,
    padding: theme.spacing(2),
    textAlign: 'center',
    height: '100%',
    minHeight: 100,
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    border: `1px solid ${borderColor}`,
    transition: 'transform 0.2s',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: theme.shadows[3]
    }
  };
});

// Component hiển thị lịch điểm danh
const AttendanceCalendar = ({ calendarData }) => {
  const theme = useTheme();
  moment.locale('vi');

  // Tạo danh sách các ngày trong tháng hiện tại
  const generateCalendar = () => {
    const today = moment();
    const startOfMonth = moment().startOf('month');
    const endOfMonth = moment().endOf('month');
    
    // Lấy ngày bắt đầu - từ thứ 2 đầu tuần chứa ngày đầu tháng
    const startDate = moment(startOfMonth).startOf('week');
    // Lấy ngày kết thúc - tính từ chủ nhật cuối tuần chứa ngày cuối tháng
    const endDate = moment(endOfMonth).endOf('week');
    
    // Mảng lưu các tuần
    const calendar = [];
    let week = [];
    
    // Tạo tiêu đề cho các ngày trong tuần
    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    
    // Tạo lịch
    let day = startDate.clone();
    while (day.isSameOrBefore(endDate)) {
      // Nếu là ngày đầu tuần và tuần trước có dữ liệu, lưu tuần đó vào lịch
      if (day.day() === 1 && week.length > 0) {
        calendar.push(week);
        week = [];
      }
      
      // Xác định trạng thái của ngày
      const formattedDate = day.format('YYYY-MM-DD');
      let status = 'future';
      let attendanceInfo = null;
      
      // Nếu là cuối tuần
      if (day.day() === 0 || day.day() === 6) {
        status = 'weekend';
      } 
      // Nếu là ngày trong quá khứ
      else if (day.isBefore(today, 'day')) {
        status = 'absent'; // Mặc định là vắng mặt nếu không có dữ liệu
        
        // Nếu có dữ liệu điểm danh cho ngày này
        if (calendarData?.calendar_data && calendarData.calendar_data[formattedDate] && calendarData.calendar_data[formattedDate].length > 0) {
          const dayRecord = calendarData.calendar_data[formattedDate][0];
          status = dayRecord.status_code || 'absent';
          attendanceInfo = dayRecord;
        }
      }
      
      // Thêm ngày vào tuần
      week.push({
        date: day.clone(),
        status,
        attendanceInfo
      });
      
      // Chuyển sang ngày tiếp theo
      day.add(1, 'day');
    }
    
    // Thêm tuần cuối vào lịch
    if (week.length > 0) {
      calendar.push(week);
    }
    
    return { weekDays, calendar };
  };

  const { weekDays, calendar } = generateCalendar();

  const getStatusLabel = (status) => {
    switch (status) {
      case 'on_time': return 'Đúng giờ';
      case 'late': return 'Đi muộn';
      case 'early': return 'Về sớm';
      case 'late_early': return 'Đi muộn & về sớm';
      case 'absent': return 'Vắng mặt';
      case 'weekend': return 'Cuối tuần';
      case 'future': return 'Ngày tới';
      default: return 'Không xác định';
    }
  };

  return (
    <Box>
      {/* Hiển thị chú thích */}
      <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', mb: 2 }}>
        {['on_time', 'late', 'early', 'late_early', 'absent'].map((status) => (
          <Box 
            key={status}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mr: 2, 
              mb: 1 
            }}
          >
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: '50%',
                backgroundColor: status === 'on_time' ? theme.palette.success.light : 
                                 status === 'late' ? theme.palette.warning.light :
                                 status === 'early' ? theme.palette.info.light :
                                 status === 'late_early' ? theme.palette.error.light :
                                 '#ffebee'
              }} 
            />
            <Typography variant="caption" sx={{ ml: 0.5 }}>
              {getStatusLabel(status)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Hiển thị tiêu đề ngày trong tuần */}
      <Grid container spacing={1}>
        {weekDays.map((day, index) => (
          <Grid item xs key={index}>
            <Typography
              variant="subtitle2"
              align="center"
              sx={{
                fontWeight: 'bold',
                py: 1,
                color: index >= 5 ? theme.palette.error.main : theme.palette.primary.main
              }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Hiển thị lịch */}
      {calendar.map((week, weekIndex) => (
        <Grid container spacing={1} key={weekIndex} sx={{ mt: 0.5 }}>
          {week.map((day, dayIndex) => {
            const isCurrentMonth = day.date.month() === moment().month();
            const isToday = day.date.isSame(moment(), 'day');
            
            return (
              <Grid item xs key={dayIndex}>
                <Tooltip 
                  title={
                    day.attendanceInfo ? (
                      <Box>
                        <Typography variant="body2">
                          {getStatusLabel(day.status)}
                        </Typography>
                        {day.attendanceInfo.check_in_time && (
                          <Typography variant="body2">
                            Check-in: {moment(day.attendanceInfo.check_in_time).format('HH:mm')}
                          </Typography>
                        )}
                        {day.attendanceInfo.check_out_time && (
                          <Typography variant="body2">
                            Check-out: {moment(day.attendanceInfo.check_out_time).format('HH:mm')}
                          </Typography>
                        )}
                      </Box>
                    ) : getStatusLabel(day.status)
                  }
                >
                  <CalendarCell status={day.status} elevation={isToday ? 3 : 0}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: isToday ? 'bold' : 'normal',
                        color: !isCurrentMonth ? 'text.disabled' : 
                                isToday ? theme.palette.primary.main : 'inherit',
                        mb: 1
                      }}
                    >
                      {day.date.date()}
                    </Typography>
                    
                    {day.attendanceInfo && (
                      <Box sx={{ mt: 'auto', fontSize: '0.75rem' }}>
                        {day.attendanceInfo.check_in_time && (
                          <Typography variant="caption" display="block">
                            In: {moment(day.attendanceInfo.check_in_time).format('HH:mm')}
                          </Typography>
                        )}
                        {day.attendanceInfo.check_out_time && (
                          <Typography variant="caption" display="block">
                            Out: {moment(day.attendanceInfo.check_out_time).format('HH:mm')}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CalendarCell>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      ))}
    </Box>
  );
};

export default AttendanceCalendar;
