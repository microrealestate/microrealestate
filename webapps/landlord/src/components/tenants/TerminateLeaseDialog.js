import * as Yup from 'yup';

import {
  Box,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@material-ui/core';
import { DateField, FormNumberField, SubmitButton } from '../Form';
import { Form, Formik } from 'formik';
import React, { useContext, useState } from 'react';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import moment from 'moment';
import { StoreContext } from '../../store';
import { toJS } from 'mobx';
import { useDialog } from '../../utils/hooks';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  terminationDate: Yup.date().required(),
  guarantyPayback: Yup.number().min(0),
});

function TerminateLeaseDialog({ open, setOpen, tenantList }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [selectedTenant, setSelectedTenant] = useState({});

  const initialValues = {
    terminationDate:
      !tenantList && store.tenant.selected?.terminationDate
        ? moment(store.tenant.selected.terminationDate, 'DD/MM/YYYY')
        : null,
    guarantyPayback: !tenantList ? store.tenant.selected?.guarantyPayback : '',
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onTenantChange = (event) => {
    setSelectedTenant(event.target.value);
  };

  const _onSubmit = async (tenantPart) => {
    const tenant = {
      ...toJS(selectedTenant._id ? selectedTenant : store.tenant.selected),
      terminationDate: tenantPart.terminationDate.format('DD/MM/YYYY'),
      guarantyPayback: tenantPart.guarantyPayback || 0,
    };

    const { status, data } = await store.tenant.update(tenant);

    if (status !== 200) {
      switch (status) {
        case 422:
          return store.pushToastMessage({
            message: t('Tenant name is missing'),
            severity: 'error',
          });
        case 403:
          return store.pushToastMessage({
            message: t('You are not allowed to update the tenant'),
            severity: 'error',
          });
        case 409:
          return store.pushToastMessage({
            message: t('The tenant already exists'),
            severity: 'error',
          });
        default:
          return store.pushToastMessage({
            message: t('Something went wrong'),
            severity: 'error',
          });
      }
    }

    store.tenant.setSelected(data);

    handleClose(false);
  };

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={handleClose}
      aria-labelledby="new-tenant-dialog"
    >
      <DialogTitle>
        {tenantList
          ? t('Terminate a lease')
          : t("Terminate {{tenant}}'s lease", {
              tenant: store.tenant.selected.name,
            })}
      </DialogTitle>
      <Box p={1}>
        {!!tenantList && (
          <DialogContent>
            <FormControl fullWidth>
              <InputLabel>{t('Tenant')}</InputLabel>
              <Select value={selectedTenant} onChange={onTenantChange}>
                {tenantList
                  .sort((t1, t2) => {
                    t1.name.localeCompare(t2.name);
                  })
                  .map((tenant) => (
                    <MenuItem key={tenant._id} value={tenant}>
                      <Typography>{tenant.name}</Typography>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </DialogContent>
        )}
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
        >
          {({ isSubmitting }) => {
            return (
              <Form autoComplete="off">
                <DialogContent>
                  <DateField
                    label={t('Termination date')}
                    name="terminationDate"
                    minDate={
                      store.tenant.selected?.beginDate
                        ? moment(store.tenant.selected.beginDate, 'DD/MM/YYYY')
                        : undefined
                    }
                    maxDate={
                      store.tenant.selected?.endDate
                        ? moment(store.tenant.selected.endDate, 'DD/MM/YYYY')
                        : undefined
                    }
                  />
                  <FormNumberField
                    label={t('Amount of the deposit refund')}
                    name="guarantyPayback"
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleClose} color="primary">
                    {t('Cancel')}
                  </Button>
                  <SubmitButton
                    label={!isSubmitting ? t('Terminate') : t('Terminating')}
                    disabled={tenantList && !!selectedTenant._id === false}
                  />
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      </Box>
    </Dialog>
  );
}

export default function useTerminateLeaseDialog() {
  return useDialog(TerminateLeaseDialog);
}
