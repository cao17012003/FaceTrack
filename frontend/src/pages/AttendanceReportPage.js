import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import enUS from 'date-fns/locale/en-US';
import { attendanceApi, departmentApi, employeeApi } from '../services/api';
import { format } from 'date-fns';
import { useTranslation } from '../translations';
import { useAuth } from '../contexts/AuthContext';

const AttendanceReportPage = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1))); // First day of current month
  const [endDate, setEndDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  
  const { t } = useTranslation();
  const { isAdmin, currentUser, getEmployeeId } = useAuth();
  
  // Always use English locale
  const dateLocale = enUS;
  
  useEffect(() => {
    fetchInitialData();
  }, []);
  
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // If admin, get all employee and department data
      if (isAdmin()) {
        const [employeesRes, departmentsRes] = await Promise.all([
          employeeApi.getAll(),
          departmentApi.getAll()
        ]);
        
        setEmployees(employeesRes.data);
        setDepartments(departmentsRes.data);
      } else {
        // If employee, just set employee ID and don't allow changing
        setSelectedEmployee(getEmployeeId());
      }
      
      // Load initial attendance data
      await fetchAttendance();
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Error loading data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const params = {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd')
      };
      
      // If admin and employee selected
      if (isAdmin() && selectedEmployee) {
        params.employee_id = selectedEmployee;
      }
      
      // If admin and department selected
      if (isAdmin() && selectedDepartment) {
        params.department = selectedDepartment;
      }
      
      // If employee, always use that employee's ID
      if (!isAdmin()) {
        params.employee_id = getEmployeeId();
        setMessage(t('report.onlyViewOwn'));
      }
      
      const response = await attendanceApi.getReport(params);
      setAttendanceData(response.data.data);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Error loading attendance data. Please try again later.');
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmployeeChange = (event) => {
    setSelectedEmployee(event.target.value);
  };
  
  const handleDepartmentChange = (event) => {
    setSelectedDepartment(event.target.value);
  };
  
  const handleSearchClick = () => {
    fetchAttendance();
  };
  
  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US');
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };
  
  const getStatusChip = (status) => {
    switch(status) {
      case 'on_time':
        return <Chip label={t('checkin.onTime')} color="success" size="small" />;
      case 'late':
        return <Chip label={t('checkin.late')} color="warning" size="small" />;
      case 'absent':
        return <Chip label={t('checkin.absent')} color="error" size="small" />;
      default:
        return <Chip label={status || 'unknown'} size="small" />;
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('report.title', 'Báo cáo điểm danh')}
      </Typography>
      
      {!isAdmin() && currentUser?.user?.first_name && (
        <Typography variant="subtitle1" color="primary" gutterBottom>
          {t('report.personalReport', 'Báo cáo cá nhân cho')}: {currentUser?.user?.first_name} {currentUser?.user?.last_name}
        </Typography>
      )}
      
      {message && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={isAdmin() ? 3 : 6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
              <DatePicker
                label={t('calendar.startDate', 'Ngày bắt đầu')}
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={isAdmin() ? 3 : 6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
              <DatePicker
                label={t('calendar.endDate', 'Ngày kết thúc')}
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          
          {isAdmin() && (
            <>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>{t('calendar.employee', 'Nhân viên')}</InputLabel>
                  <Select
                    value={selectedEmployee}
                    onChange={handleEmployeeChange}
                    label={t('calendar.employee', 'Nhân viên')}
                  >
                    <MenuItem value="">{t('common.all', 'Tất cả')}</MenuItem>
                    {employees.map(emp => (
                      <MenuItem key={emp.id} value={emp.employee_id}>
                        {emp.first_name} {emp.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>{t('calendar.department', 'Phòng ban')}</InputLabel>
                  <Select
                    value={selectedDepartment}
                    onChange={handleDepartmentChange}
                    label={t('calendar.department', 'Phòng ban')}
                  >
                    <MenuItem value="">{t('common.all', 'Tất cả')}</MenuItem>
                    {departments.map(dept => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          
          <Grid item xs={12} sm={12}>
            <Button 
              variant="contained" 
              onClick={handleSearchClick}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : t('common.search', 'Tìm kiếm')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('calendar.date', 'Ngày')}</TableCell>
              <TableCell>{t('checkin.employee', 'Nhân viên')}</TableCell>
              <TableCell>{t('calendar.checkinTime', 'Giờ vào')}</TableCell>
              <TableCell>{t('calendar.checkoutTime', 'Giờ ra')}</TableCell>
              <TableCell>{t('checkin.status', 'Trạng thái')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : attendanceData.length > 0 ? (
              attendanceData.map((attendance, index) => (
                <TableRow key={attendance.id || index}>
                  <TableCell>{formatDate(attendance.date)}</TableCell>
                  <TableCell>
                    {attendance.employee_name || (attendance.employee && 
                      `${attendance.employee.first_name} ${attendance.employee.last_name}`)}
                  </TableCell>
                  <TableCell>{formatTime(attendance.check_in_time)}</TableCell>
                  <TableCell>{formatTime(attendance.check_out_time)}</TableCell>
                  <TableCell>
                    {getStatusChip(attendance.status)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {t('common.noData', 'Không có dữ liệu')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AttendanceReportPage; 