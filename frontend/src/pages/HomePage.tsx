import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Container, Typography, Button, Grid, Card, CardMedia, CardContent,
  CircularProgress,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { categoriesApi, packagesApi, productsApi, CategoryDto, PackageDto, ProductDto } from '../services/api';
import { useLocalized } from '../hooks/useLocalized';
import PackageCard from '../components/PackageCard';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { getName } = useLocalized();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [hotProducts, setHotProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      categoriesApi.getAll(),
      packagesApi.getAll(),
      productsApi.getHot(8).catch(() => [] as ProductDto[]),
    ])
      .then(([cats, pkgs, hot]) => {
        setCategories(cats);
        setPackages(pkgs);
        setHotProducts(hot);
      })
      .finally(() => setLoading(false));
  }, []);

  const ArrowIcon = i18n.language === 'he' ? ArrowBackIcon : ArrowForwardIcon;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {/* Hero Banner */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          bgcolor: '#faf5eb',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src="/hero-banner.png"
          alt={t('home.heroTitle')}
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', md: 1100 },
            height: 'auto',
            display: 'block',
          }}
        />
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* All Categories — horizontally scrollable */}
        <Box sx={{ mb: 8 }}>
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 3, sm: 4 },
              justifyContent: 'safe center',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollSnapType: 'x proximity',
              pb: 1.5,
              mx: { xs: -2, sm: 0 },
              px: { xs: 2, sm: 0 },
              '&::-webkit-scrollbar': { height: 8 },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'primary.light',
                borderRadius: 4,
                '&:hover': { bgcolor: 'primary.main' },
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'rgba(0,0,0,0.05)',
                borderRadius: 4,
              },
              scrollbarWidth: 'thin',
              scrollbarColor: (theme) =>
                `${theme.palette.primary.light} rgba(0,0,0,0.05)`,
            }}
          >
            {categories.map((cat) => (
              <Card
                key={cat.id}
                component={Link}
                to={`/category/${cat.id}`}
                sx={{
                  flexShrink: 0,
                  width: { xs: 150, sm: 180, md: 200 },
                  textDecoration: 'none',
                  textAlign: 'center',
                  scrollSnapAlign: 'start',
                }}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: 120,
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: cat.imageUrl ? `url(${cat.imageUrl})` : 'none',
                    backgroundSize: 'cover',
                  }}
                >
                  {!cat.imageUrl && (
                    <Typography variant="h3" sx={{ opacity: 0.3 }}>🎊</Typography>
                  )}
                </CardMedia>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {getName(cat)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cat.productCount} {t('common.products')}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Hot Products — sold more than 5 units in the last 30 days */}
        {hotProducts.length > 0 && (
          <Box
            sx={{
              mb: 8,
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              background:
                'linear-gradient(135deg, rgba(255,107,53,0.06) 0%, rgba(247,55,74,0.06) 100%)',
              border: '1px solid rgba(247,55,74,0.12)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1,
                mb: 3,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <LocalFireDepartmentIcon sx={{ color: '#f7374a', fontSize: 36 }} />
                  {t('home.hotProductsTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t('home.hotProductsSubtitle')}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {hotProducts.map((p) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={p.id}>
                  <ProductCard product={p} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Popular Packages */}
        {packages.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {t('home.popularPackages')}
              </Typography>
              <Button component={Link} to="/packages" endIcon={<ArrowIcon />}>
                {t('home.viewAll')}
              </Button>
            </Box>

            <Grid container spacing={3}>
              {packages.slice(0, 3).map((pkg) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pkg.id}>
                  <PackageCard pkg={pkg} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </>
  );
}
