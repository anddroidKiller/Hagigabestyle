import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Typography, Button, Box, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControlLabel, Switch, MenuItem, Chip,
  Backdrop, CircularProgress, Alert, Snackbar,
  useMediaQuery, useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import { adminApi, ProductDto, CategoryDto } from "../../services/api";
import ProductBarcodeCaptureDialog from "../../components/admin/ProductBarcodeCaptureDialog";

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; msg: string; severity: "success" | "error" | "info" }>({
    open: false, msg: "", severity: "success",
  });

  // Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDto | null>(null);
  const [form, setForm] = useState({
    nameHe: "", nameEn: "", descriptionHe: "", descriptionEn: "",
    price: 0, costPrice: 0, barcode: "", imageUrl: "", categoryId: 0,
    stockQuantityStore: 0, stockQuantityWarehouse: 0,
    locationStore: "", locationWarehouse: "",
    isActive: true,
  });

  const profitMargin = form.price > 0
    ? ((form.price - form.costPrice) / form.price) * 100
    : 0;

  const loadData = () => {
    adminApi.getProducts().then(setProducts);
    adminApi.getCategories().then(setCategories);
  };

  useEffect(() => { loadData(); }, []);

  const showSnack = (msg: string, severity: "success" | "error" | "info" = "success") =>
    setSnackbar({ open: true, msg, severity });

  const openCreate = () => {
    if (!categories.length) {
      showSnack("אין קטגוריות. צור קטגוריה לפני הוספת מוצר.", "error");
      return;
    }
    setCaptureOpen(true);
  };

  const createProductFromBarcode = async (code: string) => {
    setCaptureOpen(false);
    setCreating(true);
    try {
      const defaultCategoryId = categories[0]?.id ?? 0;
      await adminApi.createProduct({
        nameHe: "",
        nameEn: "",
        descriptionHe: "",
        descriptionEn: "",
        price: 0,
        costPrice: 0,
        barcode: code,
        imageUrl: "",
        categoryId: defaultCategoryId,
        stockQuantityStore: 0,
        stockQuantityWarehouse: 0,
        locationStore: "",
        locationWarehouse: "",
        isActive: true,
      });
      showSnack(`המוצר נוסף עם ברקוד ${code}`, "success");
      loadData();
    } catch (e) {
      let msg = "שגיאה בהוספת המוצר.";
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        if (status === 401) msg = "ההתחברות פגה או שאין הרשאה. התחבר שוב לממשק המנהל ונסה שוב.";
        else if (e.message) msg = e.message;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      showSnack(msg, "error");
    } finally {
      setCreating(false);
    }
  };

  const openManualForm = () => {
    setCaptureOpen(false);
    setEditing(null);
    setForm({
      nameHe: "", nameEn: "", descriptionHe: "", descriptionEn: "",
      price: 0, costPrice: 0, barcode: "", imageUrl: "",
      categoryId: categories[0]?.id ?? 0,
      stockQuantityStore: 0, stockQuantityWarehouse: 0,
      locationStore: "", locationWarehouse: "",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (p: ProductDto) => {
    setEditing(p);
    setForm({
      nameHe: p.nameHe, nameEn: p.nameEn,
      descriptionHe: p.descriptionHe || "", descriptionEn: p.descriptionEn || "",
      price: p.price, costPrice: p.costPrice || 0,
      barcode: p.barcode || "", imageUrl: p.imageUrl || "",
      categoryId: p.categoryId,
      stockQuantityStore: p.stockQuantityStore || 0,
      stockQuantityWarehouse: p.stockQuantityWarehouse || 0,
      locationStore: p.locationStore || "",
      locationWarehouse: p.locationWarehouse || "",
      isActive: p.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await adminApi.updateProduct(editing.id, form);
        showSnack("המוצר עודכן בהצלחה.", "success");
      } else {
        await adminApi.createProduct(form);
        showSnack("המוצר נוסף בהצלחה.", "success");
      }
      setDialogOpen(false);
      setEditing(null);
      loadData();
    } catch (e) {
      let msg = "שגיאה בשמירת המוצר.";
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        msg = "ההתחברות פגה או שאין הרשאה. התחבר שוב לממשק המנהל ונסה שוב.";
      } else if (e instanceof Error) {
        msg = e.message;
      }
      showSnack(msg, "error");
    }
  };

  const closeProductDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm("למחוק מוצר זה?")) {
      await adminApi.deleteProduct(id);
      loadData();
    }
  };

  return (
    <>
      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.modal + 1 }} open={creating}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <ProductBarcodeCaptureDialog
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onBarcode={createProductFromBarcode}
        onSkip={openManualForm}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.msg}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t("admin.manageProducts")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          fullWidth={isMobile}
          size={isMobile ? "large" : "medium"}
        >
          {t("admin.addProduct")}
        </Button>
      </Box>

      {isMobile ? (
        <Stack spacing={1.5}>
          {products.map((p) => (
            <Paper
              key={p.id}
              elevation={1}
              sx={{
                p: 2,
                borderRadius: 2,
                display: "flex",
                gap: 1.5,
                alignItems: "flex-start",
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 1.5,
                  overflow: "hidden",
                  flexShrink: 0,
                  bgcolor: "background.default",
                  border: (th) => `1px solid ${th.palette.divider}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.nameHe}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">#{p.id}</Typography>
                )}
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                  {p.nameHe || <em style={{ opacity: 0.5 }}>ללא שם</em>}
                </Typography>
                {p.nameEn && (
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                    {p.nameEn}
                  </Typography>
                )}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.75, alignItems: "center" }}>
                  <Chip
                    label={`₪${p.price.toFixed(2)}`}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                  <Chip
                    label={`${t("admin.stockStoreShort")}: ${p.stockQuantityStore ?? 0}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`${t("admin.stockWarehouseShort")}: ${p.stockQuantityWarehouse ?? 0}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={p.isActive ? t("admin.active") : t("admin.inactive")}
                    color={p.isActive ? "success" : "default"}
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                  {p.categoryNameHe}
                  {p.barcode ? ` · ${p.barcode}` : ""}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <IconButton onClick={() => openEdit(p)} size="small"><EditIcon /></IconButton>
                <IconButton onClick={() => handleDelete(p.id)} size="small" color="error"><DeleteIcon /></IconButton>
              </Box>
            </Paper>
          ))}
          {products.length === 0 && (
            <Paper sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("common.noResults")}
              </Typography>
            </Paper>
          )}
        </Stack>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>{t("admin.nameHe")}</TableCell>
                <TableCell>{t("admin.nameEn")}</TableCell>
                <TableCell>{t("admin.sellPrice")}</TableCell>
                <TableCell>{t("admin.costPrice")}</TableCell>
                <TableCell>{t("admin.profitMargin")}</TableCell>
                <TableCell>{t("product.barcode")}</TableCell>
                <TableCell>{t("product.category")}</TableCell>
                <TableCell>{t("admin.stockStoreShort")}</TableCell>
                <TableCell>{t("admin.stockWarehouseShort")}</TableCell>
                <TableCell>{t("admin.active")}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.nameHe || <em style={{ opacity: 0.5 }}>ללא שם</em>}</TableCell>
                  <TableCell>{p.nameEn}</TableCell>
                  <TableCell>₪{p.price.toFixed(2)}</TableCell>
                  <TableCell>₪{(p.costPrice || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${(p.profitMargin ?? 0).toFixed(1)}%`}
                      size="small"
                      color={(p.profitMargin ?? 0) >= 20 ? "success" : (p.profitMargin ?? 0) > 0 ? "warning" : "error"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{p.barcode || "—"}</TableCell>
                  <TableCell>{p.categoryNameHe}</TableCell>
                  <TableCell>{p.stockQuantityStore ?? 0}</TableCell>
                  <TableCell>{p.stockQuantityWarehouse ?? 0}</TableCell>
                  <TableCell>
                    <Chip
                      label={p.isActive ? t("admin.active") : t("admin.inactive")}
                      color={p.isActive ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => openEdit(p)} size="small"><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(p.id)} size="small" color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeProductDialog}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        fullScreen={isMobile}
      >
        <DialogTitle>{editing ? t("common.edit") : t("admin.addProduct")}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField label={t("product.barcode")} fullWidth value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="e.g. 7290000000001" autoFocus />
            <TextField label={t("admin.nameHe")} fullWidth value={form.nameHe} onChange={(e) => setForm({ ...form, nameHe: e.target.value })} />
            <TextField label={t("admin.nameEn")} fullWidth value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
            <TextField label={t("admin.descriptionHe")} fullWidth multiline rows={2} value={form.descriptionHe} onChange={(e) => setForm({ ...form, descriptionHe: e.target.value })} />
            <TextField label={t("admin.descriptionEn")} fullWidth multiline rows={2} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} />
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label={t("admin.sellPrice")}
                type="number"
                sx={{ flex: "1 1 160px" }}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: +e.target.value })}
                slotProps={{ input: { startAdornment: <Box sx={{ mr: 0.5, color: "text.secondary" }}>₪</Box> } }}
              />
              <TextField
                label={t("admin.costPrice")}
                type="number"
                sx={{ flex: "1 1 160px" }}
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: +e.target.value })}
                slotProps={{ input: { startAdornment: <Box sx={{ mr: 0.5, color: "text.secondary" }}>₪</Box> } }}
              />
              <TextField
                label={t("admin.profitMargin")}
                sx={{ flex: "1 1 160px" }}
                value={form.price > 0 ? `${profitMargin.toFixed(2)}%` : "—"}
                slotProps={{ input: { readOnly: true } }}
                helperText={t("admin.profitMarginHint")}
                color={profitMargin >= 0 ? "success" : "error"}
                focused
              />
            </Box>
            <TextField label={t("admin.imageUrl")} fullWidth value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            {form.imageUrl && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box
                  sx={{
                    width: 160,
                    height: 160,
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "background.paper",
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <img
                    src={form.imageUrl}
                    alt="preview"
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = "0.25";
                    }}
                  />
                </Box>
              </Box>
            )}
            <TextField
              select label={t("product.category")} fullWidth value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: +e.target.value })}
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.nameHe}</MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label={t("admin.stockStore")}
                type="number"
                sx={{ flex: "1 1 160px" }}
                value={form.stockQuantityStore}
                onChange={(e) => setForm({ ...form, stockQuantityStore: +e.target.value })}
              />
              <TextField
                label={t("admin.stockWarehouse")}
                type="number"
                sx={{ flex: "1 1 160px" }}
                value={form.stockQuantityWarehouse}
                onChange={(e) => setForm({ ...form, stockQuantityWarehouse: +e.target.value })}
              />
              <TextField
                label={t("admin.stockTotal")}
                sx={{ flex: "1 1 160px" }}
                value={form.stockQuantityStore + form.stockQuantityWarehouse}
                slotProps={{ input: { readOnly: true } }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label={t("admin.locationStore")}
                placeholder={t("admin.locationStorePlaceholder")}
                sx={{ flex: "1 1 240px" }}
                value={form.locationStore}
                onChange={(e) => setForm({ ...form, locationStore: e.target.value })}
                slotProps={{ htmlInput: { maxLength: 100 } }}
              />
              <TextField
                label={t("admin.locationWarehouse")}
                placeholder={t("admin.locationWarehousePlaceholder")}
                sx={{ flex: "1 1 240px" }}
                value={form.locationWarehouse}
                onChange={(e) => setForm({ ...form, locationWarehouse: e.target.value })}
                slotProps={{ htmlInput: { maxLength: 100 } }}
              />
            </Box>
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
              label={t("admin.active")}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeProductDialog}>{t("common.cancel")}</Button>
          <Button onClick={handleSave} variant="contained">{t("common.save")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
