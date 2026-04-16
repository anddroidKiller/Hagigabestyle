import { Box, Typography, useTheme } from '@mui/material';
import { keyframes } from '@mui/system';
import { useTranslation } from 'react-i18next';

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const pulseRing = keyframes`
  0% { transform: scale(0.9); opacity: 0.6; }
  70%  { transform: scale(1.3); opacity: 0; }
  100% { transform: scale(1.3); opacity: 0; }
`;

export default function MaintenancePage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primaryDark = theme.palette.primary.dark;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        position: 'relative',
        overflow: 'hidden',
        background: `
          radial-gradient(circle at 15% 10%, ${primary}22 0%, transparent 55%),
          radial-gradient(circle at 85% 85%, ${primaryDark}22 0%, transparent 55%),
          linear-gradient(135deg, #faf8f5 0%, #f3ede2 100%)
        `,
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: -120,
          insetInlineStart: -120,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${primary}33, transparent 70%)`,
          filter: 'blur(10px)',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          bottom: -140,
          insetInlineEnd: -140,
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${primaryDark}2d, transparent 70%)`,
          filter: 'blur(14px)',
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          maxWidth: 620,
          width: '100%',
          px: { xs: 3, sm: 5 },
          py: { xs: 5, sm: 7 },
          borderRadius: 6,
          backgroundColor: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 24px 60px -20px rgba(165, 125, 63, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: { xs: '100%', sm: 460 },
            maxWidth: '100%',
            aspectRatio: '16 / 9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `${float} 3.8s ease-in-out infinite`,
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: -8,
              borderRadius: 5,
              border: `2px solid ${primary}`,
              animation: `${pulseRing} 2.6s ease-out infinite`,
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: -10,
              borderRadius: 5,
              background: `conic-gradient(from 0deg, ${primary}, ${primaryDark}, ${primary})`,
              filter: 'blur(18px)',
              opacity: 0.5,
            }}
          />
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              borderRadius: 4,
              padding: '4px',
              background: `linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%)`,
              boxShadow: `0 18px 40px -10px ${primary}80, inset 0 -6px 14px rgba(0,0,0,0.12)`,
            }}
          >
            <Box
              component="img"
              src="/hero-banner.png"
              alt={t('common.appName')}
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: 3.5,
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                backgroundColor: '#faf5eb',
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Typography
            sx={{
              fontFamily: 'Rubik, sans-serif',
              fontWeight: 700,
              fontSize: { xs: 22, sm: 26 },
              color: 'secondary.main',
              letterSpacing: 1.2,
            }}
          >
            {t('common.appName')}
          </Typography>
          <Box
            sx={{
              height: 3,
              width: 48,
              borderRadius: 2,
              background: `linear-gradient(90deg, transparent, ${primary}, transparent)`,
            }}
          />
        </Box>

        <Typography
          component="h1"
          sx={{
            fontFamily: 'Rubik, sans-serif',
            fontWeight: 800,
            fontSize: { xs: 38, sm: 52, md: 58 },
            lineHeight: 1.1,
            backgroundImage: `linear-gradient(90deg, ${primaryDark} 0%, ${primary} 45%, ${primaryDark} 80%)`,
            backgroundSize: '200% auto',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: `${shimmer} 6s linear infinite`,
          }}
        >
          {t('maintenance.title')}
        </Typography>

        <Typography
          sx={{
            fontFamily: 'Rubik, sans-serif',
            fontSize: { xs: 16, sm: 18 },
            color: 'text.secondary',
            maxWidth: 460,
            lineHeight: 1.7,
          }}
        >
          {t('maintenance.subtitle')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: primary,
                animation: `${float} 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.18}s`,
                opacity: 0.85,
              }}
            />
          ))}
        </Box>

        <Typography
          sx={{
            fontFamily: 'Rubik, sans-serif',
            fontSize: 14,
            color: 'text.secondary',
            opacity: 0.75,
            letterSpacing: 0.3,
          }}
        >
          {t('maintenance.footer')}
        </Typography>
      </Box>
    </Box>
  );
}
