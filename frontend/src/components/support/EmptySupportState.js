import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  useTheme,
  Alert,
  Divider
} from '@mui/material';
import {
  SupportAgent as SupportIcon,
  Add as AddIcon,
  Info as InfoIcon,
  WifiOff as WifiOffIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const EmptySupportState = ({ onCreateTicket, isOffline = false, hasServerError = false }) => {
  const theme = useTheme();

  // Xác định kiểu empty state
  const getTitle = () => {
    if (isOffline) return "Bạn đang ở chế độ ngoại tuyến";
    if (hasServerError) return "Máy chủ tạm thời không khả dụng";
    return "Trung tâm hỗ trợ & khiếu nại";
  };

  const getDescription = () => {
    if (isOffline) {
      return "Hiện tại bạn đang ngoại tuyến. Bạn vẫn có thể tạo yêu cầu hỗ trợ mới, và chúng sẽ được gửi khi bạn kết nối lại.";
    }
    if (hasServerError) {
      return "Máy chủ đang gặp sự cố. Bạn vẫn có thể tạo yêu cầu hỗ trợ mới, và chúng sẽ hiển thị trên giao diện ngay lập tức.";
    }
    return "Chào mừng bạn đến với trung tâm hỗ trợ. Tại đây, bạn có thể gửi yêu cầu hỗ trợ và chat trực tiếp với đội ngũ hỗ trợ.";
  };

  const getIcon = () => {
    if (isOffline) return <WifiOffIcon sx={{ fontSize: 80, color: theme.palette.warning.main, mb: 2 }} />;
    if (hasServerError) return <HistoryIcon sx={{ fontSize: 80, color: theme.palette.error.light, mb: 2 }} />;
    return <SupportIcon sx={{ fontSize: 80, color: theme.palette.primary.main, mb: 2 }} />;
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 3 },
        textAlign: 'center',
        borderRadius: 3,
        height: '100%',
        width: '100%',
        maxWidth: 700,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: { xs: '140px', sm: '180px' },
        maxHeight: '70vh',
        overflowY: 'auto',
        boxShadow: '0 4px 24px 0 rgba(25, 118, 210, 0.08)',
        background: theme.palette.mode === 'dark' ? 'rgba(30,40,60,0.95)' : '#f8fbff',
      }}
    >
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
        {getIcon()}
      </Box>

      <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 700, color: theme.palette.primary.main }}>
        {getTitle()}
      </Typography>

      {(isOffline || hasServerError) && (
        <Alert 
          severity={isOffline ? "warning" : "error"} 
          sx={{ mb: 2, width: '100%', maxWidth: 360, mx: 'auto', fontSize: 15 }}
        >
          {isOffline 
            ? "Không có kết nối mạng. Một số tính năng có thể không hoạt động." 
            : "Máy chủ đang gặp sự cố. Hệ thống đang chạy ở chế độ dự phòng."}
        </Alert>
      )}

      <Typography variant="body1" sx={{ mb: 2, maxWidth: 380, mx: 'auto', color: 'text.secondary' }}>
        {getDescription()}
      </Typography>

      <Box sx={{
        mb: 3,
        p: 2,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(25,118,210,0.10)' : 'rgba(25,118,210,0.06)',
        borderRadius: 2,
        maxWidth: 360,
        mx: 'auto',
        boxShadow: '0 2px 8px 0 rgba(25,118,210,0.04)'
      }}>
        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1, fontWeight: 600, color: theme.palette.info.main }}>
          <InfoIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          Hướng dẫn sử dụng
        </Typography>
        <Box component="ul" sx={{ pl: 3, m: 0, textAlign: 'left', color: 'text.secondary', fontSize: 15 }}>
          <li>Nhấn vào nút <b>"Tạo yêu cầu hỗ trợ mới"</b> để bắt đầu.</li>
          <li>Điền đầy đủ thông tin về vấn đề bạn gặp phải.</li>
          <li>Nhấn <b>"Gửi yêu cầu"</b> để hoàn tất.</li>
          <li>Đội ngũ hỗ trợ sẽ liên hệ với bạn qua tin nhắn.</li>
        </Box>
      </Box>

      <Button
        variant="contained"
        color="primary"
        size="large"
        startIcon={<AddIcon />}
        onClick={onCreateTicket}
        sx={{
          mt: 1,
          fontWeight: 700,
          px: 4,
          py: 1.2,
          borderRadius: 2,
          fontSize: 17,
          boxShadow: '0 2px 8px 0 rgba(25,118,210,0.10)',
          transition: 'all 0.2s',
          '&:hover': {
            background: theme.palette.primary.dark,
            boxShadow: '0 4px 16px 0 rgba(25,118,210,0.16)'
          }
        }}
      >
        Tạo yêu cầu hỗ trợ mới
      </Button>
    </Paper>
  );
};

export default EmptySupportState; 