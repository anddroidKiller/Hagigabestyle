import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardMedia, CardContent, CardActions, Typography, Button, Box } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { ProductDto } from '../services/api';
import { useLocalized } from '../hooks/useLocalized';
import { useCartStore } from '../store/cartStore';

interface Props {
  product: ProductDto;
}

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

  return (
    <Card
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
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
        }}
      >
        {!product.imageUrl && (
          <Typography variant="h3" sx={{ opacity: 0.2 }}>
            🎉
          </Typography>
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
