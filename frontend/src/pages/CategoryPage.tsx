import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container, Typography, Grid, CircularProgress, Box, Breadcrumbs,
} from '@mui/material';
import { categoriesApi, productsApi, CategoryDto, ProductDto } from '../services/api';
import { useLocalized } from '../hooks/useLocalized';
import ProductCard from '../components/ProductCard';

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { getName } = useLocalized();
  const [category, setCategory] = useState<CategoryDto | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const catId = parseInt(id);
    Promise.all([categoriesApi.getById(catId), productsApi.getAll(catId)])
      .then(([cat, prods]) => {
        setCategory(cat);
        setProducts(prods);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Typography component={Link} to="/" color="inherit" sx={{ textDecoration: 'none' }}>
          {t('common.home')}
        </Typography>
        <Typography component={Link} to="/categories" color="inherit" sx={{ textDecoration: 'none' }}>
          {t('common.categories')}
        </Typography>
        <Typography color="text.primary">{category && getName(category)}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
        {category && getName(category)}
      </Typography>

      {products.length === 0 ? (
        <Typography color="text.secondary">{t('common.noResults')}</Typography>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={product.id}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
