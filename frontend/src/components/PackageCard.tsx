import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardMedia, CardContent, CardActions, Typography, Button, Box, Chip } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
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
      </CardActions>
    </Card>
  );
}
