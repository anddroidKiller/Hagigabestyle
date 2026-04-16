import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography, Box, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, TextField,
  IconButton, Tooltip, Divider, Collapse, CircularProgress, Snackbar, Alert,
  ToggleButton, ToggleButtonGroup, Autocomplete,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DescriptionIcon from '@mui/icons-material/Description';
import HistoryIcon from '@mui/icons-material/History';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { adminApi, OrderDto, OrderStatusHistoryDto, ProductDto, ShippingMethod } from '../../services/api';

interface EditItem {
  productId?: number;
  packageId?: number;
  nameHe: string;
  nameEn: string;
  quantity: number;
  unitPrice: number;
}

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
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<OrderStatusHistoryDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; severity: 'success' | 'error'; message: string }>({
    open: false,
    severity: 'success',
    message: '',
  });

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editShippingMethod, setEditShippingMethod] = useState<ShippingMethod>('Delivery');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [productToAdd, setProductToAdd] = useState<ProductDto | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const load = () => { adminApi.getOrders().then(setOrders); };
  useEffect(() => { load(); }, []);

  const openStatusDialog = (order: OrderDto) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setDialogOpen(true);
    setHistoryOpen(false);
    setHistory([]);
    setEditMode(false);
  };

  const openEditMode = async () => {
    if (!selectedOrder) return;
    setEditShippingMethod(selectedOrder.shippingMethod || 'Delivery');
    setEditAddress(selectedOrder.shippingAddress || '');
    setEditCity(selectedOrder.city || '');
    setEditNotes(selectedOrder.notes || '');
    setEditItems(
      selectedOrder.items.map((it) => ({
        productId: it.productId,
        packageId: it.packageId,
        nameHe: it.nameHe,
        nameEn: it.nameEn,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      }))
    );
    setProductToAdd(null);
    setEditMode(true);
    if (products.length === 0) {
      try {
        setProducts(await adminApi.getProducts());
      } catch {
        // Leave products empty; user can still edit quantities
      }
    }
  };

  const cancelEditMode = () => {
    setEditMode(false);
  };

  const changeItemQty = (index: number, delta: number) => {
    setEditItems((prev) => {
      const next = [...prev];
      const newQty = next[index].quantity + delta;
      if (newQty <= 0) {
        next.splice(index, 1);
      } else {
        next[index] = { ...next[index], quantity: newQty };
      }
      return next;
    });
  };

  const removeItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addProductItem = () => {
    if (!productToAdd) return;
    setEditItems((prev) => {
      const existing = prev.findIndex((it) => it.productId === productToAdd.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], quantity: next[existing].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          productId: productToAdd.id,
          packageId: undefined,
          nameHe: productToAdd.nameHe,
          nameEn: productToAdd.nameEn,
          quantity: 1,
          unitPrice: productToAdd.price,
        },
      ];
    });
    setProductToAdd(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;
    if (editItems.length === 0) {
      setSnack({ open: true, severity: 'error', message: t('admin.orderMustHaveItems') });
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await adminApi.updateOrder(selectedOrder.id, {
        shippingMethod: editShippingMethod,
        shippingAddress: editShippingMethod === 'Pickup' ? undefined : editAddress,
        city: editShippingMethod === 'Pickup' ? undefined : editCity,
        notes: editNotes || undefined,
        items: editItems.map((it) => ({
          productId: it.productId,
          packageId: it.packageId,
          quantity: it.quantity,
        })),
      });
      setSelectedOrder(updated);
      setEditMode(false);
      setSnack({ open: true, severity: 'success', message: t('admin.orderUpdated') });
      load();
    } catch {
      setSnack({ open: true, severity: 'error', message: t('common.error') });
    } finally {
      setSavingEdit(false);
    }
  };

  const editTotal = editItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await adminApi.updateOrderStatus(selectedOrder.id, newStatus);
      setSnack({ open: true, severity: 'success', message: t('admin.statusSaved') });
      setDialogOpen(false);
      load();
    } catch {
      setSnack({ open: true, severity: 'error', message: t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  const toggleHistory = async () => {
    if (!selectedOrder) return;
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next && history.length === 0) {
      setHistoryLoading(true);
      try {
        const data = await adminApi.getOrderHistory(selectedOrder.id);
        setHistory(data);
      } catch {
        setSnack({ open: true, severity: 'error', message: t('common.error') });
      } finally {
        setHistoryLoading(false);
      }
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const locale = i18n.language === 'he' ? 'he-IL' : 'en-US';
    return d.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <span>הזמנה #{selectedOrder?.id}{editMode ? ` — ${t('admin.editOrder')}` : ''}</span>
          <Box>
            {!editMode && (
              <>
                <Tooltip title={t('admin.editOrder')}>
                  <IconButton onClick={openEditMode} color="primary"><EditIcon /></IconButton>
                </Tooltip>
                <Tooltip title={t('admin.statusHistory')}>
                  <IconButton
                    onClick={toggleHistory}
                    color={historyOpen ? 'primary' : 'default'}
                    sx={historyOpen ? { backgroundColor: 'primary.light', color: 'primary.contrastText' } : {}}
                  >
                    <HistoryIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('admin.printOrder')}>
                  <IconButton onClick={handlePrint} color="primary"><PrintIcon /></IconButton>
                </Tooltip>
                <Tooltip title={t('admin.downloadReceipt')}>
                  <IconButton onClick={handleDownloadReceipt} color="success"><ReceiptIcon /></IconButton>
                </Tooltip>
                <Tooltip title={t('admin.downloadInvoice')}>
                  <IconButton onClick={handleDownloadInvoice} color="info"><DescriptionIcon /></IconButton>
                </Tooltip>
              </>
            )}
            {editMode && (
              <Tooltip title={t('common.cancel')}>
                <IconButton onClick={cancelEditMode}><CloseIcon /></IconButton>
              </Tooltip>
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && !editMode && (
            <Box sx={{ mt: 1 }} ref={printRef}>
              <Typography><strong>{t('checkout.customerName')}:</strong> {selectedOrder.customerName}</Typography>
              <Typography><strong>{t('checkout.customerPhone')}:</strong> {selectedOrder.customerPhone}</Typography>
              {selectedOrder.customerEmail && <Typography><strong>{t('checkout.customerEmail')}:</strong> {selectedOrder.customerEmail}</Typography>}
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                <strong>{t('checkout.shippingMethod')}:</strong>
                <Chip
                  icon={selectedOrder.shippingMethod === 'Pickup' ? <StorefrontIcon /> : <LocalShippingIcon />}
                  label={selectedOrder.shippingMethod === 'Pickup' ? t('checkout.pickup') : t('checkout.delivery')}
                  size="small"
                  color={selectedOrder.shippingMethod === 'Pickup' ? 'secondary' : 'primary'}
                  variant="outlined"
                />
              </Typography>
              {selectedOrder.shippingAddress && <Typography><strong>{t('checkout.shippingAddress')}:</strong> {selectedOrder.shippingAddress}{selectedOrder.city ? `, ${selectedOrder.city}` : ''}</Typography>}
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

              <Collapse in={historyOpen} timeout="auto" unmountOnExit>
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.default',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <HistoryIcon color="primary" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {t('admin.statusHistory')}
                    </Typography>
                  </Box>

                  {historyLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : history.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      {t('admin.noHistory')}
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {history.map((h, idx) => (
                        <Box
                          key={h.id}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.75,
                            p: 1.5,
                            borderRadius: 1.5,
                            backgroundColor: 'background.paper',
                            borderInlineStart: '3px solid',
                            borderInlineStartColor: idx === 0 ? 'primary.main' : 'divider',
                            boxShadow: idx === 0 ? 2 : 0,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={t(`admin.status.${h.oldStatus}`)}
                              size="small"
                              color={statusColor[h.oldStatus] || 'default'}
                              variant="outlined"
                            />
                            <ArrowForwardIcon
                              fontSize="small"
                              sx={{
                                color: 'text.secondary',
                                transform: i18n.language === 'he' ? 'scaleX(-1)' : 'none',
                              }}
                            />
                            <Chip
                              label={t(`admin.status.${h.newStatus}`)}
                              size="small"
                              color={statusColor[h.newStatus] || 'default'}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {h.changedByFullName || h.changedByUsername}
                                {h.changedByUsername && h.changedByFullName && (
                                  <Box component="span" sx={{ opacity: 0.6, ml: 0.5 }}>
                                    ({h.changedByUsername})
                                  </Box>
                                )}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(h.changedAt)}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Box>
          )}

          {selectedOrder && editMode && (
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  {t('checkout.shippingMethod')}
                </Typography>
                <ToggleButtonGroup
                  value={editShippingMethod}
                  exclusive
                  onChange={(_, v) => v && setEditShippingMethod(v)}
                  fullWidth
                  color="primary"
                  size="small"
                >
                  <ToggleButton value="Delivery" sx={{ gap: 1, py: 1 }}>
                    <LocalShippingIcon fontSize="small" />
                    {t('checkout.delivery')}
                  </ToggleButton>
                  <ToggleButton value="Pickup" sx={{ gap: 1, py: 1 }}>
                    <StorefrontIcon fontSize="small" />
                    {t('checkout.pickup')}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {editShippingMethod === 'Delivery' ? (
                <>
                  <TextField
                    label={t('checkout.shippingAddress')}
                    fullWidth
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                  <TextField
                    label={t('checkout.city')}
                    fullWidth
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                  />
                </>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <StorefrontIcon />
                  <Typography variant="body2">
                    {t('checkout.pickupAtStore')} — {t('store.address')}
                  </Typography>
                </Paper>
              )}

              <TextField
                label={t('checkout.notes')}
                fullWidth
                multiline
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  {t('package.items')}
                </Typography>

                {editItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    {t('admin.orderMustHaveItems')}
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {editItems.map((item, idx) => (
                      <Paper
                        key={idx}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Box sx={{ flexGrow: 1, minWidth: 160 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.nameHe}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ₪{item.unitPrice.toFixed(2)} × {item.quantity} = ₪{(item.unitPrice * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => changeItemQty(idx, -1)}
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => changeItemQty(idx, 1)}
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => removeItem(idx)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 2, alignItems: 'center' }}>
                  <Autocomplete
                    sx={{ flexGrow: 1 }}
                    size="small"
                    options={products}
                    value={productToAdd}
                    onChange={(_, v) => setProductToAdd(v)}
                    getOptionLabel={(o) => `${o.nameHe} — ₪${o.price.toFixed(2)}`}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    renderInput={(params) => <TextField {...params} label={t('admin.addProduct')} />}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    disabled={!productToAdd}
                    onClick={addProductItem}
                  >
                    {t('common.create')}
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t('common.total')}:
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                    ₪{editTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {editMode ? (
            <>
              <Button onClick={cancelEditMode} disabled={savingEdit}>{t('common.cancel')}</Button>
              <Button onClick={handleSaveEdit} variant="contained" disabled={savingEdit}>
                {savingEdit ? t('checkout.processing') : t('common.save')}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setDialogOpen(false)} disabled={saving}>{t('common.cancel')}</Button>
              <Button onClick={handleUpdateStatus} variant="contained" disabled={saving}>
                {saving ? t('checkout.processing') : t('common.save')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

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
    </>
  );
}
