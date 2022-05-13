import * as Yup from 'yup';

import { Box, DialogTitle, Grid } from '@material-ui/core';
import { Form, Formik } from 'formik';
import {
  FormNumberField,
  FormTextField,
  SelectField,
  SubmitButton,
} from '../Form';
import React, { useCallback, useContext, useMemo } from 'react';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { StoreContext } from '../../store';
import types from './types';
import { useDialog } from '../../utils/hooks';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  type: Yup.string().required(),
  name: Yup.string().required(),
  rent: Yup.number().min(0).required(),
});

const initialValues = {
  type: '',
  name: '',
  rent: '',
};

function NewPropertyDialog({ open, setOpen, backPage, backPath }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const _onSubmit = useCallback(
    async (propertyPart) => {
      let property = {
        ...propertyPart,
        price: propertyPart.rent,
      };

      const { status, data } = await store.property.create(property);
      if (status !== 200) {
        switch (status) {
          case 422:
            return store.pushToastMessage({
              message: t('Property name is missing'),
              severity: 'error',
            });
          case 403:
            return store.pushToastMessage({
              message: t('You are not allowed to add a property'),
              severity: 'error',
            });
          case 409:
            return store.pushToastMessage({
              message: t('The property already exists'),
              severity: 'error',
            });
          default:
            return store.pushToastMessage({
              message: t('Something went wrong'),
              severity: 'error',
            });
        }
      }

      handleClose();

      store.property.setSelected(data);
      await router.push(
        `/${store.organization.selected.name}/properties/${
          data._id
        }/${encodeURI(backPage)}/${encodeURIComponent(backPath)}`
      );
    },
    [store, handleClose, router, backPage, backPath, t]
  );

  const propertyTypes = useMemo(
    () =>
      types.map((type) => ({
        id: type.id,
        value: type.id,
        label: t(type.labelId),
      })),
    [t]
  );

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={handleClose}
      aria-labelledby="new-property-dialog"
    >
      <DialogTitle>{t('Add a new property')}</DialogTitle>
      <Box p={1}>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
        >
          {({ isSubmitting }) => {
            return (
              <Form autoComplete="off">
                <DialogContent>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={4}>
                      <SelectField
                        label={t('Property Type')}
                        name="type"
                        values={propertyTypes}
                      />
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <FormTextField label={t('Name')} name="name" />
                    </Grid>
                    <Grid item xs={12}>
                      <FormNumberField
                        label={t('Rent without expenses')}
                        name="rent"
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleClose} color="primary">
                    {t('Cancel')}
                  </Button>
                  <SubmitButton
                    label={!isSubmitting ? t('Add') : t('Adding property')}
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

export default function useNewPropertyDialog() {
  return useDialog(NewPropertyDialog);
}
