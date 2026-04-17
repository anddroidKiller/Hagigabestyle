import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { BrowserMultiFormatReader } from "@zxing/browser";

type Props = {
  open: boolean;
  onClose: () => void;
  onBarcode: (code: string) => void;
  onSkip: () => void;
};

export default function ProductBarcodeCaptureDialog({ open, onClose, onBarcode, onSkip }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const doneRef = useRef(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const stopScanner = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      /* ignore */
    }
    controlsRef.current = null;
    setScanning(false);
  }, []);

  const handleDecoded = useCallback(
    (text: string) => {
      if (doneRef.current) return;
      const digits = text.replace(/\D/g, "");
      if (digits.length < 8) {
        setDecodeError(t("admin.barcodeTooShort"));
        return;
      }
      doneRef.current = true;
      stopScanner();
      onBarcode(digits);
    },
    [onBarcode, stopScanner, t]
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setDecodeError(null);
    doneRef.current = false;
    stopScanner();
    if (!videoRef.current) return;

    const reader = new BrowserMultiFormatReader();
    setScanning(true);

    try {
      let controls: { stop: () => void };
      controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
        if (result) {
          controls.stop();
          handleDecoded(result.getText());
        }
      });
      controlsRef.current = controls;
    } catch (e) {
      setCameraError(e instanceof Error ? e.message : String(e));
      setScanning(false);
      controlsRef.current = null;
    }
  }, [handleDecoded, stopScanner]);

  useEffect(() => {
    if (open) {
      doneRef.current = false;
      // Small delay lets the dialog mount <video> into the DOM before camera init.
      const timer = window.setTimeout(() => {
        startCamera();
      }, 150);
      return () => window.clearTimeout(timer);
    }

    doneRef.current = false;
    stopScanner();
    setCameraError(null);
    setDecodeError(null);
    return undefined;
  }, [open, startCamera, stopScanner]);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setDecodeError(null);
    doneRef.current = false;
    const reader = new BrowserMultiFormatReader();
    const url = URL.createObjectURL(file);
    try {
      const result = await reader.decodeFromImageUrl(url);
      stopScanner();
      handleDecoded(result.getText());
    } catch {
      setDecodeError(t("admin.barcodeNotInImage"));
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle>{t("admin.productCaptureTitle")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t("admin.productCaptureHint")}
          </Typography>

          {cameraError && <Alert severity="warning">{cameraError}</Alert>}
          {decodeError && <Alert severity="info">{decodeError}</Alert>}

          <Box
            sx={{
              position: "relative",
              width: "100%",
              bgcolor: "grey.900",
              borderRadius: 2,
              overflow: "hidden",
              minHeight: { xs: 260, sm: 220 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: "100%",
                maxHeight: isMobile ? "60vh" : 320,
                objectFit: "contain",
              }}
            />
            {!scanning && !cameraError && (
              <Typography
                variant="body2"
                sx={{ position: "absolute", color: "common.white", opacity: 0.75 }}
              >
                {t("admin.scanning")}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            <Button component="label" variant="outlined" fullWidth={isMobile}>
              {t("admin.uploadBarcodeImage")}
              <input type="file" accept="image/*" hidden onChange={onPickFile} />
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            stopScanner();
            onSkip();
          }}
        >
          {t("admin.enterManually")}
        </Button>
        <Button
          onClick={() => {
            stopScanner();
            onClose();
          }}
        >
          {t("common.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
