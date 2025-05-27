import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  InputAdornment,
  IconButton,
  Stack,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Fingerprint as FingerprintIcon,
  Security as SecurityIcon,
  SupervisorAccount as AdminIcon,
  PersonOutline as UserIcon,
} from '@mui/icons-material';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

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

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha('#111827', 0.95)} 100%)`
          : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.background.default, 0.7)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isDark
            ? 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="rgba(255,255,255,0.05)" fill-rule="evenodd"/%3E%3C/svg%3E")'
            : 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="rgba(0,0,0,0.03)" fill-rule="evenodd"/%3E%3C/svg%3E")',
        },
      }}
    >
      <Container maxWidth="xs">
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex', 
            flexDirection: 'column',
            gap: 2
          }}
        >
          <Box 
            sx={{ 
              textAlign: 'center', 
              mb: 3,
              animation: 'fadeInDown 1s ease-out',
              '@keyframes fadeInDown': {
                '0%': { opacity: 0, transform: 'translateY(-20px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            <Stack 
              direction="row" 
              spacing={1} 
              alignItems="center" 
              justifyContent="center"
              sx={{ mb: 1 }}
            >
              <FingerprintIcon 
                sx={{ 
                  fontSize: '2.5rem', 
                  color: theme.palette.primary.main,
                  filter: `drop-shadow(0 0 8px ${alpha(theme.palette.primary.main, 0.5)})`,
                }} 
              />
              <Typography
                variant="h4"
                sx={{ 
                  fontWeight: 800, 
                  color: isDark ? 'white' : theme.palette.primary.main,
                  letterSpacing: '-0.5px',
                  textShadow: isDark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(99,102,241,0.2)',
                }}
              >
                FaceTrack-AI
              </Typography>
            </Stack>
            <Typography 
              variant="subtitle1" 
              color={isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary'}
              sx={{ 
                fontWeight: 500,
                opacity: 0.85, 
              }}
            >
              Đăng nhập để sử dụng hệ thống
            </Typography>
          </Box>
        
          <Paper
            elevation={isDark ? 8 : 4}
            sx={{
              p: 4,
              borderRadius: 3,
              backgroundColor: isDark 
                ? alpha(theme.palette.background.paper, 0.8) 
                : alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(12px)',
              border: `1px solid ${alpha(isDark ? '#ffffff' : '#000000', 0.05)}`,
              transform: 'translateY(0)',
              transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: isDark 
                  ? '0 20px 40px rgba(0,0,0,0.4)' 
                  : '0 20px 40px rgba(0,0,0,0.1)',
              },
              animation: 'fadeIn 1s ease-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(20px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            <Typography
              component="h1"
              variant="h5"
              sx={{
                mb: 3,
                fontWeight: 700,
                color: theme.palette.primary.main,
                textAlign: 'center',
              }}
            >
              Đăng nhập
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.main,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  '& .MuiAlert-icon': {
                    color: theme.palette.error.main,
                  },
                  animation: 'shake 0.5s ease-in-out',
                  '@keyframes shake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '20%, 60%': { transform: 'translateX(-5px)' },
                    '40%, 80%': { transform: 'translateX(5px)' },
                  },
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
              <FormControl 
                sx={{ 
                  mb: 3, 
                  display: 'flex', 
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center', 
                  width: '100%',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  borderRadius: 2,
                  p: 0.8,
                  backgroundColor: isDark 
                    ? alpha(theme.palette.background.default, 0.5) 
                    : alpha(theme.palette.primary.main, 0.03)
                }}
              >
                <RadioGroup
                  row
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  sx={{ justifyContent: 'center' }}
                >
                  <FormControlLabel
                    value="user"
                    control={
                      <Radio 
                        color="primary" 
                        size="small"
                        sx={{ 
                          '&.Mui-checked': {
                            color: theme.palette.primary.main,
                          } 
                        }}
                      />
                    }
                    label={
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <UserIcon fontSize="small" />
                        <Typography variant="body2">Nhân viên</Typography>
                      </Stack>
                    }
                    sx={{ mr: 2 }}
                  />
                  <FormControlLabel
                    value="admin"
                    control={
                      <Radio 
                        color="primary" 
                        size="small"
                        sx={{ 
                          '&.Mui-checked': {
                            color: theme.palette.primary.main,
                          } 
                        }}
                      />
                    }
                    label={
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <AdminIcon fontSize="small" />
                        <Typography variant="body2">Quản trị viên</Typography>
                      </Stack>
                    }
                  />
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease-out',
                    '&:hover': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Mật khẩu"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={toggleShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s ease-out',
                    '&:hover': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '1rem',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isDark 
                    ? `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}` 
                    : `0 4px 15px ${alpha(theme.palette.primary.main, 0.2)}`,
                  transition: 'all 0.3s ease-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: isDark 
                      ? `0 8px 25px ${alpha(theme.palette.primary.main, 0.5)}` 
                      : `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0)} 30%, ${alpha('#fff', 0.2)} 50%, ${alpha(theme.palette.primary.light, 0)} 70%)`,
                    transform: 'rotate(45deg)',
                    transition: 'all 0.5s ease-out',
                    animation: 'shimmer 3s infinite',
                    zIndex: 0,
                  },
                  '@keyframes shimmer': {
                    '0%': { transform: 'translateX(-100%) rotate(45deg)' },
                    '100%': { transform: 'translateX(100%) rotate(45deg)' },
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <span style={{ position: 'relative', zIndex: 1 }}>Đăng nhập</span>
                )}
              </Button>

              <Box 
                sx={{ 
                  mt: 3, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Link 
                  to="/register" 
                  style={{ 
                    textDecoration: 'none',
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}
                >
                
                </Link>
              </Box>
            </Box>
          </Paper>
          
          <Box sx={{ textAlign: 'center', mt: 3, opacity: 0.7 }}>
            <Typography variant="body2" color={isDark ? 'white' : 'text.secondary'}>
              © {new Date().getFullYear()} FaceTrack-AI. Bản quyền thuộc về FaceTrack-AI.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;