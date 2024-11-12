import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import React, { useCallback, useContext, useRef, useState } from 'react';
import { Button } from '../../ui/button';
import ResponsiveDialog from '../../ResponsiveDialog';
import { StoreContext } from '../../../store';
import { TextField } from '../../formfields/TextField';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  name: Yup.string().required(),
  stepperMode: Yup.boolean()
});

const initialValues = {
  name: '',
  stepperMode: true
};

export default function NewLeaseDialog({ open, setOpen }) {
  const { t } = useTranslation('common');
  const formRef = useRef();
  const store = useContext(StoreContext);
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
            case 403:
              return toast.error(t('You are not allowed to create a contract'));
            case 409:
              return toast.error(t('The contract already exists'));
            default:
              return toast.error(t('Something went wrong'));
          }
        }

        handleClose();
        store.lease.setSelected(data);
        store.appHistory.setPreviousPath(router.asPath);
        await router.push(
          `/${store.organization.selected.name}/settings/contracts/${data._id}`
        );
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
      renderHeader={() => t('Create a contract')}
      renderContent={() => (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
          innerRef={formRef}
        >
          {() => {
            return (
              <Form autoComplete="off">
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
