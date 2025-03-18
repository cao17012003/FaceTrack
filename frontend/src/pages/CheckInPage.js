import React, { useState } from 'react';
import { Box, Typography, Paper, Alert, CircularProgress, Card, CardContent } from '@mui/material';
import WebcamCapture from '../components/WebcamCapture';
import { attendanceApi } from '../services/api';

const CheckInPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleCapture = async (imageFile) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await attendanceApi.checkInOut(imageFile);
      setResult(response.data);
      console.log("Kết quả từ API:", response.data); // Log để debug
    } catch (err) {
      console.error('Error during check-in/out:', err);
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi chấm công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Chấm công bằng khuôn mặt
      </Typography>
      
      <Typography variant="body1" paragraph>
        Đứng trước camera và nhấn nút "Chụp ảnh" để chấm công vào/ra.
      </Typography>
      
      <WebcamCapture 
        onCapture={handleCapture} 
        isLoading={loading} 
        error={error} 
      />
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {result && (
        <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            {result.message}
          </Alert>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin chấm công
              </Typography>
              
              {result.check_in_time && (
                <Typography variant="body1">
                  <strong>Giờ vào:</strong> {new Date(result.check_in_time).toLocaleTimeString('vi-VN')}
                </Typography>
              )}
              
              {result.check_out_time && (
                <Typography variant="body1">
                  <strong>Giờ ra:</strong> {new Date(result.check_out_time).toLocaleTimeString('vi-VN')}
                </Typography>
              )}
              
              {result.worked_time && (
                <Typography variant="body1">
                  <strong>Thời gian làm việc:</strong> {result.worked_time}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Paper>
      )}
    </Box>
  );
};

export default CheckInPage; 