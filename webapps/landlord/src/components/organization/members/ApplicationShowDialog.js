import { Form, Formik } from 'formik';
import { Button } from '../../ui/button';
import ResponsiveDialog from '../../ResponsiveDialog';
import { TextAreaField } from '../../formfields/TextAreaField';
import { TextField } from '../../formfields/TextField';
import { useCallback } from 'react';
import useTranslation from 'next-translate/useTranslation';

export default function ApplicationShowDialog({
  open,
  setOpen,
  data: appcredz,
  onClose
}) {
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
            <div className="pt-6 space-y-4">
              <div>
                {t(
                  "Copy the credentials below and keep them safe. You won't be able to retrieve them again."
                )}
              </div>
              <TextField label={t('clientId')} name="clientId" readOnly />
              <TextAreaField
                label={t('clientSecret')}
                name="clientSecret"
                rows={6}
                readOnly
              />
            </div>
          </Form>
        </Formik>
      )}
      renderFooter={() => <Button onClick={handleClose}>{t('Close')}</Button>}
    />
  );
}
