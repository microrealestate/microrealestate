import {
  Box,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core';
import { getRentAmounts, RentAmount } from '../rents/RentDetails';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { flushSync } from 'react-dom';
import Hidden from '../HiddenSSRCompatible';
import PaymentTabs from './PaymentTabs';
import { StoreContext } from '../../store';
import useDialog from '../../hooks/useDialog';
import useTranslation from 'next-translate/useTranslation';

function NewPaymentDialog({ open, setOpen, onClose }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [loading, setLoading] = useState(true);
  const [rents, setRents] = useState([]);
  const [selectedRent, setSelectedRent] = useState({});
  const formRef = useRef();

  useEffect(() => {
    const fetchRents = async () => {
      const { status, data } = await store.rent.fetchWithoutUpdatingStore();

      if (status !== 200) {
        store.pushToastMessage({
          message: t('Something went wrong'),
          severity: 'error',
        });
        setRents([]);
      } else {
        setRents(data.rents);
      }
      setLoading(false);
    };

    if (open) {
      setLoading(true);
      if (!open?._id) {
        fetchRents();
      } else {
        const rent = open;
        setTimeout(() => {
          flushSync(() => {
            setSelectedRent(rent);
          });
          flushSync(() => {
            setRents([rent]);
          });
          setLoading(false);
        });
      }
    }
  }, [open, store, t]);

  const onRentChange = async (event) => {
    const rent = event.target.value;
    setSelectedRent(rent);
    formRef.current?.setValues(rent);
  };

  const handleClose = useCallback(
    (event, reason) => {
      if (reason === 'backdropClick') {
        return;
      }
      setOpen(false);
    },
    [setOpen]
  );

  const handleSave = useCallback(() => {
    formRef.current.submit();
  }, []);

  const handleSubmit = useCallback(() => {
    onClose?.(selectedRent);
    handleClose();
  }, [handleClose, onClose, selectedRent]);

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={!!open}
      onClose={handleClose}
      aria-labelledby="new-payment-dialog"
    >
      <DialogTitle>
        {rents?.length > 1
          ? t('Select a rent to pay')
          : t('Enter a rent settlement')}
      </DialogTitle>
      <DialogContent>
        <Box p={1}>
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
                  .map((rent) => {
                    const rentAmounts = getRentAmounts(rent);
                    return (
                      <MenuItem key={rent._id} value={rent}>
                        <Hidden smDown>
                          <Grid container>
                            <Grid item sm={6}>
                              <Box
                                display="flex"
                                alignItems="end"
                                height="100%"
                                fontSize="subtitle1.fontSize"
                              >
                                {rent.occupant.name}
                              </Box>
                            </Grid>
                            <Grid item sm={3}>
                              <RentAmount
                                label={t('Rent due')}
                                amount={rentAmounts.totalAmount}
                                color={
                                  rentAmounts.totalAmount <= 0
                                    ? 'text.secondary'
                                    : 'warning.dark'
                                }
                              />
                            </Grid>
                            <Grid item sm={3}>
                              <RentAmount
                                label={t('Settlement')}
                                amount={
                                  rentAmounts.payment !== 0
                                    ? rentAmounts.payment
                                    : null
                                }
                              />
                            </Grid>
                          </Grid>
                        </Hidden>
                        <Hidden mdUp>
                          <Box
                            display="flex"
                            flexDirection="column"
                            width="100%"
                          >
                            <Box fontSize="body2.fontSize" mb={1}>
                              {rent.occupant.name}
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                              <RentAmount
                                label={t('Rent due')}
                                amount={rentAmounts.totalAmount}
                                color={
                                  rentAmounts.totalAmount <= 0
                                    ? 'text.secondary'
                                    : 'warning.dark'
                                }
                              />
                              <RentAmount
                                label={t('Settlement')}
                                amount={
                                  rentAmounts.payment !== 0
                                    ? rentAmounts.payment
                                    : null
                                }
                              />
                            </Box>
                          </Box>
                        </Hidden>
                      </MenuItem>
                    );
                  })}
            </Select>
          </FormControl>
          {selectedRent.term ? (
            <Box mt={2}>
              <PaymentTabs
                ref={formRef}
                rent={selectedRent}
                onSubmit={handleSubmit}
              />
            </Box>
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          {t('Cancel')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={!!selectedRent.occupant === false}
        >
          {t('Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function useNewPaymentDialog() {
  return useDialog(NewPaymentDialog);
}
