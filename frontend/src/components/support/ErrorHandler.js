import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ErrorOutline as ErrorIcon,
  Home as HomeIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Component hiển thị thông báo lỗi và hướng dẫn người dùng cách khắc phục
 */
const ErrorHandler = ({
  error,               // Thông báo lỗi cụ thể
  errorCode,           // Mã lỗi (nếu có)
  onRetry,             // Hàm xử lý khi người dùng muốn thử lại
  onCreateNewTicket,   // Hàm xử lý khi người dùng muốn tạo ticket mới
  showHomeButton = true, // Hiển thị nút về trang chủ
  showNewTicketButton = true // Hiển thị nút tạo ticket mới
}) => {
  const navigate = useNavigate();

  const getErrorMessage = () => {
    if (error) return error;

    if (errorCode) {
      switch (errorCode) {
        case 401:
          return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        case 403:
          return 'Bạn không có quyền truy cập yêu cầu hỗ trợ này. Chỉ có thể xem yêu cầu do bạn tạo.';
        case 404:
          return 'Không tìm thấy dữ liệu yêu cầu. Có thể đã bị xóa hoặc di chuyển.';
        case 500:
          return 'Máy chủ đang gặp sự cố. Hệ thống đang hiển thị dữ liệu dự phòng, nhưng một số tính năng có thể không khả dụng. Vui lòng liên hệ bộ phận IT để được hỗ trợ.';
        default:
          return `Đã xảy ra lỗi (Mã: ${errorCode}). Vui lòng thử lại sau.`;
      }
    }

    return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.';
  };

  const getSuggestion = () => {
    if (errorCode === 500) {
      return 'Bạn vẫn có thể tiếp tục sử dụng ứng dụng với dữ liệu dự phòng. Tin nhắn bạn gửi sẽ được lưu và tự động gửi khi máy chủ khôi phục hoạt động.';
    } else if (errorCode === 404) {
      return 'Hãy thử tạo yêu cầu hỗ trợ mới hoặc quay lại trang chủ.';
    } else if (errorCode === 401) {
      return 'Hãy đăng nhập lại vào hệ thống để tiếp tục sử dụng ứng dụng.';
    } else if (errorCode === 403) {
      return 'Mỗi người dùng chỉ có thể xem yêu cầu hỗ trợ do chính mình tạo. Hãy tạo yêu cầu hỗ trợ mới hoặc xem lại các yêu cầu đã tạo trước đó.';
    }

    return 'Bạn có thể thử làm mới trang, tạo yêu cầu hỗ trợ mới hoặc quay lại trang chủ để tiếp tục.';
  };

  const goToHome = () => {
    navigate('/');
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        minHeight: '300px',
        justifyContent: 'center'
      }}
    >
      <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />

      <Typography variant="h5" sx={{ mb: 1, color: 'error.main' }}>
        Không thể tải dữ liệu
      </Typography>

      <Alert severity="error" sx={{ mb: 3, width: '100%', maxWidth: '500px' }}>
        <AlertTitle>Lỗi</AlertTitle>
        {getErrorMessage()}
      </Alert>

      <Typography variant="body1" sx={{ mb: 3, maxWidth: '600px' }}>
        {getSuggestion()}
      </Typography>

      <Divider sx={{ width: '100%', mb: 3 }} />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {onRetry && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
          >
            Thử lại
          </Button>
        )}

        {showHomeButton && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<HomeIcon />}
            onClick={goToHome}
          >
            Trang chủ
          </Button>
        )}

        {showNewTicketButton && onCreateNewTicket && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onCreateNewTicket}
          >
            Tạo yêu cầu hỗ trợ mới
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default ErrorHandler; 