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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
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
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {pkg.items.length} {t('package.items')}
        </Typography>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        {cartQty > 0 ? (
          <Box
            onClick={stopPropagation}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              minHeight: 44,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 1,
              px: 0.5,
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
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
              {cartQty} {t('product.inCart')}
            </Typography>
            <IconButton
              onClick={handleIncrease}
              sx={{
                color: 'inherit',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
              }}
              aria-label={t('common.addToCart')}
            >
              <AddIcon />
            </IconButton>
          </Box>
        ) : (
          <Button
            variant="contained"
            size="small"
            fullWidth
            startIcon={<ShoppingCartIcon />}
            onClick={handleAddToCart}
            sx={{ minHeight: 44 }}
          >
            {t('common.addToCart')}
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
