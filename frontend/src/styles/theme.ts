import { createTheme } from '@mui/material/styles';

export const getTheme = (direction: 'rtl' | 'ltr') =>
  createTheme({
    direction,
    palette: {
      primary: {
        main: '#c59c5c',
        light: '#d4b27a',
        dark: '#a17d3f',
        contrastText: '#fff',
      },
      secondary: {
        main: '#2c2c2c',
        light: '#555555',
        dark: '#1a1a1a',
        contrastText: '#fff',
      },
      background: {
        default: '#faf8f5',
        paper: '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Rubik", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 500 },
      h6: { fontWeight: 500 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none' as const,
            fontWeight: 600,
            borderRadius: 8,
            padding: '10px 24px',
            '&.MuiButton-containedPrimary:hover': {
              backgroundColor: '#a17d3f',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: '#2c2c2c',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          },
        },
      },
    },
  });
