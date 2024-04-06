import * as Yup from 'yup';
import {
  CheckboxField,
  RadioField,
  RadioFieldGroup,
  TextField
} from '@microrealestate/commonui/components';
import { Form, Formik } from 'formik';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '../../ui/button';
import ResponsiveDialog from '../../ResponsiveDialog';
import useDialog from '../../../hooks/useDialog';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  _id: Yup.string(),
  name: Yup.string().required(),
  description: Yup.string(),
  hasExpiryDate: Yup.boolean()
});

const initialValues = {
  name: '',
  description: '',
  hasExpiryDate: false,
  required: 'notRequired'
};

function FileDescriptorDialog({ open, setOpen, onSave }) {
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef();

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
          : 'notRequired'
    };
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const _onSubmit = useCallback(
    async (fileDescriptor) => {
      try {
        setIsLoading(true);
        await onSave({
          ...fileDescriptor,
          required: fileDescriptor.required === 'required',
          requiredOnceContractTerminated:
            fileDescriptor.required === 'requiredOnceContractTerminated'
        });
        handleClose();
      } finally {
        setIsLoading(false);
      }
    },
    [handleClose, onSave]
  );

  return (
    <ResponsiveDialog
      open={!!open}
      setOpen={setOpen}
      isLoading={isLoading}
      renderHeader={() => (
        <>
          <div>{t('Template document to upload')}</div>
          <div className="text-base text-muted-foreground font-normal">
            {t(
              'Describe the document that will be uploaded when creating the lease'
            )}
          </div>
        </>
      )}
      renderContent={() => (
        <Formik
          initialValues={formData}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
          innerRef={formRef}
        >
          {() => {
            return (
              <Form autoComplete="off">
                <TextField label={t('Name')} name="name" />
                <TextField label={t('Description')} name="description" />
                <CheckboxField
                  name="hasExpiryDate"
                  label={t('An expiry date must be provided')}
                  aria-label={t('An expiry date must be provided')}
                />
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
              </Form>
            );
          }}
        </Formik>
      )}
      renderFooter={() => (
        <>
          <Button variant="outline" onClick={handleClose}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={() => formRef.current.submitForm()}
            data-cy="submitFileDescriptor"
          >
            {formData?._id ? t('Update') : t('Add')}
          </Button>
        </>
      )}
    />
  );
}

export default function useFileDescriptorDialog() {
  return useDialog(FileDescriptorDialog);
}
