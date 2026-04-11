import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container, Typography, Box, Button, Paper, CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ordersApi, OrderDto } from '../services/api';

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const location = useLocation();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);

  const state = location.state as { paymentUrl?: string; totalAmount?: number } | null;

  useEffect(() => {
    if (!id) return;
    ordersApi.getById(parseInt(id))
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (state?.paymentUrl) {
      const timer = setTimeout(() => {
        window.location.href = state.paymentUrl!;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
      <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />

      <Typography variant="h4" sx={{ mt: 2, fontWeight: 700 }}>
        {t('orderConfirmation.title')}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
        {t('orderConfirmation.thankYou')}
      </Typography>

      <Paper sx={{ p: 3, mt: 4, borderRadius: 3 }}>
        <Typography variant="h6">
          {t('orderConfirmation.orderNumber')}: <strong>#{id}</strong>
        </Typography>
        {order && (
          <Typography variant="h5" color="primary" sx={{ mt: 1, fontWeight: 700 }}>
            ₪{order.totalAmount.toFixed(2)}
          </Typography>
        )}
      </Paper>

      {state?.paymentUrl && (
        <Box sx={{ mt: 3 }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography variant="body1" color="text.secondary">
            {t('orderConfirmation.redirectingToPayment')}
          </Typography>
          <Button
            href={state.paymentUrl}
            variant="contained"
            size="large"
            sx={{ mt: 2 }}
          >
            {t('checkout.placeOrder')}
          </Button>
        </Box>
      )}

      <Button
        component={Link}
        to="/"
        variant="outlined"
        size="large"
        sx={{ mt: 4 }}
      >
        {t('orderConfirmation.backToHome')}
      </Button>
    </Container>
  );
}
