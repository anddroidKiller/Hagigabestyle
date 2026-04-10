import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container, Typography, Grid, Box, Button, Breadcrumbs, Chip, CircularProgress,
  List, ListItem, ListItemText, Divider,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { packagesApi, PackageDto } from '../services/api';
import { useLocalized } from '../hooks/useLocalized';
import { useCartStore } from '../store/cartStore';

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { getName, getDescription, getProductName } = useLocalized();
  const [pkg, setPkg] = useState<PackageDto | null>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!id) return;
    packagesApi.getById(parseInt(id))
      .then(setPkg)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!pkg) {
    return (
      <Container sx={{ py: 10, textAlign: 'center' }}>
        <Typography>{t('common.noResults')}</Typography>
      </Container>
    );
  }

  const handleAddToCart = () => {
    addItem({
      packageId: pkg.id,
      nameHe: pkg.nameHe,
      nameEn: pkg.nameEn,
      price: pkg.price,
      quantity: 1,
      imageUrl: pkg.imageUrl,
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Typography component={Link} to="/" color="inherit" sx={{ textDecoration: 'none' }}>
          {t('common.home')}
        </Typography>
        <Typography component={Link} to="/packages" color="inherit" sx={{ textDecoration: 'none' }}>
          {t('common.packages')}
        </Typography>
        <Typography color="text.primary">{getName(pkg)}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              height: { xs: 300, md: 400 },
              bgcolor: 'primary.light',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: pkg.imageUrl ? `url(${pkg.imageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!pkg.imageUrl && (
              <Typography variant="h1" sx={{ opacity: 0.15 }}>🎁</Typography>
            )}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h4" fontWeight={700}>
            {getName(pkg)}
          </Typography>

          {pkg.discount > 0 && (
            <Chip
              icon={<LocalOfferIcon />}
              label={`${pkg.discount}% ${t('package.discount')}`}
              color="error"
              sx={{ mt: 1 }}
            />
          )}

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mt: 3 }}>
            <Typography variant="h3" color="primary" fontWeight={700}>
              ₪{pkg.price.toFixed(2)}
            </Typography>
            {pkg.originalPrice > pkg.price && (
              <Typography variant="h5" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                ₪{pkg.originalPrice.toFixed(2)}
              </Typography>
            )}
          </Box>

          {getDescription(pkg) && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              {getDescription(pkg)}
            </Typography>
          )}

          <Typography variant="h6" fontWeight={600} sx={{ mt: 4, mb: 1 }}>
            {t('package.includes')}:
          </Typography>
          <List dense>
            {pkg.items.map((item, i) => (
              <Box key={i}>
                <ListItem>
                  <ListItemText
                    primary={`${getProductName(item)} x${item.quantity}`}
                  />
                </ListItem>
                {i < pkg.items.length - 1 && <Divider />}
              </Box>
            ))}
          </List>

          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<ShoppingCartIcon />}
            onClick={handleAddToCart}
            sx={{ mt: 3, minHeight: 52 }}
          >
            {t('common.addToCart')}
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
}
