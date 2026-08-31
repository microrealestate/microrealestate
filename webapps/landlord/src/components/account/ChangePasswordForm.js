import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Form, Formik } from 'formik';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import {
  confirmationPasswordSchema,
  PASSWORD_HELP,
  passwordSchema
} from '@/utils/passwordschema';

const initialValues = {
  currentPassword: '',
  newPassword: '',
  confirmationPassword: ''
};

const validationSchema = Yup.object().shape({
  currentPassword: Yup.string().required(),
  newPassword: passwordSchema,
  confirmationPassword: confirmationPasswordSchema('newPassword')
});

function ChangePasswordForm() {
  const t = useTranslations('common');
  const store = useStore();
  const router = useRouter();

  const onSubmit = async ({ currentPassword, newPassword }, { resetForm }) => {
    try {
      const { status, error } = await store.user.changePassword(
        currentPassword,
        newPassword
      );

      if (status === 200) {
        toast.success(t('Password updated. Please sign in again.'));
        // the server already revoked the session, this clears the client state
        await store.user.signOut();
        router.push('/signin');
        return;
      }

      resetForm();
      switch (error) {
        case 'invalid current password':
          toast.error(t('The current password is incorrect'));
          return;
        case 'same password':
          toast.error(
            t('The new password must be different from the current one')
          );
          return;
        case 'weak password':
          toast.error(
            t('The password does not meet the security requirements')
          );
          return;
        default:
          if (status === 422) {
            toast.error(t('Some fields are missing'));
            return;
          }
          toast.error(t('Something went wrong'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('Something went wrong'));
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      <Form className="space-y-4">
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={store.user.email || ''}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />
        <TextField
          id="currentPassword"
          label={t('Current password')}
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          data-cy="currentPassword"
        />
        <TextField
          id="newPassword"
          label={t('New password')}
          name="newPassword"
          type="password"
          autoComplete="new-password"
          description={t(PASSWORD_HELP)}
          data-cy="newPassword"
        />
        <TextField
          id="confirmationPassword"
          label={t('Confirmation password')}
          name="confirmationPassword"
          type="password"
          autoComplete="new-password"
          data-cy="confirmationPassword"
        />
        <SubmitButton label={t('Change password')} />
      </Form>
    </Formik>
  );
}

export default observer(ChangePasswordForm);
