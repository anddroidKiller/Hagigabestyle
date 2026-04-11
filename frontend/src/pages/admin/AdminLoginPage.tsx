import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container, Typography, TextField, Button, Paper, Alert, Box } from '@mui/material';
import { adminApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await adminApi.login(username, password);
      login(result.token, result.fullName);
      navigate('/admin/dashboard');
    } catch {
      setError('שם משתמש או סיסמה שגויים');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 10 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" align="center" sx={{ mb: 3, fontWeight: 700 }}>
          {t('common.admin')} - {t('common.login')}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="שם משתמש"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <TextField
              label="סיסמה"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ mt: 1 }}
            >
              {loading ? t('common.loading') : t('common.login')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}
