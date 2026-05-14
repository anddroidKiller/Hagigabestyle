import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Stack,
  IconButton,
  CircularProgress,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CameraswitchIcon from "@mui/icons-material/Cameraswitch";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import { adminApi } from "../../services/api";

type Step = "quantity" | "photo";

interface Props {
  open: boolean;
  barcode: string;
  defaultCategoryId: number;
  onClose: () => void;
  onDone: () => void;
  onError: (msg: string) => void;
}

export default function ProductAddWizardDialog({ open, barcode, defaultCategoryId, onClose, onDone, onError }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("quantity");
  const [storeQty, setStoreQty] = useState<number>(0);
  const [warehouseQty, setWarehouseQty] = useState<number>(0);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const storeQtyRef = useRef<HTMLInputElement | null>(null);

  const reset = useCallback(() => {
    setStep("quantity");
    setStoreQty(0);
    setWarehouseQty(0);
    setImages([]);
    setSnapshot(null);
    setCameraError(null);
    setCameraLoading(false);
    setUploading(false);
    setSaving(false);
  }, []);

  useEffect(() => {
    if (open) {
      reset();
    } else {
      stopStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && step === "quantity") {
      // iOS requires focus to happen after the dialog transition completes.
      // Multiple attempts with increasing delays ensure the keyboard opens reliably.
      const timers = [300, 500].map((ms) =>
        setTimeout(() => {
          const el = storeQtyRef.current;
          if (!el) return;
          el.focus();
          el.click();
          el.setSelectionRange(0, el.value.length);
        }, ms)
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [open, step]);

  // --- Camera helpers ---
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startStream = async (mode: "environment" | "user") => {
    setCameraError(null);
    setCameraLoading(true);
    stopStream();
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("NO_MEDIA_DEVICES");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (e: unknown) {
      const code = (e as { name?: string })?.name ?? "";
      if (code === "NotAllowedError") setCameraError(t("admin.cameraPermissionDenied"));
      else if (code === "NotFoundError") setCameraError(t("admin.cameraNotFound"));
      else setCameraError(t("admin.cameraGenericError"));
    } finally {
      setCameraLoading(false);
    }
  };

  const openCamera = () => {
    setSnapshot(null);
    startStream(facingMode);
  };

  useEffect(() => {
    if (step === "photo" && open) {
      const timer = setTimeout(() => openCamera(), 200);
      return () => clearTimeout(timer);
    }
    if (step !== "photo") stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, open]);

  const switchCamera = async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    setSnapshot(null);
    await startStream(next);
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    setSnapshot(canvas.toDataURL("image/jpeg", 0.88));
    stopStream();
  };

  const uploadSnapshot = async () => {
    if (!snapshot) return;
    setUploading(true);
    try {
      const blob = await (await fetch(snapshot)).blob();
      const file = new File([blob], `product-${barcode}-${Date.now()}.jpg`, { type: "image/jpeg" });
      const url = await adminApi.uploadImage(file);
      setImages((prev) => [...prev, url]);
      setSnapshot(null);
    } catch {
      onError(t("admin.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const addAnotherPhoto = async () => {
    await uploadSnapshot();
    openCamera();
  };

  const finishWizard = async () => {
    if (snapshot) {
      setUploading(true);
      try {
        const blob = await (await fetch(snapshot)).blob();
        const file = new File([blob], `product-${barcode}-${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = await adminApi.uploadImage(file);
        await doSave([...images, url]);
      } catch {
        onError(t("admin.uploadFailed"));
        setUploading(false);
      }
    } else {
      await doSave(images);
    }
  };

  const doSave = async (finalImages: string[]) => {
    setSaving(true);
    try {
      await adminApi.createProduct({
        nameHe: "",
        nameEn: "",
        descriptionHe: "",
        descriptionEn: "",
        price: 0,
        costPrice: 0,
        barcode,
        imageUrl: finalImages[0] || "",
        images: finalImages.slice(1),
        categoryId: defaultCategoryId,
        stockQuantityStore: storeQty,
        stockQuantityWarehouse: warehouseQty,
        locationStore: "",
        locationWarehouse: "",
        isActive: true,
      });
      onDone();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "שגיאה בהוספת המוצר";
      onError(msg);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen>
      <DialogTitle sx={{ pb: 1 }}>
        {step === "quantity" ? "הוספת מוצר — כמויות" : "הוספת מוצר — צילום"}
        <Typography variant="body2" color="text.secondary">
          ברקוד: {barcode}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        {step === "quantity" && (
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              inputRef={storeQtyRef}
              label={t("admin.stockStore")}
              type="number"
              fullWidth
              autoFocus
              value={storeQty}
              onChange={(e) => setStoreQty(Math.max(0, +e.target.value))}
              slotProps={{
                htmlInput: { inputMode: "numeric", pattern: "[0-9]*", min: 0 },
              }}
              sx={{ "& .MuiInputBase-input": { fontSize: "1.5rem", py: 2 } }}
            />
            <TextField
              label={t("admin.stockWarehouse")}
              type="number"
              fullWidth
              value={warehouseQty}
              onChange={(e) => setWarehouseQty(Math.max(0, +e.target.value))}
              slotProps={{
                htmlInput: { inputMode: "numeric", pattern: "[0-9]*", min: 0 },
              }}
              sx={{ "& .MuiInputBase-input": { fontSize: "1.25rem", py: 1.5 } }}
            />
          </Stack>
        )}

        {step === "photo" && (
          <Box sx={{ display: "flex", flexDirection: "column", flex: 1, gap: 2 }}>
            {/* Camera / Snapshot area */}
            <Box
              sx={{
                position: "relative",
                bgcolor: "#000",
                borderRadius: 2,
                overflow: "hidden",
                flex: 1,
                minHeight: 280,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {cameraLoading && (
                <Box sx={{ position: "absolute", zIndex: 1, color: "#fff", textAlign: "center" }}>
                  <CircularProgress color="inherit" size={32} />
                  <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                    {t("admin.cameraStarting")}
                  </Typography>
                </Box>
              )}
              {cameraError ? (
                <Typography color="error" sx={{ p: 2, textAlign: "center" }}>
                  {cameraError}
                </Typography>
              ) : snapshot ? (
                <Box
                  component="img"
                  src={snapshot}
                  alt="snapshot"
                  sx={{ width: "100%", maxHeight: "55vh", objectFit: "contain" }}
                />
              ) : (
                <Box
                  component="video"
                  ref={videoRef}
                  playsInline
                  muted
                  sx={{ width: "100%", maxHeight: "55vh", objectFit: "contain", display: "block" }}
                />
              )}
            </Box>

            {/* Camera controls */}
            {!snapshot && !cameraError && (
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Button onClick={switchCamera} startIcon={<CameraswitchIcon />} disabled={cameraLoading}>
                  {t("admin.switchCamera")}
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={takeSnapshot}
                  startIcon={<PhotoCameraIcon />}
                  disabled={cameraLoading}
                >
                  {t("admin.capture")}
                </Button>
              </Stack>
            )}

            {snapshot && (
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Button
                  onClick={() => {
                    setSnapshot(null);
                    openCamera();
                  }}
                  startIcon={<RefreshIcon />}
                >
                  {t("admin.retakePhoto")}
                </Button>
              </Stack>
            )}

            {/* Uploaded thumbnails */}
            {images.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                  תמונות שצולמו ({images.length})
                </Typography>
                <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 1 }}>
                  {images.map((url, idx) => (
                    <Box key={idx} sx={{ position: "relative", flexShrink: 0 }}>
                      <Box
                        component="img"
                        src={url}
                        sx={{ width: 64, height: 64, borderRadius: 1, objectFit: "cover" }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeImage(idx)}
                        sx={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          bgcolor: "error.main",
                          color: "#fff",
                          width: 22,
                          height: 22,
                          "&:hover": { bgcolor: "error.dark" },
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 2, gap: 1, flexWrap: "wrap" }}>
        {step === "quantity" && (
          <>
            <Button onClick={handleClose} color="inherit">
              {t("common.cancel")}
            </Button>
            <Button variant="contained" size="large" onClick={() => setStep("photo")} sx={{ flex: 1 }}>
              הבא
            </Button>
          </>
        )}

        {step === "photo" && (
          <>
            <Button onClick={() => { stopStream(); setStep("quantity"); }} color="inherit">
              {t("common.back")}
            </Button>
            {snapshot && (
              <Button
                variant="outlined"
                onClick={addAnotherPhoto}
                startIcon={<AddPhotoAlternateIcon />}
                disabled={uploading || saving}
              >
                הוסף תמונה נוספת
              </Button>
            )}
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={finishWizard}
              startIcon={saving || uploading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
              disabled={uploading || saving}
              sx={{ flex: 1 }}
            >
              {saving ? "שומר..." : "סיים והוסף מוצר"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
