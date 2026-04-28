import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Stack,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';

interface CameraCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

/**
 * Live camera capture dialog backed by `navigator.mediaDevices.getUserMedia`.
 * - Works on desktop (webcam) and mobile (rear camera by default, switchable).
 * - On capture, the current video frame is drawn to a canvas and exported as a
 *   JPEG `File`, then handed back to the caller for upload.
 */
export default function CameraCaptureDialog({ open, onClose, onCapture }: CameraCaptureDialogProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startStream = async (mode: 'environment' | 'user') => {
    setError(null);
    setLoading(true);
    stopStream();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('NO_MEDIA_DEVICES');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (e: unknown) {
      const code = (e as { name?: string; message?: string })?.name
        ?? (e as { message?: string })?.message
        ?? '';
      if (code === 'NotAllowedError' || code === 'PermissionDeniedError') {
        setError(t('admin.cameraPermissionDenied'));
      } else if (code === 'NotFoundError' || code === 'DevicesNotFoundError') {
        setError(t('admin.cameraNotFound'));
      } else if (code === 'NO_MEDIA_DEVICES') {
        setError(t('admin.cameraNotSupported'));
      } else {
        setError(t('admin.cameraGenericError'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSnapshot(null);
      void startStream(facingMode);
    } else {
      stopStream();
      setSnapshot(null);
    }
    return () => {
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const switchCamera = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    setSnapshot(null);
    await startStream(next);
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    setSnapshot(canvas.toDataURL('image/jpeg', 0.92));
  };

  const retake = () => {
    setSnapshot(null);
  };

  const usePhoto = async () => {
    if (!snapshot) return;
    const blob = await (await fetch(snapshot)).blob();
    const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
    onCapture(file);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { bgcolor: 'background.default' } } }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', bgcolor: '#000', minHeight: 360 }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            insetInlineEnd: 8,
            zIndex: 2,
            color: '#fff',
            bgcolor: 'rgba(0,0,0,0.45)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
          }}
          aria-label={t('common.cancel')}
        >
          <CloseIcon />
        </IconButton>

        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              color: '#fff',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <CircularProgress color="inherit" />
            <Typography variant="caption">{t('admin.cameraStarting')}</Typography>
          </Box>
        )}

        {error ? (
          <Box
            sx={{
              minHeight: 360,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 3,
              color: '#fff',
              textAlign: 'center',
            }}
          >
            <Typography>{error}</Typography>
          </Box>
        ) : snapshot ? (
          <Box
            component="img"
            src={snapshot}
            alt="snapshot"
            sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <Box
            component="video"
            ref={videoRef}
            playsInline
            muted
            sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
        {snapshot ? (
          <>
            <Button onClick={retake} startIcon={<RefreshIcon />}>
              {t('admin.retakePhoto')}
            </Button>
            <Button variant="contained" onClick={usePhoto}>
              {t('admin.usePhoto')}
            </Button>
          </>
        ) : (
          <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={switchCamera} startIcon={<CameraswitchIcon />} disabled={loading || !!error}>
              {t('admin.switchCamera')}
            </Button>
            <Button
              variant="contained"
              onClick={takeSnapshot}
              startIcon={<PhotoCameraIcon />}
              disabled={loading || !!error}
            >
              {t('admin.capture')}
            </Button>
          </Stack>
        )}
      </DialogActions>
    </Dialog>
  );
}
