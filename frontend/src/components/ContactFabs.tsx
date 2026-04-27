import { Fab, Stack, Tooltip } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../store/cartStore';

const PHONE_DISPLAY = '055-660-8856';
const PHONE_INTL = '972556608856';
const EMAIL = 'service@hagigabestyle.co.il';

export default function ContactFabs() {
  const { t } = useTranslation();
  const totalItems = useCartStore((s) => s.totalItems());

  const mobileBottom = totalItems > 0 ? 80 : 24;

  return (
    <Stack
      spacing={1.5}
      sx={{
        position: 'fixed',
        bottom: { xs: mobileBottom, md: 24 },
        insetInlineEnd: { xs: 16, md: 24 },
        zIndex: (theme) => theme.zIndex.speedDial,
      }}
    >
      <Tooltip title={t('contact.whatsapp')} placement="left">
        <Fab
          component="a"
          href={`https://wa.me/${PHONE_INTL}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('contact.whatsapp')}
          sx={{
            bgcolor: '#25D366',
            color: '#fff',
            '&:hover': { bgcolor: '#1ebe57' },
          }}
        >
          <WhatsAppIcon />
        </Fab>
      </Tooltip>

      <Tooltip title={t('contact.call')} placement="left">
        <Fab
          color="primary"
          component="a"
          href={`tel:${PHONE_DISPLAY}`}
          aria-label={t('contact.call')}
        >
          <PhoneIcon />
        </Fab>
      </Tooltip>

      <Tooltip title={t('contact.email')} placement="left">
        <Fab
          component="a"
          href={`mailto:${EMAIL}`}
          aria-label={t('contact.email')}
          sx={{
            bgcolor: '#2c2c2c',
            color: '#fff',
            '&:hover': { bgcolor: '#1a1a1a' },
          }}
        >
          <EmailIcon />
        </Fab>
      </Tooltip>
    </Stack>
  );
}
