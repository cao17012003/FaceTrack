import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Alert, CircularProgress, Card, CardContent, Snackbar, Container, Fade, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AccessTime as AccessTimeIcon, Check as CheckIcon, EventAvailable as EventAvailableIcon } from '@mui/icons-material';
import WebcamCapture from '../components/WebcamCapture';
import { attendanceApi } from '../services/api';

const CheckInPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handleCapture = async (imageFile) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await attendanceApi.checkInOut(imageFile);
      setResult(response.data);
      setShowSuccess(true);
      console.log("Kết quả từ API:", response.data); // Log để debug
      
      // Tự động chuyển về trang dashboard sau 3 giây
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Error during check-in/out:', err);
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi chấm công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        width: '100%' 
      }}>
        {/* Header section with current time */}
        <Box sx={{ 
          width: '100%',
          maxWidth: '800px', 
          mb: 4, 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Typography 
            variant="h4" 
            fontWeight="600" 
            sx={{ 
              mb: 1,
              color: '#263238',
              textAlign: 'center'
            }}
          >
            Chấm công bằng khuôn mặt
          </Typography>
          
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1
          }}>
            <AccessTimeIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" color="primary.main" fontWeight="500">
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Typography>
          </Box>
          
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
            {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
          
          <Divider sx={{ width: '80%', mb: 4 }} />
        </Box>
        
        {/* Main content */}
        <WebcamCapture 
          onCapture={handleCapture} 
          isLoading={loading} 
          error={error} 
        />
        
        {/* Success Snackbar notification */}
        <Snackbar 
          open={showSuccess} 
          autoHideDuration={3000}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            severity="success" 
            variant="filled"
            icon={<CheckIcon />}
            sx={{ 
              width: '100%',
              boxShadow: 3
            }}
          >
            Check-in thành công! Đang chuyển về trang chủ...
          </Alert>
        </Snackbar>

        {/* Result information card */}
        {result && (
          <Fade in={true} timeout={800}>
            <Card 
              elevation={4} 
              sx={{ 
                p: 3, 
                mt: 4, 
                width: '100%', 
                maxWidth: '800px',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid #e0e0e0'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                p: 2,
                bgcolor: 'success.light',
                borderRadius: 1,
                color: 'success.dark'
              }}>
                <CheckIcon sx={{ mr: 1 }} />
                <Typography variant="body1" fontWeight="500">
                  {result.message}
                </Typography>
              </Box>
              
              <Typography variant="h6" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center',
                borderBottom: '1px solid #e0e0e0',
                pb: 1,
                mb: 2
              }}>
                <EventAvailableIcon sx={{ mr: 1 }} />
                Thông tin chấm công
              </Typography>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 2
              }}>
                {result.check_in_time && (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#f5f5f5',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Giờ vào
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {new Date(result.check_in_time).toLocaleTimeString('vi-VN')}
                    </Typography>
                  </Paper>
                )}
                
                {result.check_out_time && (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#f5f5f5',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Giờ ra
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {new Date(result.check_out_time).toLocaleTimeString('vi-VN')}
                    </Typography>
                  </Paper>
                )}
                
                {result.worked_time && (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#f5f5f5',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                      gridColumn: { xs: '1', sm: '1 / span 2' }
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Thời gian làm việc
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {result.worked_time}
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Card>
          </Fade>
        )}
      </Box>
    </Container>
  );
};

export default CheckInPage; 