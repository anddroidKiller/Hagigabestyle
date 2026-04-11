import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography, Button, Box, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControlLabel, Switch, MenuItem, Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { adminApi, ProductDto, CategoryDto } from '../../services/api';

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDto | null>(null);
  const [form, setForm] = useState({
    nameHe: '', nameEn: '', descriptionHe: '', descriptionEn: '',
    price: 0, barcode: '', imageUrl: '', categoryId: 0, stockQuantity: 0, isActive: true,
  });

  const loadData = () => {
    adminApi.getProducts().then(setProducts);
    adminApi.getCategories().then(setCategories);
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      nameHe: '', nameEn: '', descriptionHe: '', descriptionEn: '',
      price: 0, barcode: '', imageUrl: '', categoryId: categories[0]?.id || 0, stockQuantity: 0, isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (p: ProductDto) => {
    setEditing(p);
    setForm({
      nameHe: p.nameHe, nameEn: p.nameEn,
      descriptionHe: p.descriptionHe || '', descriptionEn: p.descriptionEn || '',
      price: p.price, barcode: p.barcode || '', imageUrl: p.imageUrl || '',
      categoryId: p.categoryId, stockQuantity: p.stockQuantity, isActive: p.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await adminApi.updateProduct(editing.id, form);
    } else {
      await adminApi.createProduct(form);
    }
    setDialogOpen(false);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('למחוק מוצר זה?')) {
      await adminApi.deleteProduct(id);
      loadData();
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          {t('admin.manageProducts')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {t('admin.addProduct')}
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>{t('admin.nameHe')}</TableCell>
              <TableCell>{t('admin.nameEn')}</TableCell>
              <TableCell>{t('common.price')}</TableCell>
              <TableCell>{t('product.barcode')}</TableCell>
              <TableCell>{t('product.category')}</TableCell>
              <TableCell>{t('common.quantity')}</TableCell>
              <TableCell>{t('admin.active')}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.nameHe}</TableCell>
                <TableCell>{p.nameEn}</TableCell>
                <TableCell>₪{p.price.toFixed(2)}</TableCell>
                <TableCell>{p.barcode || '—'}</TableCell>
                <TableCell>{p.categoryNameHe}</TableCell>
                <TableCell>{p.stockQuantity}</TableCell>
                <TableCell>
                  <Chip
                    label={p.isActive ? t('admin.active') : t('admin.inactive')}
                    color={p.isActive ? 'success' : 'default'}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('common.edit') : t('admin.addProduct')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label={t('admin.nameHe')} fullWidth value={form.nameHe} onChange={e => setForm({ ...form, nameHe: e.target.value })} />
            <TextField label={t('admin.nameEn')} fullWidth value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} />
            <TextField label={t('admin.descriptionHe')} fullWidth multiline rows={2} value={form.descriptionHe} onChange={e => setForm({ ...form, descriptionHe: e.target.value })} />
            <TextField label={t('admin.descriptionEn')} fullWidth multiline rows={2} value={form.descriptionEn} onChange={e => setForm({ ...form, descriptionEn: e.target.value })} />
            <TextField label={t('common.price')} type="number" fullWidth value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} />
            <TextField label={t('product.barcode')} fullWidth value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="e.g. 7290000000001" />
            <TextField label={t('admin.imageUrl')} fullWidth value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
            <TextField
              select label={t('product.category')} fullWidth value={form.categoryId}
              onChange={e => setForm({ ...form, categoryId: +e.target.value })}
            >
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.nameHe}</MenuItem>)}
            </TextField>
            <TextField label={t('common.quantity')} type="number" fullWidth value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: +e.target.value })} />
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />}
              label={t('admin.active')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} variant="contained">{t('common.save')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
