import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import {
  Container, Typography, Box, Button, TextField, Paper, Divider, Alert, Grid,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PhoneIcon from '@mui/icons-material/Phone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceIcon from '@mui/icons-material/Place';
import { useCartStore } from '../store/cartStore';
import { ordersApi, CreateOrderDto, ShippingMethod } from '../services/api';

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
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('Delivery');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  if (items.length === 0) {
    return <Navigate to="/cart" />;
  }

  const isPickup = shippingMethod === 'Pickup';

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError('');

    try {
      const orderDto: CreateOrderDto = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || undefined,
        shippingAddress: isPickup ? undefined : data.shippingAddress,
        city: isPickup ? undefined : data.city,
        shippingMethod,
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
                {/* Shipping method selector */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                    {t('checkout.shippingMethod')}
                  </Typography>
                  <ToggleButtonGroup
                    value={shippingMethod}
                    exclusive
                    onChange={(_, v) => v && setShippingMethod(v)}
                    fullWidth
                    color="primary"
                    sx={{
                      '& .MuiToggleButton-root': {
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        gap: 1,
                      },
                    }}
                  >
                    <ToggleButton value="Delivery">
                      <LocalShippingIcon />
                      {t('checkout.delivery')}
                    </ToggleButton>
                    <ToggleButton value="Pickup">
                      <StorefrontIcon />
                      {t('checkout.pickup')}
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

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
                  required
                  error={!!errors.customerEmail}
                  helperText={errors.customerEmail && t('checkout.required')}
                  {...register('customerEmail', { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })}
                />

                {isPickup ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'primary.light',
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorefrontIcon />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {t('checkout.pickupAtStore')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.95 }}>
                      <PlaceIcon fontSize="small" />
                      <Typography variant="body2">{t('store.address')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.95 }}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="body2">{t('store.hours')}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.95 }}>
                      <PhoneIcon fontSize="small" />
                      <Typography variant="body2">{t('store.phone')}</Typography>
                    </Box>
                  </Paper>
                ) : (
                  <>
                    <TextField
                      label={t('checkout.shippingAddress')}
                      fullWidth
                      required
                      error={!!errors.shippingAddress}
                      helperText={errors.shippingAddress && t('checkout.required')}
                      {...register('shippingAddress', { required: !isPickup })}
                    />
                    <TextField
                      label={t('checkout.city')}
                      fullWidth
                      required
                      error={!!errors.city}
                      helperText={errors.city && t('checkout.required')}
                      {...register('city', { required: !isPickup })}
                    />
                  </>
                )}

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
