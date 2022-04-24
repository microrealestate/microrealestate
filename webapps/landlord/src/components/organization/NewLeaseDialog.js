import * as Yup from 'yup';

import { Box, DialogTitle } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { FormTextField, SubmitButton } from '../Form';
import React, { useCallback, useContext, useState } from 'react';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import RequestError from '../RequestError';
import { StoreContext } from '../../store';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  name: Yup.string().required(),
  stepperMode: Yup.boolean(),
});

const initialValues = {
  name: '',
  stepperMode: true,
};

const NewLeaseDialog = ({ open, setOpen, backPage, backPath }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const [error, setError] = useState('');

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const _onSubmit = useCallback(
    async (leasePart) => {
      const { status, data } = await store.lease.create(leasePart);
      if (status !== 200) {
        switch (status) {
          case 422:
            return setError(t('Contract name is missing'));
          case 403:
            return setError(t('You are not allowed to create a contract'));
          case 409:
            return setError(t('The contract already exists'));
          default:
            return setError(t('Something went wrong'));
        }
      }

      handleClose();

      store.lease.setSelected(data);
      await router.push(
        `/${store.organization.selected.name}/settings/lease/${
          data._id
        }/${encodeURI(backPage)}/${encodeURIComponent(backPath)}`
      );
    },
    [
      // t,
      router,
      handleClose,
      store.lease,
      store.organization?.selected?.name,
      backPage,
      backPath,
    ]
  );

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={handleClose}
      aria-labelledby="new-contract-dialog"
    >
      <DialogTitle>{t('Create a new contract')}</DialogTitle>
      <Box p={1}>
        <RequestError error={error} />
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
        >
          {({ isSubmitting }) => {
            return (
              <Form autoComplete="off">
                <DialogContent>
                  <FormTextField label={t('Name')} name="name" />
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleClose} color="primary">
                    {t('Cancel')}
                  </Button>
                  <SubmitButton
                    label={!isSubmitting ? t('Create') : t('Creating contract')}
                  />
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      </Box>
    </Dialog>
  );
};

export default NewLeaseDialog;
