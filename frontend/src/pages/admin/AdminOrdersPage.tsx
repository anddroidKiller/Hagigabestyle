import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography, Box, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, TextField,
  IconButton, Tooltip, Divider,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DescriptionIcon from '@mui/icons-material/Description';
import { adminApi, OrderDto } from '../../services/api';

const STATUSES = ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = () => {
    if (!printRef.current || !selectedOrder) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <title>הזמנה #${selectedOrder.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; direction: rtl; }
          h1 { color: #c9a54e; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background: #f5f0e0; }
          .total { font-size: 20px; font-weight: bold; color: #c9a54e; margin-top: 20px; }
          .info { margin: 5px 0; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <h1>חגיגה בסטייל</h1>
        <h2>הזמנה #${selectedOrder.id}</h2>
        <p class="info"><strong>שם:</strong> ${selectedOrder.customerName}</p>
        <p class="info"><strong>טלפון:</strong> ${selectedOrder.customerPhone}</p>
        ${selectedOrder.customerEmail ? `<p class="info"><strong>אימייל:</strong> ${selectedOrder.customerEmail}</p>` : ''}
        ${selectedOrder.shippingAddress ? `<p class="info"><strong>כתובת:</strong> ${selectedOrder.shippingAddress}, ${selectedOrder.city || ''}</p>` : ''}
        <p class="info"><strong>תאריך:</strong> ${new Date(selectedOrder.createdAt).toLocaleDateString('he-IL')}</p>
        <table>
          <thead><tr><th>פריט</th><th>כמות</th><th>מחיר יחידה</th><th>סה"כ</th></tr></thead>
          <tbody>
            ${selectedOrder.items.map(item => `
              <tr>
                <td>${item.nameHe}</td>
                <td>${item.quantity}</td>
                <td>₪${item.unitPrice.toFixed(2)}</td>
                <td>₪${(item.unitPrice * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="total">סה"כ: ₪${selectedOrder.totalAmount.toFixed(2)}</p>
        ${selectedOrder.notes ? `<p><strong>הערות:</strong> ${selectedOrder.notes}</p>` : ''}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadReceipt = async () => {
    if (!selectedOrder) return;
    const blob = await adminApi.getOrderReceipt(selectedOrder.id);
    downloadBlob(blob, `receipt-${selectedOrder.id}.pdf`);
  };

  const handleDownloadInvoice = async () => {
    if (!selectedOrder) return;
    const blob = await adminApi.getOrderInvoice(selectedOrder.id);
    downloadBlob(blob, `invoice-${selectedOrder.id}.pdf`);
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
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
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
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>הזמנה #{selectedOrder?.id}</span>
          <Box>
            <Tooltip title={t('admin.printOrder')}>
              <IconButton onClick={handlePrint} color="primary"><PrintIcon /></IconButton>
            </Tooltip>
            <Tooltip title={t('admin.downloadReceipt')}>
              <IconButton onClick={handleDownloadReceipt} color="success"><ReceiptIcon /></IconButton>
            </Tooltip>
            <Tooltip title={t('admin.downloadInvoice')}>
              <IconButton onClick={handleDownloadInvoice} color="info"><DescriptionIcon /></IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 1 }} ref={printRef}>
              <Typography><strong>{t('checkout.customerName')}:</strong> {selectedOrder.customerName}</Typography>
              <Typography><strong>{t('checkout.customerPhone')}:</strong> {selectedOrder.customerPhone}</Typography>
              {selectedOrder.customerEmail && <Typography><strong>{t('checkout.customerEmail')}:</strong> {selectedOrder.customerEmail}</Typography>}
              {selectedOrder.shippingAddress && <Typography><strong>{t('checkout.shippingAddress')}:</strong> {selectedOrder.shippingAddress}</Typography>}
              {selectedOrder.notes && <Typography><strong>{t('checkout.notes')}:</strong> {selectedOrder.notes}</Typography>}

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mb: 1 }}>{t('package.items')}:</Typography>
              {selectedOrder.items.map((item, i) => (
                <Typography key={i} variant="body2">
                  {item.nameHe} x{item.quantity} - ₪{(item.unitPrice * item.quantity).toFixed(2)}
                </Typography>
              ))}
              <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                {t('common.total')}: ₪{selectedOrder.totalAmount.toFixed(2)}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <TextField
                select fullWidth label={t('admin.orderStatus')} value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
              >
                {STATUSES.map(s => <MenuItem key={s} value={s}>{t(`admin.status.${s}`)}</MenuItem>)}
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleUpdateStatus} variant="contained">{t('common.save')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
