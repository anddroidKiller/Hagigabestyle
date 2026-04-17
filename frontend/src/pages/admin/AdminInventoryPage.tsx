import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Typography, Box, Paper, Stack, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, IconButton, CircularProgress, Snackbar, Alert,
  useTheme, useMediaQuery, Tooltip,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import StorefrontIcon from "@mui/icons-material/Storefront";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { adminApi, ProductDto } from "../../services/api";

interface EditState {
  store: number;
  warehouse: number;
  locationStore: string;
  locationWarehouse: string;
}

const LOW_STOCK_THRESHOLD = 10;

export default function AdminInventoryPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<number, EditState>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [snack, setSnack] = useState<{ open: boolean; severity: "success" | "error"; message: string }>({
    open: false, severity: "success", message: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getProducts();
      setProducts(data);
      setEdits({});
    } catch {
      setSnack({ open: true, severity: "error", message: t("common.error") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const baseEdit = (p: ProductDto): EditState => ({
    store: p.stockQuantityStore ?? 0,
    warehouse: p.stockQuantityWarehouse ?? 0,
    locationStore: p.locationStore ?? "",
    locationWarehouse: p.locationWarehouse ?? "",
  });

  const getEdit = (p: ProductDto): EditState => edits[p.id] ?? baseEdit(p);

  const isDirty = (p: ProductDto): boolean => {
    const e = edits[p.id];
    if (!e) return false;
    const b = baseEdit(p);
    return (
      e.store !== b.store ||
      e.warehouse !== b.warehouse ||
      e.locationStore !== b.locationStore ||
      e.locationWarehouse !== b.locationWarehouse
    );
  };

  const setEditQty = (p: ProductDto, field: "store" | "warehouse", value: number) => {
    const clamped = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
    setEdits((prev) => {
      const current = prev[p.id] ?? baseEdit(p);
      return { ...prev, [p.id]: { ...current, [field]: clamped } };
    });
  };

  const setEditLocation = (p: ProductDto, field: "locationStore" | "locationWarehouse", value: string) => {
    setEdits((prev) => {
      const current = prev[p.id] ?? baseEdit(p);
      return { ...prev, [p.id]: { ...current, [field]: value.slice(0, 100) } };
    });
  };

  const saveRow = async (p: ProductDto) => {
    const e = edits[p.id];
    if (!e) return;
    setSavingId(p.id);
    try {
      const updated = await adminApi.updateInventory(p.id, {
        stockQuantityStore: e.store,
        stockQuantityWarehouse: e.warehouse,
        locationStore: e.locationStore.trim() || undefined,
        locationWarehouse: e.locationWarehouse.trim() || undefined,
      });
      setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
      setEdits((prev) => {
        const { [p.id]: _unused, ...rest } = prev;
        return rest;
      });
      setSnack({ open: true, severity: "success", message: t("admin.inventorySaved") });
    } catch {
      setSnack({ open: true, severity: "error", message: t("common.error") });
    } finally {
      setSavingId(null);
    }
  };

  // Sort ascending by TOTAL stock (smallest first). Dirty items keep their
  // position based on the persisted quantities to avoid rows jumping while typing.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products
      .filter((p) => {
        if (!term) return true;
        return (
          p.nameHe.toLowerCase().includes(term) ||
          p.nameEn.toLowerCase().includes(term) ||
          (p.barcode ?? "").toLowerCase().includes(term) ||
          p.categoryNameHe.toLowerCase().includes(term)
        );
      })
      .slice()
      .sort((a, b) => {
        const ta = (a.stockQuantityStore ?? 0) + (a.stockQuantityWarehouse ?? 0);
        const tb = (b.stockQuantityStore ?? 0) + (b.stockQuantityWarehouse ?? 0);
        return ta - tb;
      });
  }, [products, search]);

  const renderQtyField = (p: ProductDto, field: "store" | "warehouse", label: string) => {
    const e = getEdit(p);
    const value = e[field];
    return (
      <TextField
        size="small"
        type="number"
        label={isMobile ? label : undefined}
        value={value}
        onChange={(ev) => setEditQty(p, field, Number(ev.target.value))}
        slotProps={{ htmlInput: { min: 0, style: { textAlign: "center", width: 70 } } }}
        sx={{ "& input": { py: 0.75 } }}
      />
    );
  };

  const renderLocationField = (
    p: ProductDto,
    field: "locationStore" | "locationWarehouse",
    label: string,
  ) => {
    const e = getEdit(p);
    return (
      <TextField
        size="small"
        label={isMobile ? label : undefined}
        placeholder={label}
        value={e[field]}
        onChange={(ev) => setEditLocation(p, field, ev.target.value)}
        slotProps={{ htmlInput: { maxLength: 100 } }}
        sx={{ minWidth: 100, flexGrow: 1, "& input": { py: 0.75 } }}
      />
    );
  };

  const renderTotalChip = (p: ProductDto) => {
    const e = getEdit(p);
    const total = e.store + e.warehouse;
    const low = total <= LOW_STOCK_THRESHOLD;
    const out = total === 0;
    return (
      <Chip
        icon={low ? <WarningAmberIcon /> : undefined}
        label={total}
        size="small"
        color={out ? "error" : low ? "warning" : "success"}
        sx={{ fontWeight: 700, minWidth: 52 }}
      />
    );
  };

  return (
    <>
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
          {t("admin.manageInventory")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { xs: 0, sm: 220 }, flexGrow: { xs: 1, sm: 0 } }}
          />
          <Tooltip title={t("common.refresh") || "Refresh"}>
            <IconButton onClick={load} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading && products.length === 0 ? (
        <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        <Stack spacing={1.5}>
          {filtered.map((p) => {
            const dirty = isDirty(p);
            return (
              <Paper key={p.id} elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
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
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">#{p.id}</Typography>
                    )}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                      {p.nameHe}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {p.categoryNameHe}
                      {p.barcode ? ` · ${p.barcode}` : ""}
                    </Typography>
                    <Box sx={{ mt: 0.75 }}>{renderTotalChip(p)}</Box>
                  </Box>
                </Box>
                <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <StorefrontIcon fontSize="small" color="action" />
                    {renderQtyField(p, "store", t("admin.stockStore"))}
                    {renderLocationField(p, "locationStore", t("admin.locationStore"))}
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <WarehouseIcon fontSize="small" color="action" />
                    {renderQtyField(p, "warehouse", t("admin.stockWarehouse"))}
                    {renderLocationField(p, "locationWarehouse", t("admin.locationWarehouse"))}
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <IconButton
                      color="primary"
                      onClick={() => saveRow(p)}
                      disabled={!dirty || savingId === p.id}
                    >
                      {savingId === p.id ? <CircularProgress size={22} /> : <SaveIcon />}
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            );
          })}
          {filtered.length === 0 && (
            <Paper sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">{t("common.noResults")}</Typography>
            </Paper>
          )}
        </Stack>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>{t("admin.product") || t("admin.manageProducts")}</TableCell>
                <TableCell>{t("product.category")}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <StorefrontIcon fontSize="small" />
                    {t("admin.stockStore")}
                  </Box>
                </TableCell>
                <TableCell>{t("admin.locationStore")}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <WarehouseIcon fontSize="small" />
                    {t("admin.stockWarehouse")}
                  </Box>
                </TableCell>
                <TableCell>{t("admin.locationWarehouse")}</TableCell>
                <TableCell align="center">{t("admin.stockTotal")}</TableCell>
                <TableCell align="center">{t("common.save")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => {
                const dirty = isDirty(p);
                return (
                  <TableRow key={p.id} hover sx={dirty ? { backgroundColor: "action.selected" } : {}}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        {p.imageUrl && (
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 1,
                              overflow: "hidden",
                              bgcolor: "background.default",
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={p.imageUrl}
                              alt={p.nameHe}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </Box>
                        )}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {p.nameHe || <em style={{ opacity: 0.5 }}>ללא שם</em>}
                          </Typography>
                          {p.barcode && (
                            <Typography variant="caption" color="text.secondary">
                              {p.barcode}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{p.categoryNameHe}</TableCell>
                    <TableCell align="center">{renderQtyField(p, "store", t("admin.stockStore"))}</TableCell>
                    <TableCell>{renderLocationField(p, "locationStore", t("admin.locationStore"))}</TableCell>
                    <TableCell align="center">{renderQtyField(p, "warehouse", t("admin.stockWarehouse"))}</TableCell>
                    <TableCell>{renderLocationField(p, "locationWarehouse", t("admin.locationWarehouse"))}</TableCell>
                    <TableCell align="center">{renderTotalChip(p)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => saveRow(p)}
                        disabled={!dirty || savingId === p.id}
                      >
                        {savingId === p.id ? <CircularProgress size={22} /> : <SaveIcon />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">{t("common.noResults")}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
