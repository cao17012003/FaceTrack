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
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Avatar,
  useTheme,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const userData = await login(username, password, role);
      console.log('Login response:', userData);

      if (userData && userData.user) {
        console.log('User data:', userData.user);
        console.log('User ID:', userData.user.id);
        localStorage.setItem('username', userData.user.username);
        localStorage.setItem('userId', userData.user.id);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        console.log('Saved username:', localStorage.getItem('username'));
        console.log('Saved userId:', localStorage.getItem('userId'));
        console.log('Saved userData:', localStorage.getItem('userData'));
      }

      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'user') {
        navigate('/');
      } else {
        navigate('/');
      }
    } catch (error) {
      setError(error.message);
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
        background: 'linear-gradient(135deg, #bfdbfe 0%, #f8fafc 50%, #fefce8 100%)',
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
            background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.85) 100%)',
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
              bgcolor: 'linear-gradient(45deg, #60a5fa, #fef08a)',
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
              color: '#3b82f6',
              letterSpacing: '0.2px',
              textShadow: '0 1px 3px rgba(0,0,0,0.1)',
              fontSize: '1.8rem',
            }}
          >
            Đăng nhập hệ thống
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mt: 1,
                mb: 2,
                width: '100%',
                borderRadius: 1,
                bgcolor: 'rgba(254,226,226,0.95)',
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

          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
            <FormControl
              component="fieldset"
              sx={{
                width: '100%',
                mb: 2,
                '& .MuiFormLabel-root': {
                  color: '#3b82f6',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                },
                '& .MuiFormControlLabel-label': {
                  color: theme.palette.text.primary,
                  fontSize: '0.85rem',
                },
              }}
            >
              <FormLabel component="legend">Vai trò</FormLabel>
              <RadioGroup
                row
                value={role}
                onChange={(e) => setRole(e.target.value)}
                sx={{
                  justifyContent: 'center',
                  gap: 3,
                  '& .MuiRadio-root': {
                    color: '#60a5fa',
                    transform: 'scale(0.9)',
                    '&.Mui-checked': {
                      color: '#3b82f6',
                    },
                  },
                  '& .MuiFormControlLabel-root': {
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      background: 'rgba(96,165,250,0.05)',
                      borderRadius: 1,
                    },
                  },
                }}
              >
                <FormControlLabel value="user" control={<Radio size="small" />} label="Nhân viên" />
                <FormControlLabel value="admin" control={<Radio size="small" />} label="Quản trị viên" />
              </RadioGroup>
            </FormControl>

            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Tên đăng nhập"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <PersonIcon
                    sx={{
                      mr: 0.5,
                      color: '#60a5fa',
                      fontSize: 20,
                      transition: 'color 0.3s ease',
                      '.Mui-focused &': { color: '#3b82f6' },
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
                    borderColor: '#3b82f6',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 8px rgba(96,165,250,0.5)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#60a5fa',
                  fontWeight: 'medium',
                  fontSize: '0.9rem',
                  '&.Mui-focused': {
                    color: '#3b82f6',
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
              name="password"
              label="Mật khẩu"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <LockIcon
                    sx={{
                      mr: 0.5,
                      color: '#60a5fa',
                      fontSize: 20,
                      transition: 'color 0.3s ease',
                      '.Mui-focused &': { color: '#3b82f6' },
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
                    borderColor: '#3b82f6',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 8px rgba(96,165,250,0.5)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#60a5fa',
                  fontWeight: 'medium',
                  fontSize: '0.9rem',
                  '&.Mui-focused': {
                    color: '#3b82f6',
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
                background: 'linear-gradient(45deg, #60a5fa 30%, #fef08a 90%)',
                color: '#1e3a8a',
                boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(45deg, #fef08a 30%, #60a5fa 90%)',
                  transform: 'scale(1.02)',
                  boxShadow: '0 5px 15px rgba(96,165,250,0.4)',
                },
                '&:disabled': {
                  background: 'linear-gradient(45deg, #e5e7eb 30%, #d1d5db 90%)',
                  boxShadow: 'none',
                  color: '#6b7280',
                },
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Đăng nhập'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/register')}
              sx={{
                py: 1,
                borderRadius: 1,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                borderColor: '#60a5fa',
                color: '#60a5fa',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(96,165,250,0.1)',
                  color: '#3b82f6',
                  borderColor: '#3b82f6',
                  transform: 'scale(1.02)',
                },
                mb: 1.5,
              }}
              disabled={loading}
            >
              Đăng ký tài khoản
            </Button>

            <Paper
              elevation={0}
              sx={{
                mt: 1.5,
                p: 1.5,
                width: '100%',
                bgcolor: 'rgba(96,165,250,0.05)',
                borderRadius: 1,
                border: '1px solid rgba(96,165,250,0.2)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'rgba(96,165,250,0.1)',
                  transform: 'scale(1.01)',
                },
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ fontWeight: 'bold', color: '#3b82f6', mb: 1, fontSize: '0.8rem' }}
              >
                Thông tin đăng nhập thử nghiệm:
              </Typography>
              <Box
                component="div"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.8,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: '#3b82f6',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      color: '#1e40af',
                    },
                  }}
                >
                  <PersonIcon fontSize="small" />
                  <Typography variant="body2">Admin: admin / admin123</Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: '#3b82f6',
                    fontSize: '0.8rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateX(4px)',
                      color: '#1e40af',
                    },
                  }}
                >
                  <PersonIcon fontSize="small" />
                  <Typography variant="body2">Nhân viên: 21011801 / 21011801</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;