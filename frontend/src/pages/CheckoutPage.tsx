import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import {
  Container, Typography, Box, Button, TextField, Paper, Divider, Alert, Grid,
} from '@mui/material';
import { useCartStore } from '../store/cartStore';
import { ordersApi, CreateOrderDto } from '../services/api';

interface FormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  city: string;
  notes: string;
}

export default function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCartStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  if (items.length === 0) {
    return <Navigate to="/cart" />;
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError('');

    try {
      const orderDto: CreateOrderDto = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || undefined,
        shippingAddress: data.shippingAddress || undefined,
        city: data.city || undefined,
        notes: data.notes || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          packageId: item.packageId,
          quantity: item.quantity,
        })),
      };

      const result = await ordersApi.create(orderDto);
      clearCart();

      if (result.paymentUrl) {
        navigate(`/order-confirmation/${result.orderId}`, {
          state: { paymentUrl: result.paymentUrl, totalAmount: result.totalAmount },
        });
      } else {
        navigate(`/order-confirmation/${result.orderId}`);
      }
    } catch {
      setError(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        {t('checkout.title')}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label={t('checkout.customerName')}
                  fullWidth
                  required
                  error={!!errors.customerName}
                  helperText={errors.customerName && t('checkout.required')}
                  {...register('customerName', { required: true })}
                />
                <TextField
                  label={t('checkout.customerPhone')}
                  fullWidth
                  required
                  error={!!errors.customerPhone}
                  helperText={errors.customerPhone && t('checkout.required')}
                  {...register('customerPhone', { required: true })}
                />
                <TextField
                  label={t('checkout.customerEmail')}
                  type="email"
                  fullWidth
                  {...register('customerEmail')}
                />
                <TextField
                  label={t('checkout.shippingAddress')}
                  fullWidth
                  {...register('shippingAddress')}
                />
                <TextField
                  label={t('checkout.city')}
                  fullWidth
                  {...register('city')}
                />
                <TextField
                  label={t('checkout.notes')}
                  fullWidth
                  multiline
                  rows={3}
                  {...register('notes')}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={submitting}
                  sx={{ mt: 1, minHeight: 52 }}
                >
                  {submitting ? t('checkout.processing') : t('checkout.placeOrder')}
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('cart.subtotal')}
            </Typography>
            {items.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  {item.nameHe} x{item.quantity}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ₪{(item.price * item.quantity).toFixed(2)}
                </Typography>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('common.total')}:
              </Typography>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                ₪{totalPrice().toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
