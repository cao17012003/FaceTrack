import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Alert,
  CircularProgress,
  Avatar,
  useTheme,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import { authApi } from '../services/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'user'  // Mặc định là user
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password || !formData.confirm_password) {
      setError('Vui lòng nhập đầy đủ thông tin đăng ký');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Gửi request đăng ký sử dụng authApi
      const { confirm_password, ...registerData } = formData;
      const response = await authApi.register(registerData);
      
      if (response.data.success) {
        // Nếu backend trả về thông tin user (chứa id, username, ...)
        const { user } = response.data;
        if (user) {
          // Lưu id và username vào localStorage
          localStorage.setItem('user', JSON.stringify({
            id: user.id,
            username: user.username
          }));
        }
        // Sau khi đăng ký thành công, chuyển hướng về trang đăng nhập
        navigate('/login');
      } else {
        setError(response.data.error || 'Có lỗi xảy ra khi đăng ký tài khoản');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi đăng ký tài khoản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={8}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <Avatar
            sx={{
              m: 1,
              bgcolor: theme.palette.primary.main,
              width: 56,
              height: 56,
            }}
          >
            <SecurityIcon sx={{ fontSize: 32 }} />
          </Avatar>

          <Typography
            component="h1"
            variant="h4"
            sx={{
              mt: 2,
              mb: 3,
              fontWeight: 'bold',
              color: theme.palette.primary.main,
            }}
          >
            Đăng ký tài khoản
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                width: '100%',
                borderRadius: 1,
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Tên đăng nhập"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              autoFocus
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                },
                '& .MuiInputLabel-root': { color: theme.palette.primary.main },
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                },
                '& .MuiInputLabel-root': { color: theme.palette.primary.main },
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Mật khẩu"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: theme.palette.primary.main }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                },
                '& .MuiInputLabel-root': { color: theme.palette.primary.main },
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Xác nhận mật khẩu"
              name="confirm_password"
              type="password"
              value={formData.confirm_password}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: theme.palette.primary.main }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                },
                '& .MuiInputLabel-root': { color: theme.palette.primary.main },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1e3c72 30%, #2a5298 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #2a5298 30%, #1e3c72 90%)',
                },
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Đăng ký'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                mb: 2,
              }}
              disabled={loading}
            >
              Đã có tài khoản? Đăng nhập
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
