import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardMedia, CardContent, CardActions, Typography, Button, Box, Chip, IconButton } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { PackageDto } from '../services/api';
import { useLocalized } from '../hooks/useLocalized';
import { useCartStore } from '../store/cartStore';

interface Props {
  pkg: PackageDto;
}

export default function PackageCard({ pkg }: Props) {
  const { t } = useTranslation();
  const { getName } = useLocalized();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartItem = useCartStore((s) =>
    s.items.find((i) => i.packageId === pkg.id),
  );
  const cartQty = cartItem?.quantity ?? 0;
  const cartLineId = cartItem?.id;

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      packageId: pkg.id,
      nameHe: pkg.nameHe,
      nameEn: pkg.nameEn,
      price: pkg.price,
      quantity: 1,
      imageUrl: pkg.imageUrl,
    });
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartLineId) updateQuantity(cartLineId, cartQty + 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartLineId) updateQuantity(cartLineId, cartQty - 1);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        border: '2px solid',
        borderColor: 'primary.light',
      }}
      onClick={() => navigate(`/package/${pkg.id}`)}
    >
      <CardMedia
        component="div"
        sx={{
          height: 220,
          bgcolor: 'primary.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: pkg.imageUrl ? `url(${pkg.imageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {!pkg.imageUrl && (
          <Typography variant="h2" sx={{ opacity: 0.3 }}>
            🎁
          </Typography>
        )}
        {pkg.discount > 0 && (
          <Chip
            icon={<LocalOfferIcon />}
            label={`${pkg.discount}% ${t('package.discount')}`}
            color="error"
            size="small"
            sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700 }}
          />
        )}
      </CardMedia>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {getName(pkg)}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            columnGap: 1,
            rowGap: 0.75,
            mt: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
              ₪{pkg.price.toFixed(2)}
            </Typography>
            {pkg.originalPrice > pkg.price && (
              <Typography
                variant="body2"
                sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
              >
                ₪{pkg.originalPrice.toFixed(2)}
              </Typography>
            )}
          </Box>

          {cartQty > 0 && (
            <Box
              onClick={stopPropagation}
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderRadius: 999,
                px: 0.25,
                py: 0.25,
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                flexShrink: 0,
              }}
            >
              <IconButton
                size="small"
                onClick={handleDecrease}
                sx={{
                  color: 'inherit',
                  p: 0.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                }}
                aria-label={t('common.removeFromCart')}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography
                variant="body2"
                sx={{ minWidth: 22, textAlign: 'center', fontWeight: 700 }}
              >
                {cartQty}
              </Typography>
              <IconButton
                size="small"
                onClick={handleIncrease}
                sx={{
                  color: 'inherit',
                  p: 0.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                }}
                aria-label={t('common.addToCart')}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {pkg.items.length} {t('package.items')}
        </Typography>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          variant={cartQty > 0 ? 'outlined' : 'contained'}
          size="small"
          fullWidth
          startIcon={<ShoppingCartIcon />}
          onClick={handleAddToCart}
          sx={{ minHeight: 44 }}
        >
          {cartQty > 0 ? t('product.addAnother') : t('common.addToCart')}
        </Button>
      </CardActions>
    </Card>
  );
}
