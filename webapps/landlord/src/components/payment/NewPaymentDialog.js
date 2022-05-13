import {
  Box,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@material-ui/core';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useComponentMountedRef, useDialog } from '../../utils/hooks';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { NumberFormat } from '../../utils/numberformat';
import { StoreContext } from '../../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

function NewPaymentDialog({ open, setOpen, backPage, backPath }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const [loading, setLoading] = useState(true);
  const [rents, setRents] = useState([]);
  const [selectedRent, setSelectedRent] = useState({});
  const mountedRef = useComponentMountedRef();

  useEffect(() => {
    const fetchRents = async () => {
      const { status, data } = await store.rent.fetchWithoutUpdatingStore();
      if (mountedRef.current) {
        setLoading(false);
        if (status !== 200) {
          store.pushToastMessage({
            message: t('Something went wrong'),
            severity: 'error',
          });
          return setRents([]);
        }
        setRents(data.rents);
      }
    };
    fetchRents();
  }, [mountedRef, store, store.rent, t]);

  const onRentChange = (event) => {
    setSelectedRent(event.target.value);
  };

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const onSubmit = useCallback(async () => {
    handleClose();
    store.rent.setSelected(selectedRent);
    await router.push(
      `/${store.organization.selected.name}/payment/${
        selectedRent.occupant._id
      }/${selectedRent.term}/${encodeURI(backPage)}/${encodeURIComponent(
        backPath
      )}`
    );
  }, [
    router,
    handleClose,
    selectedRent,
    store.organization?.selected?.name,
    store.rent,
    backPage,
    backPath,
  ]);

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={handleClose}
      aria-labelledby="new-payment-dialog"
    >
      <DialogTitle>{t('Select a rent to pay')}</DialogTitle>
      <Box p={1}>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel>{t('Rent')}</InputLabel>
            <Select value={selectedRent} onChange={onRentChange}>
              {!loading &&
                rents
                  .sort(
                    (
                      { occupant: { name: n1 } },
                      { occupant: { name: n2 } }
                    ) => {
                      n1.localeCompare(n2);
                    }
                  )
                  .map((rent) => (
                    <MenuItem key={rent._id} value={rent}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        width="100%"
                      >
                        <Typography>{rent.occupant.name}</Typography>
                        <NumberFormat
                          value={rent.newBalance}
                          variant="h6"
                          withColor
                        />
                      </Box>
                    </MenuItem>
                  ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={onSubmit}
            disabled={!!selectedRent.occupant === false}
          >
            {t('Enter')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default function useNewPaymentDialog() {
  return useDialog(NewPaymentDialog);
}
