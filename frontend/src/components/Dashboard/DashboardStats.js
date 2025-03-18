import React from 'react';
import { Box, Card, Typography, Grid, useTheme, Skeleton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

// Styled components
const StatsCard = styled(Card)(({ theme, color }) => ({
  padding: theme.spacing(3),
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

const StatsValue = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const PercentageWrapper = styled(Box)(({ theme, isPositive }) => ({
  display: 'flex',
  alignItems: 'center',
  color: isPositive ? '#ffffff' : '#ffffff',
  fontSize: '0.875rem',
  fontWeight: 500,
}));

const DashboardStats = ({ todayCheckins, totalEmployees, lateEmployees, attendanceRate, isLoading }) => {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {/* Today's Checkins Card */}
      <Grid item xs={12} md={6} lg={3}>
        <StatsCard color={theme.palette.info.main}>
          <IconWrapper>
            <ScheduleIcon fontSize="small" />
          </IconWrapper>
          <Typography variant="subtitle1" fontWeight={500}>
            Điểm danh hôm nay
          </Typography>
          {isLoading ? (
            <Skeleton variant="text" width="60%" height={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          ) : (
            <StatsValue variant="h3">
              {todayCheckins || 0}
            </StatsValue>
          )}
          <Typography variant="body2" color="rgba(255,255,255,0.8)">
            Nhân viên đã điểm danh
          </Typography>
        </StatsCard>
      </Grid>

      {/* Total Employees Card */}
      <Grid item xs={12} md={6} lg={3}>
        <StatsCard color={theme.palette.primary.main}>
          <IconWrapper>
            <PersonIcon fontSize="small" />
          </IconWrapper>
          <Typography variant="subtitle1" fontWeight={500}>
            Tổng nhân viên
          </Typography>
          {isLoading ? (
            <Skeleton variant="text" width="60%" height={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          ) : (
            <StatsValue variant="h3">
              {totalEmployees || 0}
            </StatsValue>
          )}
          <Typography variant="body2" color="rgba(255,255,255,0.8)">
            Nhân viên đang hoạt động
          </Typography>
        </StatsCard>
      </Grid>

      {/* Late Employees Card */}
      <Grid item xs={12} md={6} lg={3}>
        <StatsCard color={theme.palette.error.main}>
          <IconWrapper>
            <WarningIcon fontSize="small" />
          </IconWrapper>
          <Typography variant="subtitle1" fontWeight={500}>
            Đi muộn hôm nay
          </Typography>
          {isLoading ? (
            <Skeleton variant="text" width="60%" height={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          ) : (
            <StatsValue variant="h3">
              {lateEmployees || 0}
            </StatsValue>
          )}
          <Typography variant="body2" color="rgba(255,255,255,0.8)">
            Nhân viên đi muộn
          </Typography>
        </StatsCard>
      </Grid>
      
      {/* Attendance Rate Card */}
      <Grid item xs={12} md={6} lg={3}>
        <StatsCard color={theme.palette.success.main}>
          <IconWrapper>
            <TimelineIcon fontSize="small" />
          </IconWrapper>
          <Typography variant="subtitle1" fontWeight={500}>
            Tỷ lệ điểm danh
          </Typography>
          {isLoading ? (
            <Skeleton variant="text" width="60%" height={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          ) : (
            <StatsValue variant="h3">
              {attendanceRate || 0}%
            </StatsValue>
          )}
          <Typography variant="body2" color="rgba(255,255,255,0.8)">
            Tỷ lệ hiện diện hôm nay
          </Typography>
        </StatsCard>
      </Grid>
    </Grid>
  );
};

export default DashboardStats; 