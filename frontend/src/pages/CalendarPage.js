import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import 'moment/locale/en-gb';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { attendanceApi, employeeApi, departmentApi } from '../services/api';
import { useTranslation } from '../translations';
import { useAuth } from '../contexts/AuthContext';

const CalendarPage = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  
  // Configure moment locale to English
  moment.locale('en-gb');
  const localizer = momentLocalizer(moment);

  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('month');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Initial data load
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Get employee and department lists
        const [employeesRes, departmentsRes] = await Promise.all([
          employeeApi.getAll(),
          departmentApi.getAll()
        ]);
        
        setEmployees(employeesRes.data);
        setDepartments(departmentsRes.data);
        
        // Load default attendance data (current month)
        await fetchAttendances();
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Error loading data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  const fetchAttendances = async () => {
    setLoading(true);
    try {
      // Calculate date range 
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const params = {
        start_date: moment(startDate).format('YYYY-MM-DD'),
        end_date: moment(endDate).format('YYYY-MM-DD')
      };
      
      if (selectedEmployee) {
        params.employee_id = selectedEmployee;
      }
      
      if (selectedDepartment) {
        params.department = selectedDepartment;
      }
      
      const response = await attendanceApi.getReport(params);
      
      // Convert API data to calendar events
      const calendarEvents = [];
      response.data.data.forEach(attendance => {
        const attendanceDate = new Date(attendance.attendance_date);
        
        // If has check-in time
        if (attendance.check_in_time) {
          const checkInTime = new Date(attendance.check_in_time);
          calendarEvents.push({
            id: `check_in_${attendance.id}`,
            title: `${attendance.employee_name} - ${t('calendar.checkInEvent')}`,
            start: checkInTime,
            end: new Date(checkInTime.getTime() + 30 * 60000), // add 30 minutes
            employee: attendance.employee_name,
            employeeId: attendance.employee_id,
            type: 'check_in',
            isLate: attendance.is_late,
            attendance: attendance
          });
        }
        
        // If has check-out time
        if (attendance.check_out_time) {
          const checkOutTime = new Date(attendance.check_out_time);
          calendarEvents.push({
            id: `check_out_${attendance.id}`,
            title: `${attendance.employee_name} - ${t('calendar.checkOutEvent')}`,
            start: checkOutTime,
            end: new Date(checkOutTime.getTime() + 30 * 60000), // add 30 minutes
            employee: attendance.employee_name,
            employeeId: attendance.employee_id,
            type: 'check_out',
            leftEarly: attendance.left_early,
            attendance: attendance
          });
        }
      });
      
      setEvents(calendarEvents);
    } catch (err) {
      console.error('Error fetching attendances:', err);
      setError(t('calendar.errorFetchingData'));
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (e) => {
    setSelectedView(e.target.value);
  };

  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value);
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  // Update when filters change
  useEffect(() => {
    fetchAttendances();
  }, [selectedEmployee, selectedDepartment]);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Customize event colors
  const eventStyleGetter = (event) => {
    let style = {
      backgroundColor: '#3174ad'
    };

    if (event.type === 'check_in') {
      style.backgroundColor = event.isLate ? '#f57c00' : '#4caf50';
    } else if (event.type === 'check_out') {
      style.backgroundColor = event.leftEarly ? '#f57c00' : '#2196f3';
    }

    return {
      style
    };
  };

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('calendar.title')}
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>{t('calendar.view')}</InputLabel>
              <Select
                value={selectedView}
                onChange={handleViewChange}
                label={t('calendar.view')}
              >
                <MenuItem value="month">{t('calendar.month')}</MenuItem>
                <MenuItem value="week">{t('calendar.week')}</MenuItem>
                <MenuItem value="day">{t('calendar.day')}</MenuItem>
                <MenuItem value="agenda">{t('calendar.list')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>{t('calendar.employee')}</InputLabel>
              <Select
                value={selectedEmployee}
                onChange={handleEmployeeChange}
                label={t('calendar.employee')}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {employees.map(emp => (
                  <MenuItem key={emp.id} value={emp.employee_id}>
                    {emp.first_name} {emp.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>{t('calendar.department')}</InputLabel>
              <Select
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                label={t('calendar.department')}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ height: 700, p: 2 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month', 'week', 'day', 'agenda']}
            view={selectedView}
            onView={(view) => setSelectedView(view)}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            messages={{
              month: t('calendar.month'),
              week: t('calendar.week'),
              day: t('calendar.day'),
              agenda: t('calendar.list'),
              previous: t('calendar.previous'),
              next: t('calendar.next'),
              today: t('calendar.today'),
              showMore: total => `+ ${total} ${t('calendar.showMore')}`
            }}
          />
        </Paper>
      )}

      {/* Event details dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('calendar.details')}
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedEvent.employee}
                </Typography>
                <Typography variant="body1">
                  <strong>{t('calendar.employeeId')}:</strong> {selectedEvent.employeeId}
                </Typography>
                <Typography variant="body1">
                  <strong>{t('calendar.date')}:</strong> {formatDate(selectedEvent.start)}
                </Typography>
                <Typography variant="body1">
                  <strong>{t('calendar.time')}:</strong> {formatTime(selectedEvent.start)}
                </Typography>
                <Typography variant="body1">
                  <strong>{t('calendar.type')}:</strong> {selectedEvent.type === 'check_in' 
                    ? t('calendar.checkinType') 
                    : t('calendar.checkoutType')}
                </Typography>

                {selectedEvent.type === 'check_in' && selectedEvent.isLate && (
                  <Chip label={t('calendar.statusLate')} color="warning" sx={{ mt: 1, mr: 1 }} />
                )}
                {selectedEvent.type === 'check_out' && selectedEvent.leftEarly && (
                  <Chip label={t('calendar.statusEarly')} color="warning" sx={{ mt: 1 }} />
                )}
                {((selectedEvent.type === 'check_in' && !selectedEvent.isLate) || 
                  (selectedEvent.type === 'check_out' && !selectedEvent.leftEarly)) && (
                  <Chip label={t('calendar.statusOnTime')} color="success" sx={{ mt: 1 }} />
                )}
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CalendarPage; 