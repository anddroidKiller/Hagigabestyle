import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card, CardMedia, CardContent, CardActions, Typography, Button, Box, Chip, IconButton,
} from '@mui/material';
import { keyframes } from '@mui/system';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { ProductDto } from '../services/api';
import { useLocalized } from '../hooks/useLocalized';
import { useCartStore } from '../store/cartStore';

interface Props {
  product: ProductDto;
}

const hotPulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(247, 55, 74, 0.45), 0 0 18px 2px rgba(255, 107, 53, 0.35); }
  50%  { box-shadow: 0 0 0 6px rgba(247, 55, 74, 0.0),  0 0 26px 6px rgba(255, 107, 53, 0.55); }
  100% { box-shadow: 0 0 0 0 rgba(247, 55, 74, 0.0),  0 0 18px 2px rgba(255, 107, 53, 0.35); }
`;

export default function ProductCard({ product }: Props) {
  const { t } = useTranslation();
  const { getName } = useLocalized();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartItem = useCartStore((s) =>
    s.items.find((i) => i.productId === product.id),
  );
  const cartQty = cartItem?.quantity ?? 0;
  const cartLineId = cartItem?.id;

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      productId: product.id,
      nameHe: product.nameHe,
      nameEn: product.nameEn,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
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

  const isHot = product.isHot;
  const outOfStock = product.stockQuantity <= 0;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        transition: 'transform 0.2s ease',
        '&:hover': { transform: 'translateY(-2px)' },
        ...(isHot && {
          // True gradient border using the padding-box / border-box trick
          border: '3px solid transparent',
          backgroundImage:
            'linear-gradient(#fff, #fff), linear-gradient(135deg, #ff6b35 0%, #f7374a 50%, #ffb627 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          animation: `${hotPulse} 2.4s ease-in-out infinite`,
        }),
      }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <CardMedia
        component="div"
        sx={{
          height: 200,
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {!product.imageUrl && (
          <Typography variant="h3" sx={{ opacity: 0.2 }}>
            🎉
          </Typography>
        )}
        {isHot && (
          <Chip
            icon={<LocalFireDepartmentIcon sx={{ color: '#fff !important' }} />}
            label={t('product.hot')}
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              insetInlineStart: 10,
              background: 'linear-gradient(135deg, #ff6b35 0%, #f7374a 100%)',
              color: '#fff',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(247,55,74,0.45)',
              '& .MuiChip-icon': { ml: 0.5, mr: -0.25 },
            }}
          />
        )}
      </CardMedia>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
          {getName(product)}
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
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
            ₪{product.price.toFixed(2)}
          </Typography>

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
                disabled={outOfStock}
                sx={{
                  color: 'inherit',
                  p: 0.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
                  '&.Mui-disabled': { color: 'rgba(255,255,255,0.5)' },
                }}
                aria-label={t('common.addToCart')}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          variant={cartQty > 0 ? 'outlined' : 'contained'}
          size="small"
          fullWidth
          startIcon={<ShoppingCartIcon />}
          onClick={handleAddToCart}
          disabled={outOfStock}
          sx={{ minHeight: 44 }}
        >
          {outOfStock
            ? t('product.outOfStock')
            : cartQty > 0
              ? t('product.addAnother')
              : t('common.addToCart')}
        </Button>
      </CardActions>
    </Card>
  );
}
