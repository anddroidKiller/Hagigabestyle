import { useEffect, useMemo, useState } from 'react';
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
  const [activeImage, setActiveImage] = useState<string | null>(null);
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
      .then((p) => {
        setProduct(p);
        setActiveImage(p.imageUrl || p.images?.[0] || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const galleryImages = useMemo(() => {
    if (!product) return [] as string[];
    const list: string[] = [];
    if (product.imageUrl) list.push(product.imageUrl);
    (product.images || []).forEach((u) => {
      if (u && !list.includes(u)) list.push(u);
    });
    return list;
  }, [product]);

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
              backgroundImage: activeImage ? `url(${activeImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!activeImage && (
              <Typography variant="h1" sx={{ opacity: 0.15 }}>🎉</Typography>
            )}
          </Box>

          {galleryImages.length > 1 && (
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mt: 1.5,
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': { height: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3 },
              }}
            >
              {galleryImages.map((url) => {
                const selected = url === activeImage;
                return (
                  <Box
                    key={url}
                    onClick={() => setActiveImage(url)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setActiveImage(url);
                    }}
                    sx={{
                      flexShrink: 0,
                      width: 72,
                      height: 72,
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: (theme) =>
                        selected
                          ? `2px solid ${theme.palette.primary.main}`
                          : `1px solid ${theme.palette.divider}`,
                      opacity: selected ? 1 : 0.85,
                      transition: 'opacity 120ms, transform 120ms',
                      '&:hover': { opacity: 1, transform: 'translateY(-1px)' },
                    }}
                  >
                    <img
                      src={url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
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

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              columnGap: 2,
              rowGap: 1.5,
              mt: 3,
            }}
          >
            <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
              ₪{product.price.toFixed(2)}
            </Typography>

            {cartQty > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 999,
                  px: 0.5,
                  py: 0.25,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                }}
              >
                <IconButton
                  onClick={handleDecrease}
                  sx={{
                    color: 'inherit',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                  }}
                  aria-label={t('common.removeFromCart')}
                >
                  <RemoveIcon />
                </IconButton>
                <Typography
                  sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700, fontSize: '1.125rem' }}
                >
                  {cartQty}
                </Typography>
                <IconButton
                  onClick={handleIncrease}
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
            )}
          </Box>

          {getDescription(product) && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              {getDescription(product)}
            </Typography>
          )}

          <Button
            variant={cartQty > 0 ? 'outlined' : 'contained'}
            size="large"
            fullWidth
            startIcon={<ShoppingCartIcon />}
            onClick={handleAddToCart}
            disabled={outOfStock}
            sx={{ mt: 4, minHeight: 56 }}
          >
            {outOfStock
              ? t('product.outOfStock')
              : cartQty > 0
                ? t('product.addAnother')
                : t('common.addToCart')}
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
}
