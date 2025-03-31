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
    const user = await login(username, password, role);
    console.log('Login response:', user);

    // Lưu thông tin user vào localStorage
    if (user && user.user) {
      console.log('User data:', user.user);
      console.log('User ID:', user.user.id);
      localStorage.setItem('username', user.user.username);
      localStorage.setItem('userId', user.user.id);
      localStorage.setItem('userData', JSON.stringify(user));
      
      // Verify saved data
      console.log('Saved username:', localStorage.getItem('username'));
      console.log('Saved userId:', localStorage.getItem('userId'));
      console.log('Saved userData:', localStorage.getItem('userData'));
    }

    // Chuyển hướng dựa trên vai trò
    if (role === 'admin') {
      navigate('/admin');
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
            Đăng nhập hệ thống
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

          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
            <FormControl
              component="fieldset"
              sx={{
                width: '100%',
                mb: 3,
                '& .MuiFormLabel-root': {
                  color: theme.palette.primary.main,
                  fontWeight: 'bold',
                },
                '& .MuiFormControlLabel-label': {
                  color: theme.palette.text.primary,
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
                  '& .MuiRadio-root': {
                    color: theme.palette.primary.main,
                    '&.Mui-checked': {
                      color: theme.palette.primary.main,
                    },
                  },
                }}
              >
                <FormControlLabel value="user" control={<Radio />} label="Nhân viên" />
                <FormControlLabel value="admin" control={<Radio />} label="Quản trị viên" />
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
              name="password"
              label="Mật khẩu"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Đăng nhập'}
            </Button>

            {/* Nút đăng ký tài khoản */}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/register')}
              sx={{
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                mb: 2,
              }}
              disabled={loading}
            >
              Đăng ký tài khoản
            </Button>

            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 2,
                bgcolor: 'rgba(30, 60, 114, 0.05)',
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary" align="center" sx={{ fontWeight: 'bold' }}>
                Thông tin đăng nhập thử nghiệm:
              </Typography>
              <Box
                component="div"
                sx={{
                  mt: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: theme.palette.primary.main,
                  }}
                >
                  <PersonIcon fontSize="small" />
                  <Typography variant="body2">Admin: admin / admin123</Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: theme.palette.primary.main,
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
