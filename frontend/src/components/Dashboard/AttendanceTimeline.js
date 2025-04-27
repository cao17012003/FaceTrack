import React from 'react';
import { 
  Box, 
  Typography, 
  useTheme,
  Stack,
  Avatar,
  Paper,
  Divider
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  HourglassTop as HourglassTopIcon,
  MoreTime as MoreTimeIcon
} from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/vi';

const AttendanceTimeline = ({ timelineData }) => {
  const theme = useTheme();
  moment.locale('vi');

  // Nhận diện icon và màu sắc dựa vào trạng thái
  const getStatusInfo = (status) => {
    switch (status) {
      case 'on_time':
        return {
          icon: <CheckCircleIcon />,
          color: theme.palette.success.main,
          label: 'Đúng giờ'
        };
      case 'late':
        return {
          icon: <HourglassTopIcon />,
          color: theme.palette.warning.main,
          label: 'Đi muộn'
        };
      case 'early':
        return {
          icon: <MoreTimeIcon />,
          color: theme.palette.info.main,
          label: 'Về sớm'
        };
      case 'late_early':
        return {
          icon: <WarningIcon />,
          color: theme.palette.error.light,
          label: 'Đi muộn & về sớm'
        };
      case 'absent':
        return {
          icon: <ErrorIcon />,
          color: theme.palette.error.main,
          label: 'Vắng mặt'
        };
      default:
        return {
          icon: <CheckCircleIcon />,
          color: theme.palette.grey[500],
          label: 'Không xác định'
        };
    }
  };

  // Nếu không có dữ liệu
  if (!timelineData || timelineData.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Không có dữ liệu điểm danh gần đây
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
      {timelineData.map((record, index) => {
        const statusInfo = getStatusInfo(record.status_code || 'on_time');
        const date = moment(record.attendance_date).format('DD/MM/YYYY');
        const isEven = index % 2 === 0;
        
        return (
          <Stack 
            key={index} 
            direction="row" 
            alignItems="flex-start" 
            spacing={2} 
            sx={{ 
              mb: 3,
              px: 1,
              py: 2,
              backgroundColor: isEven ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
              borderRadius: 1
            }}
          >
            {/* Ngày */}
            <Box 
              sx={{ 
                minWidth: '100px', 
                textAlign: 'center',
                mt: 1 
              }}
            >
              <Typography variant="body2" fontWeight="medium" color="text.secondary">
                {date}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {moment(record.attendance_date).format('dddd')}
              </Typography>
            </Box>
            
            {/* Icon */}
            <Avatar 
              sx={{ 
                bgcolor: statusInfo.color, 
                width: 40, 
                height: 40,
                mt: 1
              }}
            >
              {statusInfo.icon}
            </Avatar>
            
            {/* Nội dung */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {statusInfo.label}
              </Typography>
              
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 1.5, 
                  mt: 1, 
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              >
                {record.check_in_time && (
                  <Typography variant="body2">
                    Check-in: {moment(record.check_in_time).format('HH:mm:ss')}
                  </Typography>
                )}
                {record.check_out_time && (
                  <Typography variant="body2">
                    Check-out: {moment(record.check_out_time).format('HH:mm:ss')}
                  </Typography>
                )}
                {record.working_hours > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Thời gian làm việc: {record.working_hours.toFixed(2)} giờ
                  </Typography>
                )}
              </Paper>
            </Box>
          </Stack>
        );
      })}
    </Box>
  );
};

export default AttendanceTimeline;
