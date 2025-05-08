import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Modern theme with improved aesthetics
const theme = (mode) => {
  const isDark = mode === 'dark';
  
  // Base colors
  const primaryMain = '#6366F1'; // Indigo
  const secondaryMain = '#EC4899'; // Pink
  const successMain = '#10B981'; // Emerald
  const infoMain = '#3B82F6'; // Blue
  const warningMain = '#F59E0B'; // Amber
  const errorMain = '#EF4444'; // Red
  
  // Background colors
  const bgDefault = isDark ? '#111827' : '#F9FAFB';
  const bgPaper = isDark ? '#1F2937' : '#FFFFFF';
  const bgCard = isDark ? '#374151' : '#FFFFFF';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: primaryMain,
        light: alpha(primaryMain, 0.8),
        dark: alpha(primaryMain, 1.2),
        contrastText: '#ffffff',
      },
      secondary: {
        main: secondaryMain,
        light: alpha(secondaryMain, 0.8),
        dark: alpha(secondaryMain, 1.2),
        contrastText: '#ffffff',
      },
      success: {
        main: successMain,
        light: alpha(successMain, 0.8),
        dark: alpha(successMain, 1.2),
      },
      info: {
        main: infoMain,
        light: alpha(infoMain, 0.8),
        dark: alpha(infoMain, 1.2),
      },
      warning: {
        main: warningMain,
        light: alpha(warningMain, 0.8),
        dark: alpha(warningMain, 1.2),
      },
      error: {
        main: errorMain,
        light: alpha(errorMain, 0.8),
        dark: alpha(errorMain, 1.2),
      },
      background: {
        default: bgDefault,
        paper: bgPaper,
        card: bgCard,
      },
      text: {
        primary: isDark ? '#F9FAFB' : '#111827',
        secondary: isDark ? '#D1D5DB' : '#4B5563',
        disabled: isDark ? '#6B7280' : '#9CA3AF',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800, fontSize: '2.5rem' },
      h2: { fontWeight: 700, fontSize: '2rem' },
      h3: { fontWeight: 700, fontSize: '1.75rem' },
      h4: { fontWeight: 600, fontSize: '1.5rem' },
      h5: { fontWeight: 600, fontSize: '1.25rem' },
      h6: { fontWeight: 600, fontSize: '1rem' },
      subtitle1: { fontSize: '1rem', lineHeight: 1.5 },
      subtitle2: { fontSize: '0.875rem', fontWeight: 500 },
      body1: { fontSize: '1rem', lineHeight: 1.5 },
      body2: { fontSize: '0.875rem', lineHeight: 1.57 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      '0px 2px 4px rgba(0, 0, 0, 0.05)',
      '0px 4px 8px rgba(0, 0, 0, 0.08)',
      '0px 6px 12px rgba(0, 0, 0, 0.1)',
      '0px 8px 16px rgba(0, 0, 0, 0.12)',
      '0px 10px 20px rgba(0, 0, 0, 0.15)',
      ...Array(19).fill('none'), // Fill remaining shadows
    ],
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.3)' : '0 8px 24px rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            padding: '10px 20px',
            transition: 'all 0.2s',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              transform: 'translateY(-2px)',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#1A202C' : '#ffffff',
            borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#111827' : '#ffffff',
            color: isDark ? '#ffffff' : '#111827',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(8px)',
            background: isDark ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '4px 8px',
            transition: 'all 0.2s',
            '&.Mui-selected': {
              backgroundColor: isDark ? alpha(primaryMain, 0.15) : alpha(primaryMain, 0.1),
              color: primaryMain,
              '& .MuiListItemIcon-root': {
                color: primaryMain,
              },
            },
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              transform: 'translateX(4px)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.1)',
              },
              '&.Mui-focused': {
                boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            border: isDark ? '2px solid rgba(255, 255, 255, 0.1)' : '2px solid rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
};

export default theme; 