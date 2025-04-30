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
import { authApi } from '../services/api';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'user',
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
      const { confirm_password, ...registerData } = formData;
      const response = await authApi.register(registerData);

      if (response.data.success) {
        const { user } = response.data;
        if (user) {
          localStorage.setItem('user', JSON.stringify({
            id: user.id,
            username: user.username
          }));
        }
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
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3c72 0%, #4c1d95 50%, #6b21a8 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 10%, transparent 40%)',
          animation: 'pulse 15s ease-in-out infinite',
          zIndex: 0,
        },
        '@keyframes pulse': {
          '0%': { transform: 'scale(0.8)', opacity: 0.5 },
          '50%': { transform: 'scale(1.2)', opacity: 0.3 },
          '100%': { transform: 'scale(0.8)', opacity: 0.5 },
        },
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={6}
          sx={{
            padding: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 2,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(245,250,255,0.85) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
            },
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Avatar
            sx={{
              m: 1,
              bgcolor: 'linear-gradient(45deg, #1e3c72, #2a5298)',
              width: 50,
              height: 50,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              animation: 'pulseAvatar 2s ease-in-out infinite',
              '@keyframes pulseAvatar': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
                '100%': { transform: 'scale(1)' },
              },
            }}
          >
            <SecurityIcon sx={{ fontSize: 30, color: '#fff' }} />
          </Avatar>

          <Typography
            component="h1"
            variant="h5"
            sx={{
              mt: 1,
              mb: 2,
              fontWeight: 'bold',
              color: theme.palette.primary.main,
              letterSpacing: '0.2px',
              textShadow: '0 1px 3px rgba(0,0,0,0.1)',
              fontSize: '1.8rem',
            }}
          >
            Đăng ký tài khoản
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mt: 1,
                mb: 2,
                width: '100%',
                borderRadius: 1,
                bgcolor: 'rgba(255, 235, 235, 0.95)',
                boxShadow: '0 2px 6px rgba(255,0,0,0.1)',
                opacity: 0,
                animation: 'fadeIn 0.3s ease forwards',
                '@keyframes fadeIn': {
                  to: { opacity: 1 },
                },
                fontSize: '0.85rem',
                padding: '8px',
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
                startAdornment: (
                  <PersonIcon
                    sx={{
                      mr: 0.5,
                      color: theme.palette.primary.main,
                      fontSize: 20,
                      transition: 'color 0.3s ease',
                      '.Mui-focused &': { color: theme.palette.primary.dark },
                    }}
                  />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  background: 'rgba(255,255,255,0.9)',
                  transition: 'all 0.3s ease',
                  fontSize: '0.9rem',
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.dark,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.dark,
                    boxShadow: `0 0 8px ${theme.palette.primary.light}`,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.primary.main,
                  fontWeight: 'medium',
                  fontSize: '0.9rem',
                  '&.Mui-focused': {
                    color: theme.palette.primary.dark,
                  },
                },
                mb: 1.5,
                '& .MuiInputBase-input': {
                  padding: '8px 12px',
                },
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
                startAdornment: (
                  <PersonIcon
                    sx={{
                      mr: 0.5,
                      color: theme.palette.primary.main,
                      fontSize: 20,
                      transition: 'color 0.3s ease',
                      '.Mui-focused &': { color: theme.palette.primary.dark },
                    }}
                  />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  background: 'rgba(255,255,255,0.9)',
                  transition: 'all 0.3s ease',
                  fontSize: '0.9rem',
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.dark,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.dark,
                    boxShadow: `0 0 8px ${theme.palette.primary.light}`,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.primary.main,
                  fontWeight: 'medium',
                  fontSize: '0.9rem',
                  '&.Mui-focused': {
                    color: theme.palette.primary.dark,
                  },
                },
                mb: 1.5,
                '& .MuiInputBase-input': {
                  padding: '8px 12px',
                },
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
                startAdornment: (
                  <LockIcon
                    sx={{
                      mr: 0.5,
                      color: theme.palette.primary.main,
                      fontSize: 20,
                      transition: 'color 0.3s ease',
                      '.Mui-focused &': { color: theme.palette.primary.dark },
                    }}
                  />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  background: 'rgba(255,255,255,0.9)',
                  transition: 'all 0.3s ease',
                  fontSize: '0.9rem',
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.dark,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.dark,
                    boxShadow: `0 0 8px ${theme.palette.primary.light}`,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.primary.main,
                  fontWeight: 'medium',
                  fontSize: '0.9rem',
                  '&.Mui-focused': {
                    color: theme.palette.primary.dark,
                  },
                },
                mb: 1.5,
                '& .MuiInputBase-input': {
                  padding: '8px 12px',
                },
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
                startAdornment: (
                  <LockIcon
                    sx={{
                      mr: 0.5,
                      color: theme.palette.primary.main,
                      fontSize: 20,
                      transition: 'color 0.3s ease',
                      '.Mui-focused &': { color: theme.palette.primary.dark },
                    }}
                  />
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  background: 'rgba(255,255,255,0.9)',
                  transition: 'all 0.3s ease',
                  fontSize: '0.9rem',
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.dark,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.dark,
                    boxShadow: `0 0 8px ${theme.palette.primary.light}`,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.primary.main,
                  fontWeight: 'medium',
                  fontSize: '0.9rem',
                  '&.Mui-focused': {
                    color: theme.palette.primary.dark,
                  },
                },
                mb: 1.5,
                '& .MuiInputBase-input': {
                  padding: '8px 12px',
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                mb: 1.5,
                py: 1,
                borderRadius: 1,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1e3c72 30%, #2a5298 90%)',
                boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(45deg, #2a5298 30%, #1e3c72 90%)',
                  transform: 'scale(1.02)',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                },
                '&:disabled': {
                  background: 'linear-gradient(45deg, #b0bec5 30%, #90a4ae 90%)',
                  boxShadow: 'none',
                },
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Đăng ký'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{
                py: 1,
                borderRadius: 1,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: theme.palette.primary.light,
                  color: '#fff',
                  borderColor: theme.palette.primary.dark,
                  transform: 'scale(1.02)',
                },
                mb: 1.5,
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