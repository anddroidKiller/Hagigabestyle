import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography, Box, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, TextField,
} from '@mui/material';
import { adminApi, OrderDto } from '../../services/api';

const STATUSES = ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [newStatus, setNewStatus] = useState('');

  const load = () => { adminApi.getOrders().then(setOrders); };
  useEffect(() => { load(); }, []);

  const openStatusDialog = (order: OrderDto) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (selectedOrder) {
      await adminApi.updateOrderStatus(selectedOrder.id, newStatus);
      setDialogOpen(false);
      load();
    }
  };

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
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        {t('admin.manageOrders')}
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>{t('checkout.customerName')}</TableCell>
              <TableCell>{t('checkout.customerPhone')}</TableCell>
              <TableCell>{t('common.total')}</TableCell>
              <TableCell>{t('admin.orderStatus')}</TableCell>
              <TableCell>{t('checkout.city')}</TableCell>
              <TableCell>תאריך</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id} hover sx={{ cursor: 'pointer' }} onClick={() => openStatusDialog(o)}>
                <TableCell>{o.id}</TableCell>
                <TableCell>{o.customerName}</TableCell>
                <TableCell>{o.customerPhone}</TableCell>
                <TableCell>₪{o.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={t(`admin.status.${o.status}`)}
                    color={statusColor[o.status] || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{o.city || '-'}</TableCell>
                <TableCell>{new Date(o.createdAt).toLocaleDateString('he-IL')}</TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">{t('common.noResults')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>הזמנה #{selectedOrder?.id}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 1 }}>
              <Typography><strong>{t('checkout.customerName')}:</strong> {selectedOrder.customerName}</Typography>
              <Typography><strong>{t('checkout.customerPhone')}:</strong> {selectedOrder.customerPhone}</Typography>
              {selectedOrder.customerEmail && <Typography><strong>{t('checkout.customerEmail')}:</strong> {selectedOrder.customerEmail}</Typography>}
              {selectedOrder.shippingAddress && <Typography><strong>{t('checkout.shippingAddress')}:</strong> {selectedOrder.shippingAddress}</Typography>}
              {selectedOrder.notes && <Typography><strong>{t('checkout.notes')}:</strong> {selectedOrder.notes}</Typography>}

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>{t('package.items')}:</Typography>
              {selectedOrder.items.map((item, i) => (
                <Typography key={i} variant="body2">
                  {item.nameHe} x{item.quantity} - ₪{(item.unitPrice * item.quantity).toFixed(2)}
                </Typography>
              ))}
              <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                {t('common.total')}: ₪{selectedOrder.totalAmount.toFixed(2)}
              </Typography>

              <TextField
                select fullWidth label={t('admin.orderStatus')} value={newStatus}
                onChange={e => setNewStatus(e.target.value)} sx={{ mt: 3 }}
              >
                {STATUSES.map(s => <MenuItem key={s} value={s}>{t(`admin.status.${s}`)}</MenuItem>)}
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleUpdateStatus} variant="contained">{t('common.save')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
