import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import { mergeOrganization, updateStoreOrganization } from '../utils';
import { QueryKeys, updateOrganization } from '../../../utils/restcalls';
import { RENTER_ROLE, ROLES } from '../../../store/User';
import { useCallback, useContext, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../ui/button';
import ResponsiveDialog from '../../ResponsiveDialog';
import { SelectField } from '../../formfields/SelectField';
import { StoreContext } from '../../../store';
import { TextField } from '../../formfields/TextField';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

const memberInitialValues = {
  email: '',
  role: RENTER_ROLE
};

export default function MemberFormDialog({
  open,
  setOpen,
  data: organization
}) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const formRef = useRef();
  const queryClient = useQueryClient();
  const { mutateAsync, isLoading, isError } = useMutation({
    mutationFn: updateOrganization,
    onSuccess: (organization) => {
      updateStoreOrganization(store, organization);
      queryClient.invalidateQueries({ queryKey: [QueryKeys.ORGANIZATIONS] });
    }
  });

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const _onSubmit = useCallback(
    async (member) => {
      await mutateAsync({
        store,
        organization: mergeOrganization(organization, {
          members: [...organization.members, member]
        })
      });
      handleClose();
    },
    [mutateAsync, store, organization, handleClose]
  );

  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        email: Yup.string()
          .email()
          .notOneOf(organization?.members.map(({ email }) => email) || [])
          .required(),
        role: Yup.string().required()
      }),
    [organization?.members]
  );

  const roleValues = useMemo(
    () => ROLES.map((role) => ({ id: role, label: t(role), value: role })),
    [t]
  );

  if (isError) {
    toast.error(t('Error adding member'));
  }

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      isLoading={isLoading}
      renderHeader={() => t('New collaborator')}
      renderContent={() => (
        <Formik
          initialValues={memberInitialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
          innerRef={formRef}
        >
          {() => {
            return (
              <Form autoComplete="off">
                <div className="pt-6 space-y-4">
                  <div>{t('Add a collaborator to your organization')}</div>
                  <TextField label={t('Email')} name="email" />
                  <SelectField
                    label={t('Role')}
                    name="role"
                    values={roleValues}
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
            {t('Add')}
          </Button>
        </>
      )}
    />
  );
}
