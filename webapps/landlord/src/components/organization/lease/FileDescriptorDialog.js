import * as Yup from 'yup';

import { Box, DialogContentText, DialogTitle } from '@material-ui/core';
import { Form, Formik } from 'formik';
import {
  FormTextField,
  RadioField,
  RadioFieldGroup,
  SubmitButton,
} from '../../Form';
import React, { useCallback, useMemo } from 'react';

import Button from '@material-ui/core/Button';
import { CheckboxField } from '../../Form';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import { useDialog } from '../../../utils/hooks';
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
  required: 'notRequired',
};

function FileDescriptorDialog({ open, setOpen, onSave }) {
  const { t } = useTranslation('common');

  const formData = useMemo(() => {
    if (open === false) {
      return initialValues;
    }
    return {
      ...initialValues,
      ...open,
      required: open.required
        ? 'required'
        : open.requiredOnceContractTerminated
        ? 'requiredOnceContractTerminated'
        : 'notRequired',
    };
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const _onSubmit = useCallback(
    async (fileDescriptor) => {
      await onSave({
        ...fileDescriptor,
        required: fileDescriptor.required === 'required',
        requiredOnceContractTerminated:
          fileDescriptor.required === 'requiredOnceContractTerminated',
      });
      handleClose();
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
          initialValues={formData}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
        >
          {() => {
            return (
              <Form autoComplete="off">
                <DialogContent>
                  <Box width="100%">
                    <FormTextField label={t('Name')} name="name" />
                    <FormTextField
                      label={t('Description')}
                      name="description"
                    />
                  </Box>
                  <Box width="100%" my={2}>
                    <CheckboxField
                      name="hasExpiryDate"
                      label={t('An expiry date must be provided')}
                      aria-label={t('An expiry date must be provided')}
                    />
                  </Box>
                  <Box width="100%" mb={2}>
                    <RadioFieldGroup
                      aria-label={t('The document is')}
                      label={t('The document is')}
                      name="required"
                    >
                      <RadioField
                        value="notRequired"
                        label={t('Optional')}
                        data-cy="fileOptional"
                      />
                      <RadioField
                        value="required"
                        label={t('Mandatory')}
                        data-cy="fileRequired"
                      />
                      <RadioField
                        value="requiredOnceContractTerminated"
                        label={t('Mandatory only when contract is terminated')}
                        data-cy="fileRequiredOnceContractTerminated"
                      />
                    </RadioFieldGroup>
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleClose} color="primary">
                    {t('Cancel')}
                  </Button>
                  <SubmitButton
                    label={formData?._id ? t('Update') : t('Add')}
                    data-cy="submitFileDescriptor"
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

export default function useFileDescriptorDialog() {
  return useDialog(FileDescriptorDialog);
}
