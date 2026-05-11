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
import { BarcodeDetectorPolyfill } from "barcode-detector-polyfill";

if (!("BarcodeDetector" in window)) {
  (window as any).BarcodeDetector = BarcodeDetectorPolyfill;
}

const SUPPORTED_FORMATS: string[] = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"];

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
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const stopScanner = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
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

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);

      const DetectorClass: any = (window as any).BarcodeDetector;
      const detector = new DetectorClass({ formats: SUPPORTED_FORMATS });

      const tick = async () => {
        if (doneRef.current || !videoRef.current || videoRef.current.readyState < 2) {
          if (!doneRef.current) rafRef.current = requestAnimationFrame(tick);
          return;
        }
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            handleDecoded(barcodes[0].rawValue);
            return;
          }
        } catch {
          // frame not ready, retry
        }
        if (!doneRef.current) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      setCameraError(e instanceof Error ? e.message : String(e));
      setScanning(false);
    }
  }, [handleDecoded, stopScanner]);

  useEffect(() => {
    if (open) {
      doneRef.current = false;
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

    const DetectorClass: any = (window as any).BarcodeDetector;
    const detector = new DetectorClass({ formats: SUPPORTED_FORMATS });
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });
      const barcodes = await detector.detect(img);
      if (barcodes.length > 0) {
        stopScanner();
        handleDecoded(barcodes[0].rawValue);
      } else {
        setDecodeError(t("admin.barcodeNotInImage"));
      }
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
