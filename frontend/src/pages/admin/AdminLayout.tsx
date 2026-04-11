import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, useMediaQuery, useTheme, Container,
} from '@mui/material';
import { useState } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuthStore } from '../../store/authStore';

const DRAWER_WIDTH = 260;

export default function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, fullName, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" />;
  }

  const navItems = [
    { label: t('admin.dashboard'), path: '/admin/dashboard', icon: <DashboardIcon /> },
    { label: t('admin.manageCategories'), path: '/admin/categories', icon: <CategoryIcon /> },
    { label: t('admin.manageProducts'), path: '/admin/products', icon: <InventoryIcon /> },
    { label: t('admin.managePackages'), path: '/admin/packages', icon: <CardGiftcardIcon /> },
    { label: t('admin.manageOrders'), path: '/admin/orders', icon: <ShoppingBagIcon /> },
  ];

  const drawerContent = (
    <Box sx={{ pt: 2 }}>
      <Typography variant="h6" color="primary" sx={{ px: 2, mb: 2, fontWeight: 700 }}>
        {t('common.admin')}
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={() => isMobile && setMobileOpen(false)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, borderRight: '1px solid', borderColor: 'divider' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" elevation={0}>
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="body1" sx={{ flexGrow: 1 }}>
              {fullName}
            </Typography>
            <IconButton onClick={logout} title={t('common.logout')}>
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 3, flexGrow: 1 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
