import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  useTheme
} from '@mui/material';
import {
  SupportAgent as SupportIcon,
  Add as AddIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const EmptySupportState = ({ onCreateTicket }) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: 4, 
        textAlign: 'center',
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}
    >
      <SupportIcon sx={{ fontSize: 80, color: theme.palette.primary.main, mb: 2 }} />
      
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
        Trung tâm hỗ trợ & khiếu nại
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 1, maxWidth: '600px' }}>
        Chào mừng bạn đến với trung tâm hỗ trợ. Tại đây, bạn có thể gửi yêu cầu hỗ trợ và chat trực tiếp với đội ngũ hỗ trợ.
      </Typography>
      
      <Box sx={{ mt: 3, mb: 3, p: 2, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 1, maxWidth: '600px' }}>
        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <InfoIcon sx={{ mr: 1, fontSize: '1.2rem', color: theme.palette.info.main }} />
          Hướng dẫn sử dụng:
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'left', pl: 3 }}>
          1. Nhấn vào nút "Tạo yêu cầu hỗ trợ mới" để bắt đầu.
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'left', pl: 3 }}>
          2. Điền đầy đủ thông tin về vấn đề bạn gặp phải.
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'left', pl: 3 }}>
          3. Nhấn "Gửi yêu cầu" để hoàn tất.
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'left', pl: 3 }}>
          4. Đội ngũ hỗ trợ sẽ liên hệ với bạn thông qua tin nhắn.
        </Typography>
      </Box>
      
      <Button
        variant="contained"
        color="primary"
        size="large"
        startIcon={<AddIcon />}
        onClick={onCreateTicket}
        sx={{ mt: 2 }}
      >
        Tạo yêu cầu hỗ trợ mới
      </Button>
    </Paper>
  );
};

export default EmptySupportState; 