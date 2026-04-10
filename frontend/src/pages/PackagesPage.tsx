import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Grid, CircularProgress, Box } from '@mui/material';
import { packagesApi, PackageDto } from '../services/api';
import PackageCard from '../components/PackageCard';

export default function PackagesPage() {
  const { t } = useTranslation();
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    packagesApi.getAll().then(setPackages).finally(() => setLoading(false));
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
        {t('common.packages')}
      </Typography>

      {packages.length === 0 ? (
        <Typography color="text.secondary">{t('common.noResults')}</Typography>
      ) : (
        <Grid container spacing={3}>
          {packages.map((pkg) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pkg.id}>
              <PackageCard pkg={pkg} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
