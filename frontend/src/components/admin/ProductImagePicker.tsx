import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Button, IconButton, Stack, TextField, Typography, CircularProgress, Tooltip,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LinkIcon from '@mui/icons-material/Link';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import axios from 'axios';
import { adminApi } from '../../services/api';
import CameraCaptureDialog from './CameraCaptureDialog';

type Mode = 'main' | 'gallery';

interface ProductImagePickerProps {
  /** Current main image URL (only used when mode='main') */
  imageUrl?: string;
  onChangeImageUrl?: (url: string) => void;

  /** Current additional gallery images (only used when mode='gallery') */
  images?: string[];
  onChangeImages?: (images: string[]) => void;

  mode: Mode;

  onError?: (msg: string) => void;
}

/**
 * Reusable image picker for product admin form.
 * - main mode: replaces the single Image URL field with a file/camera picker + URL fallback.
 * - gallery mode: a tile grid where the admin can add/remove additional images.
 */
export default function ProductImagePicker({
  imageUrl,
  onChangeImageUrl,
  images,
  onChangeImages,
  mode,
  onError,
}: ProductImagePickerProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryFileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);
  const [cameraOpen, setCameraOpen] = useState<null | 'main' | 'gallery'>(null);

  const reportError = (msg: string) => {
    if (onError) onError(msg);
    else console.error(msg);
  };

  const uploadAndReturn = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      reportError(t('admin.uploadOnlyImages'));
      return null;
    }
    setUploading(true);
    try {
      return await adminApi.uploadImage(file);
    } catch (e) {
      let msg = t('admin.uploadFailed');
      if (axios.isAxiosError(e) && e.response?.data?.error) msg = e.response.data.error;
      reportError(msg);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleMainFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = await uploadAndReturn(file);
    if (url && onChangeImageUrl) onChangeImageUrl(url);
  };

  const handleGalleryFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !onChangeImages) return;
    const urls: string[] = [];
    for (const f of files) {
      const url = await uploadAndReturn(f);
      if (url) urls.push(url);
    }
    if (urls.length) onChangeImages([...(images || []), ...urls]);
  };

  const handleCameraCapture = async (file: File) => {
    const url = await uploadAndReturn(file);
    if (!url) return;
    if (cameraOpen === 'main' && onChangeImageUrl) {
      onChangeImageUrl(url);
    } else if (cameraOpen === 'gallery' && onChangeImages) {
      onChangeImages([...(images || []), url]);
    }
  };

  if (mode === 'main') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {t('admin.mainImage')}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Box
            sx={{
              width: 140,
              height: 140,
              borderRadius: 2,
              overflow: 'hidden',
              flexShrink: 0,
              bgcolor: 'background.paper',
              border: (theme) => `1px dashed ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt="preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = '0.25';
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => onChangeImageUrl?.('')}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    insetInlineEnd: 4,
                    bgcolor: 'rgba(0,0,0,0.55)',
                    color: '#fff',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                  }}
                  aria-label={t('admin.removeImage')}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </>
            ) : (
              <AddPhotoAlternateIcon sx={{ fontSize: 48, opacity: 0.35 }} />
            )}
            {uploading && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress size={28} />
              </Box>
            )}
          </Box>

          <Stack spacing={1} sx={{ minWidth: 200 }}>
            <Button
              variant="outlined"
              startIcon={<PhotoCameraIcon />}
              onClick={() => setCameraOpen('main')}
              disabled={uploading}
            >
              {t('admin.takePhoto')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {t('admin.chooseFromDevice')}
            </Button>
            <Button
              size="small"
              startIcon={<LinkIcon />}
              onClick={() => setShowUrlField((s) => !s)}
              sx={{ alignSelf: 'flex-start' }}
            >
              {showUrlField ? t('common.cancel') : t('admin.pasteUrl')}
            </Button>
          </Stack>
        </Box>

        {showUrlField && (
          <TextField
            label={t('admin.imageUrl')}
            fullWidth
            value={imageUrl || ''}
            onChange={(e) => onChangeImageUrl?.(e.target.value)}
            size="small"
            placeholder="https://…"
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleMainFile}
        />

        <CameraCaptureDialog
          open={cameraOpen === 'main'}
          onClose={() => setCameraOpen(null)}
          onCapture={handleCameraCapture}
        />
      </Box>
    );
  }

  // Gallery mode
  const list = images || [];
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {t('admin.additionalImages')}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title={t('admin.takePhoto')}>
            <span>
              <IconButton
                color="primary"
                onClick={() => setCameraOpen('gallery')}
                disabled={uploading}
              >
                <PhotoCameraIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={t('admin.chooseFromDevice')}>
            <span>
              <IconButton
                color="primary"
                onClick={() => galleryFileRef.current?.click()}
                disabled={uploading}
              >
                <UploadFileIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(5, 1fr)' },
          gap: 1.5,
        }}
      >
        {list.map((url, idx) => (
          <Box
            key={`${url}-${idx}`}
            sx={{
              position: 'relative',
              paddingTop: '100%',
              borderRadius: 1.5,
              overflow: 'hidden',
              bgcolor: 'background.paper',
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <img
              src={url}
              alt={`additional-${idx}`}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0.25';
              }}
            />
            <IconButton
              size="small"
              onClick={() => onChangeImages?.(list.filter((_, i) => i !== idx))}
              sx={{
                position: 'absolute',
                top: 4,
                insetInlineEnd: 4,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              }}
              aria-label={t('admin.removeImage')}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}

        <Button
          variant="outlined"
          onClick={() => galleryFileRef.current?.click()}
          disabled={uploading}
          sx={{
            position: 'relative',
            paddingTop: '100%',
            border: (theme) => `1px dashed ${theme.palette.divider}`,
            borderRadius: 1.5,
            color: 'text.secondary',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
            }}
          >
            {uploading ? <CircularProgress size={22} /> : <AddPhotoAlternateIcon />}
            <Typography variant="caption">{t('admin.addImage')}</Typography>
          </Box>
        </Button>
      </Box>

      <input
        ref={galleryFileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleGalleryFiles}
      />

      <CameraCaptureDialog
        open={cameraOpen === 'gallery'}
        onClose={() => setCameraOpen(null)}
        onCapture={handleCameraCapture}
      />
    </Box>
  );
}
