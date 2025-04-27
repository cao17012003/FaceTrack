import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Paper, TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { dashboardApi, employeeApi, attendanceApi } from '../services/api';

// Import components
import DashboardStats from '../components/Dashboard/DashboardStats';
import AttendanceChart from '../components/Dashboard/AttendanceChart';
import DepartmentChart from '../components/Dashboard/DepartmentChart';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    todayCheckins: 0,
    totalEmployees: 0,
    lateEmployees: 0
  });
  const [attendanceData, setAttendanceData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock colors for departments
  const departmentColors = {
    'Engineering': '#4c9fff',
    'Marketing': '#51d0b5',
    'Sales': '#7b5dfa',
    'HR': '#ff6b9d',
    'Finance': '#ffc555',
    'Operations': '#a991f7',
    'IT': '#64b6ff',
    'Admin': '#ff9055'
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Sử dụng API thật để lấy dữ liệu thống kê
        const [dashboardStats, attendanceSummary, departmentSummary] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getAttendanceSummary(),
          dashboardApi.getDepartmentSummary()
        ]);

        // Cập nhật thống kê
        setStats({
          todayCheckins: dashboardStats.data.today_present,
          totalEmployees: dashboardStats.data.total_employees,
          lateEmployees: dashboardStats.data.today_late,
          attendanceRate: dashboardStats.data.attendance_rate
        });

        // Cập nhật dữ liệu biểu đồ điểm danh
        if (attendanceSummary.data && attendanceSummary.data.days) {
          // Transform the data to match the expected format for the chart
          const transformedAttendanceData = attendanceSummary.data.days.map(day => ({
            day: day.day_name,
            onTime: day.count,
            late: 0,
            absent: 0
          }));
          setAttendanceData(transformedAttendanceData);
        } else {
          setAttendanceData([]);
        }

        // Cập nhật dữ liệu biểu đồ phòng ban
        if (departmentSummary.data && departmentSummary.data.departments) {
          // Transform the data to match the expected format for the chart
          const transformedDepartmentData = departmentSummary.data.departments.map(dept => ({
            name: dept.name,
            value: dept.total_employees,
            color: departmentColors[dept.name] || '#' + Math.floor(Math.random()*16777215).toString(16)
          }));
          setDepartmentData(transformedDepartmentData);
        } else {
          setDepartmentData([]);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
        setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
        
        // Sử dụng dữ liệu giả nếu API gặp lỗi
        setAttendanceData([
          { day: 'MON', onTime: 35, late: 8, absent: 5 },
          { day: 'TUE', onTime: 38, late: 6, absent: 4 },
          { day: 'WED', onTime: 40, late: 5, absent: 3 },
          { day: 'THU', onTime: 37, late: 7, absent: 4 },
          { day: 'FRI', onTime: 42, late: 4, absent: 2 },
          { day: 'SAT', onTime: 25, late: 3, absent: 1 },
          { day: 'SUN', onTime: 20, late: 2, absent: 1 },
        ]);
        
        setDepartmentData([
          { name: 'Engineering', value: 30, color: '#4c9fff' },
          { name: 'Marketing', value: 20, color: '#51d0b5' },
          { name: 'Sales', value: 25, color: '#7b5dfa' },
          { name: 'HR', value: 15, color: '#ff6b9d' },
          { name: 'Finance', value: 10, color: '#ffc555' },
        ]);
        
        setStats({
          todayCheckins: 45,
          totalEmployees: 125,
          lateEmployees: 12,
          attendanceRate: 36
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Box>
      {/* Page header */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}
      >
        <Typography variant="h4" fontWeight="bold" color="textPrimary">
          Dashboard
        </Typography>
        
        {/* Search field */}
        <TextField
          placeholder="Search..."
          variant="outlined"
          size="small"
          sx={{ 
            width: 250,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'background.paper',
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Stats cards */}
      <Box sx={{ mb: 4 }}>
        <DashboardStats 
          todayCheckins={stats.todayCheckins}
          totalEmployees={stats.totalEmployees} 
          lateEmployees={stats.lateEmployees}
          attendanceRate={stats.attendanceRate}
          isLoading={isLoading}
        />
      </Box>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Attendance Chart */}
        <Grid item xs={12} lg={8}>
          <AttendanceChart attendanceData={attendanceData} isLoading={isLoading} />
        </Grid>
        
        {/* Department Chart */}
        <Grid item xs={12} lg={4}>
          <DepartmentChart departmentData={departmentData} isLoading={isLoading} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage; 