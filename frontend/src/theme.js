import { createTheme } from '@mui/material/styles';

// Purple theme inspired by the template
const theme = (mode) => {
  const isDark = mode === 'dark';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#7b5dfa', // Purple main color
        light: '#9d85fb',
        dark: '#5e43c9',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#ff6b9d', // Pink accent color
        light: '#ff8cb3',
        dark: '#e54b7d',
        contrastText: '#ffffff',
      },
      success: {
        main: '#51d0b5', // Teal/Mint for success states
        light: '#72dcc4',
        dark: '#3caa92',
      },
      info: {
        main: '#4c9fff', // Blue for info cards
        light: '#70b5ff',
        dark: '#3a78cc',
      },
      warning: {
        main: '#ffc555', // Orange/Amber for warnings
        light: '#ffd377',
        dark: '#e5a935',
      },
      error: {
        main: '#ff5572', // Red/Pink for errors
        light: '#ff798e',
        dark: '#d83e58',
      },
      background: {
        default: isDark ? '#1c1e27' : '#f7f7fb',
        paper: isDark ? '#252836' : '#ffffff',
        card: isDark ? '#2d303e' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f1f1f3' : '#3d3d55',
        secondary: isDark ? '#a2a3b7' : '#6f6f87',
        disabled: isDark ? '#6a6c7a' : '#c3c3d2',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 700,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        fontWeight: 500,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            padding: '8px 16px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#1f2130' : '#ffffff',
            borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1a1c25' : '#ffffff',
            color: isDark ? '#ffffff' : '#3d3d55',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '4px 8px',
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(123, 93, 250, 0.15)' : 'rgba(123, 93, 250, 0.1)',
              color: '#7b5dfa',
              '& .MuiListItemIcon-root': {
                color: '#7b5dfa',
              },
            },
          },
        },
      },
    },
  });
};

export default theme; 