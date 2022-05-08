import * as Yup from 'yup';

import { Box, DialogTitle, Grid } from '@material-ui/core';
import { Form, Formik } from 'formik';
import {
  FormNumberField,
  FormTextField,
  SelectField,
  SubmitButton,
} from '../Form';
import React, { useCallback, useContext, useMemo, useState } from 'react';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import RequestError from '../RequestError';
import { StoreContext } from '../../store';
import types from './types';
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

const NewPropertyDialog = ({ open, setOpen, backPage, backPath }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const [error, setError] = useState('');

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
            return setError(t('Property name is missing'));
          case 403:
            return setError(t('You are not allowed to add a property'));
          case 409:
            return setError(t('The property already exists'));
          default:
            return setError(t('Something went wrong'));
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
    [
      t,
      router,
      handleClose,
      store.organization,
      store.property,
      backPage,
      backPath,
    ]
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
};

export default NewPropertyDialog;
