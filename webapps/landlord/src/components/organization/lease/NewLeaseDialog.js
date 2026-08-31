import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { Form, Formik } from 'formik';
import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import ResponsiveDialog from '../../ResponsiveDialog';

const validationSchema = Yup.object().shape({
  name: Yup.string().required(),
  stepperMode: Yup.boolean()
});

const initialValues = {
  name: '',
  stepperMode: true
};

export default function NewLeaseDialog({ open, setOpen }) {
  const t = useTranslations('common');
  const formRef = useRef();
  const store = useStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const _onSubmit = useCallback(
    async (leasePart) => {
      try {
        setIsLoading(true);
        const { status, data } = await store.lease.create(leasePart);
        if (status !== 200) {
          switch (status) {
            case 422:
              return toast.error(t('Contract name is missing'));
            case 409:
              return toast.error(t('The contract already exists'));
            default:
              return toast.error(t('Something went wrong'));
          }
        }

        handleClose();
        store.lease.setSelected(data);
        await router.push(`/settings/contracts/${data._id}`);
      } finally {
        setIsLoading(false);
      }
    },
    [store, handleClose, router, t]
  );

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      isLoading={isLoading}
      title={t('Create a contract')}
      renderContent={() => (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
          innerRef={formRef}
        >
          {() => {
            return (
              <Form autoComplete="off" className="w-full">
                <TextField label={t('Name')} name="name" />
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
            data-cy="submitContract"
          >
            {t('Create')}
          </Button>
        </>
      )}
    />
  );
}
