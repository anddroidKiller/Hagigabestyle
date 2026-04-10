import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography, Button, Box, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControlLabel, Switch, Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { adminApi, CategoryDto } from '../../services/api';

export default function AdminCategoriesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [form, setForm] = useState({ nameHe: '', nameEn: '', imageUrl: '', sortOrder: 0, isActive: true });

  const load = () => { adminApi.getCategories().then(setCategories); };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nameHe: '', nameEn: '', imageUrl: '', sortOrder: 0, isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (c: CategoryDto) => {
    setEditing(c);
    setForm({ nameHe: c.nameHe, nameEn: c.nameEn, imageUrl: c.imageUrl || '', sortOrder: c.sortOrder, isActive: c.isActive });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await adminApi.updateCategory(editing.id, form);
    } else {
      await adminApi.createCategory(form);
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('למחוק קטגוריה זו?')) {
      await adminApi.deleteCategory(id);
      load();
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>{t('admin.manageCategories')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>{t('admin.addCategory')}</Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>{t('admin.nameHe')}</TableCell>
              <TableCell>{t('admin.nameEn')}</TableCell>
              <TableCell>סדר</TableCell>
              <TableCell>{t('common.products')}</TableCell>
              <TableCell>{t('admin.active')}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.id}</TableCell>
                <TableCell>{c.nameHe}</TableCell>
                <TableCell>{c.nameEn}</TableCell>
                <TableCell>{c.sortOrder}</TableCell>
                <TableCell>{c.productCount}</TableCell>
                <TableCell>
                  <Chip label={c.isActive ? t('admin.active') : t('admin.inactive')} color={c.isActive ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => openEdit(c)} size="small"><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(c.id)} size="small" color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('common.edit') : t('admin.addCategory')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label={t('admin.nameHe')} fullWidth value={form.nameHe} onChange={e => setForm({ ...form, nameHe: e.target.value })} />
            <TextField label={t('admin.nameEn')} fullWidth value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} />
            <TextField label={t('admin.imageUrl')} fullWidth value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
            <TextField label="סדר מיון" type="number" fullWidth value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: +e.target.value })} />
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
