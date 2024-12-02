import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { StoreContext } from '../../../store';
import WarrantyForm from './WarrantyForm';
import useTranslation from 'next-translate/useTranslation';

const NewWarrantyDialog = observer(({ open, onClose }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const handleSubmit = async (values) => {
    await store.warranty.create(values);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('Add New Warranty')}</DialogTitle>
      <DialogContent>
        <WarrantyForm onSubmit={handleSubmit} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
});

export default NewWarrantyDialog;