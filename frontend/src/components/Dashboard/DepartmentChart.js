import React from 'react';
import { Card, CardContent, Typography, useTheme, Box, Skeleton } from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';

// Mock data for department distribution
const mockData = [
  { name: 'Engineering', value: 30, color: '#4c9fff' },
  { name: 'Marketing', value: 20, color: '#51d0b5' },
  { name: 'Sales', value: 25, color: '#7b5dfa' },
  { name: 'HR', value: 15, color: '#ff6b9d' },
  { name: 'Finance', value: 10, color: '#ffc555' },
];

// Custom tooltip component
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
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
        <Typography variant="subtitle2" sx={{ color: data.payload.color }}>
          {data.name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {data.value} employees ({data.payload.percentage}%)
        </Typography>
      </Box>
    );
  }
  return null;
};

const DepartmentChart = ({ departmentData, isLoading = false }) => {
  const theme = useTheme();
  
  // Fallback to mock data or empty array if no data is provided
  const data = Array.isArray(departmentData) ? departmentData : mockData;
  
  // Calculate total value for percentage
  const total = Array.isArray(data) ? data.reduce((sum, item) => sum + item.value, 0) : 0;
  
  // Add percentage to data
  const enrichedData = Array.isArray(data) ? data.map(item => ({
    ...item,
    percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
  })) : [];

  return (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" color="textPrimary" gutterBottom>
          Department Distribution
        </Typography>
        
        {isLoading ? (
          <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton variant="circular" width={160} height={160} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
            <Box sx={{ width: '100%', height: 240 }}>
              {enrichedData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={enrichedData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {enrichedData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color || theme.palette.primary.main} 
                          stroke={theme.palette.background.paper}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    No department data available
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box sx={{ width: '100%', mt: 2 }}>
              {enrichedData.map((entry, index) => (
                <Box 
                  key={`legend-${index}`} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        backgroundColor: entry.color,
                        mr: 1 
                      }} 
                    />
                    <Typography variant="body2" color="textSecondary">
                      {entry.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    {entry.percentage}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DepartmentChart; 