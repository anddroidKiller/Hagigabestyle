import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card, CardMedia, CardContent, CardActions, Typography, Button, Box, Chip,
} from '@mui/material';
import { keyframes } from '@mui/system';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
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

  const isHot = product.isHot;

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
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
            ₪{product.price.toFixed(2)}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          variant="contained"
          size="small"
          fullWidth
          startIcon={<ShoppingCartIcon />}
          onClick={handleAddToCart}
          disabled={product.stockQuantity <= 0}
          sx={{ minHeight: 44 }}
        >
          {product.stockQuantity > 0 ? t('common.addToCart') : t('product.outOfStock')}
        </Button>
      </CardActions>
    </Card>
  );
}
