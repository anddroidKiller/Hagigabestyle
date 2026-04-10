import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container, Typography, Grid, Card, CardMedia, CardContent, CircularProgress, Box,
} from '@mui/material';
import { categoriesApi, CategoryDto } from '../services/api';
import { useLocalized } from '../hooks/useLocalized';

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { getName } = useLocalized();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
        {t('common.categories')}
      </Typography>

      <Grid container spacing={3}>
        {categories.map((cat) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={cat.id}>
            <Card
              component={Link}
              to={`/category/${cat.id}`}
              sx={{ textDecoration: 'none', textAlign: 'center', height: '100%' }}
            >
              <CardMedia
                component="div"
                sx={{
                  height: 160,
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundImage: cat.imageUrl ? `url(${cat.imageUrl})` : 'none',
                  backgroundSize: 'cover',
                }}
              >
                {!cat.imageUrl && (
                  <Typography variant="h2" sx={{ opacity: 0.3 }}>🎊</Typography>
                )}
              </CardMedia>
              <CardContent>
                <Typography variant="h6" fontWeight={600}>
                  {getName(cat)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {cat.productCount} {t('common.products')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
