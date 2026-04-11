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
import { adminApi, PackageDto } from '../../services/api';

export default function AdminPackagesPage() {
  const { t } = useTranslation();
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PackageDto | null>(null);
  const [form, setForm] = useState({
    nameHe: '', nameEn: '', descriptionHe: '', descriptionEn: '',
    price: 0, originalPrice: 0, imageUrl: '', isActive: true,
  });

  const load = () => { adminApi.getPackages().then(setPackages); };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nameHe: '', nameEn: '', descriptionHe: '', descriptionEn: '', price: 0, originalPrice: 0, imageUrl: '', isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (p: PackageDto) => {
    setEditing(p);
    setForm({
      nameHe: p.nameHe, nameEn: p.nameEn,
      descriptionHe: p.descriptionHe || '', descriptionEn: p.descriptionEn || '',
      price: p.price, originalPrice: p.originalPrice,
      imageUrl: p.imageUrl || '', isActive: p.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form, items: editing?.items?.map(i => ({ productId: i.productId, quantity: i.quantity })) || [] };
    if (editing) {
      await adminApi.updatePackage(editing.id, payload);
    } else {
      await adminApi.createPackage(payload);
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (confirm('למחוק מארז זה?')) {
      await adminApi.deletePackage(id);
      load();
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{t('admin.managePackages')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>{t('admin.addPackage')}</Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>{t('admin.nameHe')}</TableCell>
              <TableCell>{t('common.price')}</TableCell>
              <TableCell>{t('package.originalPrice')}</TableCell>
              <TableCell>{t('package.discount')}</TableCell>
              <TableCell>{t('package.items')}</TableCell>
              <TableCell>{t('admin.active')}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {packages.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.nameHe}</TableCell>
                <TableCell>₪{p.price.toFixed(2)}</TableCell>
                <TableCell>₪{p.originalPrice.toFixed(2)}</TableCell>
                <TableCell>{p.discount}%</TableCell>
                <TableCell>{p.items.length}</TableCell>
                <TableCell>
                  <Chip label={p.isActive ? t('admin.active') : t('admin.inactive')} color={p.isActive ? 'success' : 'default'} size="small" />
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
        <DialogTitle>{editing ? t('common.edit') : t('admin.addPackage')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label={t('admin.nameHe')} fullWidth value={form.nameHe} onChange={e => setForm({ ...form, nameHe: e.target.value })} />
            <TextField label={t('admin.nameEn')} fullWidth value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} />
            <TextField label={t('admin.descriptionHe')} fullWidth multiline rows={2} value={form.descriptionHe} onChange={e => setForm({ ...form, descriptionHe: e.target.value })} />
            <TextField label={t('admin.descriptionEn')} fullWidth multiline rows={2} value={form.descriptionEn} onChange={e => setForm({ ...form, descriptionEn: e.target.value })} />
            <TextField label={t('common.price')} type="number" fullWidth value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} />
            <TextField label={t('package.originalPrice')} type="number" fullWidth value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: +e.target.value })} />
            <TextField label={t('admin.imageUrl')} fullWidth value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
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
