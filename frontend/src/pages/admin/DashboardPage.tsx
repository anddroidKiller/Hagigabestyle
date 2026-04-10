import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography, Grid, Paper, Box, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
} from '@mui/material';
import { adminApi, DashboardDto } from '../../services/api';

export default function DashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) return null;

  const stats = [
    { label: t('admin.totalOrders'), value: data.totalOrders, color: '#1976d2' },
    { label: t('admin.pendingOrders'), value: data.pendingOrders, color: '#ed6c02' },
    { label: t('admin.totalRevenue'), value: `₪${data.totalRevenue.toFixed(0)}`, color: '#2e7d32' },
    { label: t('admin.totalProducts'), value: data.totalProducts, color: '#9c27b0' },
    { label: t('admin.totalPackages'), value: data.totalPackages, color: '#c59c5c' },
  ];

  const statusColor: Record<string, 'default' | 'warning' | 'success' | 'info' | 'error'> = {
    Pending: 'warning',
    Paid: 'success',
    Processing: 'info',
    Shipped: 'info',
    Delivered: 'success',
    Cancelled: 'error',
  };

  return (
    <>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
        {t('admin.dashboard')}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={stat.label}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                borderTop: `4px solid ${stat.color}`,
                textAlign: 'center',
              }}
            >
              <Typography variant="h4" fontWeight={700}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {stat.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        {t('admin.recentOrders')}
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>{t('checkout.customerName')}</TableCell>
              <TableCell>{t('common.total')}</TableCell>
              <TableCell>{t('admin.orderStatus')}</TableCell>
              <TableCell>{t('admin.dashboard')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.recentOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>₪{order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={t(`admin.status.${order.status}`)}
                    color={statusColor[order.status] || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString('he-IL')}</TableCell>
              </TableRow>
            ))}
            {data.recentOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {t('common.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
