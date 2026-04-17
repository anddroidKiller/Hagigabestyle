import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar, Toolbar, Typography, Button, IconButton, Badge, Box,
  Drawer, List, ListItem, ListItemText, ListItemButton, Container, useMediaQuery, useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TranslateIcon from '@mui/icons-material/Translate';
import CloseIcon from '@mui/icons-material/Close';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useSiteSettingsStore } from '../store/siteSettingsStore';

export default function Layout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const isAdmin = useAuthStore((s) => s.isAuthenticated);
  const isMaintenanceMode = useSiteSettingsStore((s) => s.isMaintenanceMode);
  const showAdminPreviewBanner = isAdmin && isMaintenanceMode;

  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'he' ? 'rtl' : 'ltr';
  };

  const navItems = [
    { label: t('common.home'), path: '/' },
    { label: t('common.categories'), path: '/categories' },
    { label: t('common.packages'), path: '/packages' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {showAdminPreviewBanner && (
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: (th) => th.zIndex.appBar + 1,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            px: 2,
            py: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: 1,
          }}
        >
          <BuildCircleIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {t('common.adminPreviewBanner')}
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="inherit"
            onClick={() => navigate('/admin/dashboard')}
            sx={{ color: 'warning.main', bgcolor: 'common.white', fontWeight: 700, py: 0.25 }}
          >
            {t('common.backToAdmin')}
          </Button>
        </Box>
      )}

      <AppBar position="sticky" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 1 }}>
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(true)} edge="start">
                <MenuIcon />
              </IconButton>
            )}

            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                fontWeight: 700,
                flexGrow: isMobile ? 1 : 0,
                mr: isMobile ? 0 : 3,
              }}
            >
              {t('common.appName')}
            </Typography>

            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    color="inherit"
                    sx={{ fontWeight: 500 }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            )}

            <IconButton onClick={toggleLanguage} size="small" title={t('common.language')}>
              <TranslateIcon />
            </IconButton>

            <IconButton onClick={() => navigate('/cart')} color="inherit">
              <Badge badgeContent={totalItems} color="primary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor={i18n.language === 'he' ? 'right' : 'left'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 280, pt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
              {t('common.appName')}
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List>
            {navItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    setDrawerOpen(false);
                  }}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>

      {/* Mobile Sticky Cart Bar */}
      {isMobile && totalItems > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'primary.main',
            color: 'white',
            p: 1.5,
            zIndex: 1200,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
          }}
          onClick={() => navigate('/cart')}
        >
          <ShoppingCartIcon />
          <Typography sx={{ fontWeight: 600 }}>
            {t('common.cart')} ({totalItems}) - ₪{useCartStore.getState().totalPrice().toFixed(2)}
          </Typography>
        </Box>
      )}

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: 'secondary.main',
          color: 'white',
          py: 4,
          mt: 'auto',
          mb: isMobile && totalItems > 0 ? '56px' : 0,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" align="center" sx={{ opacity: 0.8 }}>
            © {new Date().getFullYear()} {t('common.appName')}. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
