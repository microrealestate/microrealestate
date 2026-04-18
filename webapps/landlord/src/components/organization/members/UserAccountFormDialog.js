import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import { createUserAccount, QueryKeys } from '../../../utils/restcalls';
import { RENTER_ROLE, ROLES } from '../../../store/User';
import { useCallback, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../ui/button';
import ResponsiveDialog from '../../ResponsiveDialog';
import { SelectField } from '../../formfields/SelectField';
import { TextField } from '../../formfields/TextField';
import { SwitchField } from '../../formfields/SwitchField';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

const initialValues = {
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  passwordChangeRequired: true,
  role: RENTER_ROLE
};

export default function UserAccountFormDialog({ open, setOpen, data: organization }) {
  const { t } = useTranslation('common');
  const formRef = useRef();
  const queryClient = useQueryClient();
  const { mutateAsync: createAccountAsync, isLoading, isError } = useMutation({
    mutationFn: createUserAccount,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QueryKeys.ORGANIZATIONS]
      });
    }
  });

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const onSubmit = useCallback(
    async (account) => {
      try {
        await createAccountAsync({
          organization,
          firstname: account.firstname,
          lastname: account.lastname,
          email: account.email,
          password: account.password,
          passwordChangeRequired: account.passwordChangeRequired,
          role: account.role
        });

        toast.success(t('User account created'));
        handleClose();
      } catch (error) {
        console.error(error);
        toast.error(t('Error creating user account'));
      }
    },
    [createAccountAsync, handleClose, organization, t]
  );

  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        firstname: Yup.string().required(),
        lastname: Yup.string().required(),
        email: Yup.string()
          .email()
          .notOneOf(organization?.members.map(({ email }) => email) || [])
          .required(),
        password: Yup.string().required(),
        passwordChangeRequired: Yup.boolean().required(),
        role: Yup.string().required()
      }),
    [organization?.members]
  );

  const roleValues = useMemo(
    () => ROLES.map((role) => ({ id: role, label: t(role), value: role })),
    [t]
  );

  if (isError) {
    toast.error(t('Error creating user account'));
  }

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      isLoading={isLoading}
      renderHeader={() => t('New user account')}
      renderContent={() => (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
          innerRef={formRef}
        >
          {() => {
            return (
              <Form autoComplete="off">
                <div className="pt-6 space-y-4">
                  <div>{t('Create a user account for your organization')}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label={t('First name')} name="firstname" />
                    <TextField label={t('Last name')} name="lastname" />
                  </div>
                  <TextField label={t('Email')} name="email" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField label={t('Password')} name="password" type="password" />
                    <SelectField label={t('Role')} name="role" values={roleValues} />
                  </div>
                  <SwitchField
                    label={t('Require password change on first login')}
                    name="passwordChangeRequired"
                  />
                </div>
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
          <Button onClick={() => formRef.current.submitForm()}>
            {t('Create')}
          </Button>
        </>
      )}
    />
  );
}