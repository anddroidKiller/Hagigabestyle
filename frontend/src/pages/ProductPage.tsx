import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container, Typography, Grid, Box, Button, Breadcrumbs, Chip, CircularProgress,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { productsApi, ProductDto } from '../services/api';
import { useLocalized } from '../hooks/useLocalized';
import { useCartStore } from '../store/cartStore';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { getName, getDescription, getCategoryName } = useLocalized();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartItem = useCartStore((s) =>
    product ? s.items.find((i) => i.productId === product.id) : undefined,
  );
  const cartQty = cartItem?.quantity ?? 0;
  const cartLineId = cartItem?.id;

  useEffect(() => {
    if (!id) return;
    productsApi.getById(parseInt(id))
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!product) {
    return (
      <Container sx={{ py: 10, textAlign: 'center' }}>
        <Typography>{t('common.noResults')}</Typography>
      </Container>
    );
  }

  const outOfStock = product.stockQuantity <= 0;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      nameHe: product.nameHe,
      nameEn: product.nameEn,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
    });
  };

  const handleIncrease = () => {
    if (cartLineId) updateQuantity(cartLineId, cartQty + 1);
  };

  const handleDecrease = () => {
    if (cartLineId) updateQuantity(cartLineId, cartQty - 1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Typography component={Link} to="/" color="inherit" sx={{ textDecoration: 'none' }}>
          {t('common.home')}
        </Typography>
        <Typography
          component={Link}
          to={`/category/${product.categoryId}`}
          color="inherit"
          sx={{ textDecoration: 'none' }}
        >
          {getCategoryName(product)}
        </Typography>
        <Typography color="text.primary">{getName(product)}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              height: { xs: 300, md: 400 },
              bgcolor: 'grey.100',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!product.imageUrl && (
              <Typography variant="h1" sx={{ opacity: 0.15 }}>🎉</Typography>
            )}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {getName(product)}
          </Typography>

          <Chip
            label={product.stockQuantity > 0 ? t('product.inStock') : t('product.outOfStock')}
            color={product.stockQuantity > 0 ? 'success' : 'error'}
            size="small"
            sx={{ mt: 1 }}
          />

          <Typography variant="h3" color="primary" sx={{ mt: 3, fontWeight: 700 }}>
            ₪{product.price.toFixed(2)}
          </Typography>

          {getDescription(product) && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              {getDescription(product)}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4 }}>
            {cartQty > 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  minHeight: 56,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 2,
                  px: 1,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                <IconButton
                  onClick={handleDecrease}
                  size="large"
                  sx={{
                    color: 'inherit',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                  }}
                  aria-label={t('common.removeFromCart')}
                >
                  <RemoveIcon />
                </IconButton>
                <Typography sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
                  {cartQty} {t('product.inCart')}
                </Typography>
                <IconButton
                  onClick={handleIncrease}
                  size="large"
                  disabled={outOfStock}
                  sx={{
                    color: 'inherit',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                    '&.Mui-disabled': { color: 'rgba(255,255,255,0.5)' },
                  }}
                  aria-label={t('common.addToCart')}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            ) : (
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCartIcon />}
                onClick={handleAddToCart}
                disabled={outOfStock}
                sx={{ flexGrow: 1, minHeight: 56 }}
              >
                {outOfStock ? t('product.outOfStock') : t('common.addToCart')}
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
