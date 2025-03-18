import React from 'react';
import { Card, CardContent, Typography, useTheme, Box, Skeleton } from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Mock data for the attendance chart
const mockData = [
  { 
    day: 'MON', 
    onTime: 35, 
    late: 8, 
    absent: 5 
  },
  { 
    day: 'TUE', 
    onTime: 38, 
    late: 6, 
    absent: 4 
  },
  { 
    day: 'WED', 
    onTime: 40, 
    late: 5, 
    absent: 3 
  },
  { 
    day: 'THU', 
    onTime: 37, 
    late: 7, 
    absent: 4 
  },
  { 
    day: 'FRI', 
    onTime: 42, 
    late: 4, 
    absent: 2 
  },
  { 
    day: 'SAT', 
    onTime: 25, 
    late: 3, 
    absent: 1 
  },
  { 
    day: 'SUN', 
    onTime: 20, 
    late: 2, 
    absent: 1 
  },
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          backgroundColor: 'background.paper',
          p: 1.5,
          boxShadow: 3,
          borderRadius: 1,
          border: '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        <Typography variant="subtitle2" color="textPrimary">
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography 
            key={`item-${index}`} 
            variant="body2" 
            color="textSecondary"
            sx={{ color: entry.color, display: 'flex', alignItems: 'center', mt: 0.5 }}
          >
            <Box 
              component="span" 
              sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: entry.color, 
                display: 'inline-block', 
                mr: 1,
                borderRadius: '2px'
              }} 
            />
            {entry.name}: {entry.value}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

const AttendanceChart = ({ attendanceData, isLoading = false }) => {
  const theme = useTheme();
  
  // Fallback data if no data is provided
  const fallbackData = [
    { day: 'MON', onTime: 0, late: 0, absent: 0 },
    { day: 'TUE', onTime: 0, late: 0, absent: 0 },
    { day: 'WED', onTime: 0, late: 0, absent: 0 },
    { day: 'THU', onTime: 0, late: 0, absent: 0 },
    { day: 'FRI', onTime: 0, late: 0, absent: 0 },
    { day: 'SAT', onTime: 0, late: 0, absent: 0 },
    { day: 'SUN', onTime: 0, late: 0, absent: 0 },
  ];
  
  // Use provided data or fallback data
  const data = attendanceData || fallbackData;

  return (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" color="textPrimary" gutterBottom>
          Weekly Attendance Statistics
        </Typography>
        
        <Box sx={{ mt: 2, height: 300 }}>
          {isLoading ? (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Skeleton variant="rectangular" width="100%" height="90%" />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: '0.8rem' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  style={{ fontSize: '0.8rem' }}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                />
                <Legend 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }}
                />
                <Bar 
                  dataKey="onTime" 
                  name="On Time" 
                  stackId="a" 
                  fill={theme.palette.primary.main} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="late" 
                  name="Late" 
                  stackId="a" 
                  fill={theme.palette.warning.main} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="absent" 
                  name="Absent" 
                  stackId="a" 
                  fill={theme.palette.error.main} 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AttendanceChart; 