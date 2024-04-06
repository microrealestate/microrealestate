import { Form, Formik } from 'formik';
import { Button } from '../../ui/button';
import ResponsiveDialog from '../../ResponsiveDialog';
import { TextField } from '@microrealestate/commonui/components';
import { useCallback } from 'react';
import useDialog from '../../../hooks/useDialog';
import useTranslation from 'next-translate/useTranslation';

function ApplicationShowDialog({ open, setOpen, appcredz, onClose }) {
  const { t } = useTranslation('common');

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose, setOpen]);

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      renderHeader={() => t('Created credentials')}
      renderContent={() => (
        <Formik initialValues={appcredz}>
          <Form autoComplete="off">
            {t(
              "Copy the credentials below and keep them safe. You won't be able to retrieve them again."
            )}
            <TextField label={t('clientId')} name="clientId" />
            <TextField
              label={t('clientSecret')}
              name="clientSecret"
              multiline
              maxRows={5}
            />
          </Form>
        </Formik>
      )}
      renderFooter={() => <Button onClick={handleClose}>{t('Close')}</Button>}
    />
  );
}

export default function useApplicationShowDialog() {
  return useDialog(ApplicationShowDialog);
}
