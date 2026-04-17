import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, useMediaQuery, useTheme, Container,
  Switch, Tooltip, Chip, Snackbar, Alert,
} from '@mui/material';
import { useEffect, useState } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useAuthStore } from '../../store/authStore';
import { useSiteSettingsStore } from '../../store/siteSettingsStore';
import { adminApi } from '../../services/api';

const DRAWER_WIDTH = 260;

export default function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, fullName, logout } = useAuthStore();
  const isMaintenanceMode = useSiteSettingsStore((s) => s.isMaintenanceMode);
  const setMaintenanceLocal = useSiteSettingsStore((s) => s.setMaintenance);
  const fetchStatus = useSiteSettingsStore((s) => s.fetchStatus);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; severity: 'success' | 'error'; message: string }>({
    open: false,
    severity: 'success',
    message: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatus();
    }
  }, [isAuthenticated, fetchStatus]);

  const handleToggleMaintenance = async () => {
    const next = !isMaintenanceMode;
    setToggleLoading(true);
    try {
      const result = await adminApi.setMaintenance(next);
      setMaintenanceLocal(result.isMaintenanceMode);
      setSnack({
        open: true,
        severity: 'success',
        message: result.isMaintenanceMode ? t('admin.maintenanceEnabled') : t('admin.maintenanceDisabled'),
      });
    } catch {
      setSnack({ open: true, severity: 'error', message: t('common.error') });
    } finally {
      setToggleLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" />;
  }

  const navItems = [
    { label: t('admin.dashboard'), path: '/admin/dashboard', icon: <DashboardIcon /> },
    { label: t('admin.manageCategories'), path: '/admin/categories', icon: <CategoryIcon /> },
    { label: t('admin.manageProducts'), path: '/admin/products', icon: <InventoryIcon /> },
    { label: t('admin.manageInventory'), path: '/admin/inventory', icon: <Inventory2Icon /> },
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

            <Tooltip
              title={
                isMaintenanceMode
                  ? t('admin.maintenanceTooltipOn')
                  : t('admin.maintenanceTooltipOff')
              }
              arrow
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: isMaintenanceMode ? 'warning.main' : 'divider',
                  backgroundColor: isMaintenanceMode ? 'warning.light' : 'transparent',
                  transition: 'all 0.2s ease',
                  mr: 1,
                }}
              >
                <BuildCircleIcon
                  fontSize="small"
                  sx={{ color: isMaintenanceMode ? 'warning.dark' : 'text.secondary' }}
                />
                {!isMobile && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: isMaintenanceMode ? 'warning.dark' : 'text.secondary',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t('admin.maintenanceMode')}
                  </Typography>
                )}
                <Switch
                  size="small"
                  checked={isMaintenanceMode}
                  onChange={handleToggleMaintenance}
                  disabled={toggleLoading}
                  color="warning"
                />
                {isMaintenanceMode && !isMobile && (
                  <Chip
                    label={t('admin.maintenanceOn')}
                    color="warning"
                    size="small"
                    sx={{ fontWeight: 700, height: 22 }}
                  />
                )}
              </Box>
            </Tooltip>

            <Tooltip title={t('admin.openSiteAsCustomer')} arrow>
              <IconButton onClick={() => window.open('/', '_blank')} sx={{ mr: 0.5 }}>
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>

            <IconButton onClick={logout} title={t('common.logout')}>
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 3, flexGrow: 1 }}>
          <Outlet />
        </Container>

        <Snackbar
          open={snack.open}
          autoHideDuration={3500}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snack.severity}
            variant="filled"
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
