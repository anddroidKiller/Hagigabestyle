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
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

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

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      nameHe: product.nameHe,
      nameEn: product.nameEn,
      price: product.price,
      quantity,
      imageUrl: product.imageUrl,
    });
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
          <Typography variant="h4" fontWeight={700}>
            {getName(product)}
          </Typography>

          <Chip
            label={product.stockQuantity > 0 ? t('product.inStock') : t('product.outOfStock')}
            color={product.stockQuantity > 0 ? 'success' : 'error'}
            size="small"
            sx={{ mt: 1 }}
          />

          <Typography variant="h3" color="primary" fontWeight={700} sx={{ mt: 3 }}>
            ₪{product.price.toFixed(2)}
          </Typography>

          {getDescription(product) && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              {getDescription(product)}
            </Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <IconButton onClick={() => setQuantity(Math.max(1, quantity - 1))} size="small">
                <RemoveIcon />
              </IconButton>
              <Typography sx={{ px: 2, fontWeight: 600 }}>{quantity}</Typography>
              <IconButton onClick={() => setQuantity(quantity + 1)} size="small">
                <AddIcon />
              </IconButton>
            </Box>

            <Button
              variant="contained"
              size="large"
              startIcon={<ShoppingCartIcon />}
              onClick={handleAddToCart}
              disabled={product.stockQuantity <= 0}
              sx={{ flexGrow: 1, minHeight: 48 }}
            >
              {t('common.addToCart')}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
