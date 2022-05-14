import * as Yup from 'yup';

import { Box, DialogTitle, Grid } from '@material-ui/core';
import {
  CancelButton,
  DateField,
  SelectField,
  SubmitButton,
  UploadField,
} from './Form';
import { Form, Formik, useFormikContext } from 'formik';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import moment from 'moment';
import { StoreContext } from '../store';
import { toJS } from 'mobx';
import { uploadDocument } from '../utils/fetch';
import { useDialog } from '../utils/hooks';
import useTranslation from 'next-translate/useTranslation';

// TODO: constants to share between frontend and backend
const MAX_FILE_SIZE = 20_971_520; // 20M in bytes
const SUPPORTED_MIMETYPES = [
  'image/gif',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/jpe',
  'application/pdf',
];
const validationSchema = Yup.object().shape({
  template: Yup.object().required(),
  description: Yup.string(),
  file: Yup.mixed()
    .nullable()
    .required()
    .test(
      'MAX_FILE_SIZE',
      'File is too big. Maximum size is 2Go.',
      (value) => value && value.size <= MAX_FILE_SIZE
    )
    .test(
      'FILE_FORMAT',
      'File is not allowed. Only images or pdf are accepted.',
      (value) => value && SUPPORTED_MIMETYPES.includes(value.type)
    ),
  expiryDate: Yup.mixed()
    .when('template', (template, schema) => {
      return template?.hasExpiryDate ? schema.required() : schema;
    })
    .test('expiryDate', 'Date is invalid', (value) => {
      if (value) {
        return moment(value).isValid();
      }
      return true;
    }),
});

const initialValues = {
  template: '',
  description: '',
  file: '',
  expiryDate: null,
};

const FormDialog = ({ open, onClose, children }) => {
  const { isSubmitting, resetForm } = useFormikContext();

  const handleClose = useCallback(
    (e) => {
      resetForm();
      onClose && onClose(e);
    },
    [onClose, resetForm]
  );

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={!!open}
      onClose={handleClose}
      disableEscapeKeyDown={isSubmitting}
    >
      {children}
    </Dialog>
  );
};

function UploadDialog({ open, setOpen, onSave }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const uploadTemplates = store.template.items
      .filter(
        (template) =>
          template.type === 'fileDescriptor' &&
          template.linkedResourceIds?.includes(store.tenant.selected?.leaseId)
      )
      .map((template) => ({
        id: template._id,
        label: template.name,
        description: template.description,
        value: toJS(template),
      }));
    setTemplates(uploadTemplates);
  }, [store.template.items, store.tenant.selected]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const _onSubmit = useCallback(
    async (doc, { resetForm }) => {
      doc.name = doc.template.name;
      doc.description = doc.template.description;
      doc.mimeType = doc.file.type;
      try {
        const response = await uploadDocument({
          endpoint: '/documents/upload',
          documentName: doc.template.name,
          file: doc.file,
          folder: [
            store.tenant.selected.name.replace(/[/\\]/g, '_'),
            'contract_scanned_documents',
          ].join('/'),
        });

        doc.url = response.data.key;
        doc.versionId = response.data.versionId;
      } catch (error) {
        console.error(error);
        store.pushToastMessage({
          message: t('Cannot upload document'),
          severity: 'error',
        });
        return;
      }
      handleClose();
      try {
        await onSave(doc);
        resetForm();
      } catch (error) {
        console.error(error);
        store.pushToastMessage({
          message: t('Cannot save document'),
          severity: 'error',
        });
      }
    },
    [handleClose, t, onSave, store]
  );

  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={_onSubmit}
      >
        {({ isSubmitting, values }) => {
          return (
            <FormDialog open={open} onClose={handleClose}>
              <DialogTitle>{t('Document to upload')}</DialogTitle>
              <Box p={1}>
                <Form autoComplete="off">
                  <DialogContent>
                    <Grid container>
                      <Grid item xs={12}>
                        <SelectField
                          label={t('Document')}
                          name="template"
                          values={templates}
                        />
                      </Grid>
                      {values.template?.hasExpiryDate && (
                        <Grid item xs={12}>
                          <DateField
                            label={t('Expiry date')}
                            name="expiryDate"
                          />
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <UploadField name="file" />
                      </Grid>
                    </Grid>
                  </DialogContent>
                  <DialogActions>
                    <CancelButton label={t('Cancel')} onClick={handleClose} />
                    <SubmitButton
                      label={!isSubmitting ? t('Upload') : t('Uploading')}
                    />
                  </DialogActions>
                </Form>
              </Box>
            </FormDialog>
          );
        }}
      </Formik>
    </>
  );
}

export default function useUploadDialog() {
  return useDialog(UploadDialog);
}
