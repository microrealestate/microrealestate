import * as Yup from 'yup';

import { Box, DialogContentText, DialogTitle, Grid } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { FormTextField, SubmitButton } from '../../Form';
import React, { useCallback } from 'react';

import Button from '@material-ui/core/Button';
import { CheckboxField } from '../../Form';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  _id: Yup.string(),
  name: Yup.string().required(),
  description: Yup.string(),
  hasExpiryDate: Yup.boolean(),
});

const initialValues = {
  name: '',
  description: '',
  hasExpiryDate: false,
};

export default function FileDescriptorDialog({ open, setOpen, onSave }) {
  const { t } = useTranslation('common');

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const _onSubmit = useCallback(
    async (fileDescriptor) => {
      handleClose();
      onSave(fileDescriptor);
    },
    [handleClose, onSave]
  );

  return (
    <Dialog maxWidth="sm" fullWidth open={!!open} onClose={handleClose}>
      <DialogTitle>{t('Template document to upload')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t(
            'Describe the document that will be uploaded when creating the lease'
          )}
        </DialogContentText>
      </DialogContent>
      <Box p={1}>
        <Formik
          initialValues={open?.name ? open : initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
        >
          {() => {
            return (
              <Form autoComplete="off">
                <DialogContent>
                  <Grid container>
                    <Grid item xs={12}>
                      <FormTextField label={t('Name')} name="name" />
                    </Grid>
                    <Grid item xs={12}>
                      <FormTextField
                        label={t('Description')}
                        name="description"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <CheckboxField
                        name="hasExpiryDate"
                        label={t('Expiry date required')}
                        aria-label={t('Expiry date required')}
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleClose} color="primary">
                    {t('Cancel')}
                  </Button>
                  <SubmitButton
                    label={open?._id >= 0 ? t('Update') : t('Add')}
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
