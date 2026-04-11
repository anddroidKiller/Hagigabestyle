import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container, Typography, Box, Button, IconButton, Divider, Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useCartStore } from '../store/cartStore';
import { useLocalized } from '../hooks/useLocalized';

export default function CartPage() {
  const { t } = useTranslation();
  const { getName } = useLocalized();
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <ShoppingCartIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.3 }} />
        <Typography variant="h5" sx={{ mt: 2 }}>
          {t('cart.empty')}
        </Typography>
        <Button
          component={Link}
          to="/categories"
          variant="contained"
          sx={{ mt: 3 }}
        >
          {t('cart.continueShopping')}
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
        {t('cart.title')}
      </Typography>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        {items.map((item, index) => (
          <Box key={item.id}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 2,
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  bgcolor: 'grey.100',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : 'none',
                  backgroundSize: 'cover',
                }}
              >
                {!item.imageUrl && <Typography sx={{ opacity: 0.3 }}>🎉</Typography>}
              </Box>

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ fontWeight: 600 }}>
                  {getName(item)}
                </Typography>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                  ₪{item.price.toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ px: 1, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>
                  {item.quantity}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>

              <Typography sx={{ minWidth: 80, textAlign: 'end', fontWeight: 700 }}>
                ₪{(item.price * item.quantity).toFixed(2)}
              </Typography>

              <IconButton color="error" onClick={() => removeItem(item.id)} size="small">
                <DeleteIcon />
              </IconButton>
            </Box>
            {index < items.length - 1 && <Divider />}
          </Box>
        ))}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {t('cart.subtotal')}:
          </Typography>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
            ₪{totalPrice().toFixed(2)}
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button component={Link} to="/categories" variant="outlined">
            {t('cart.continueShopping')}
          </Button>
          <Button variant="outlined" color="error" onClick={clearCart}>
            {t('cart.clearCart')}
          </Button>
        </Box>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/checkout')}
          sx={{ minHeight: 48 }}
        >
          {t('cart.proceedToCheckout')}
        </Button>
      </Box>
    </Container>
  );
}
