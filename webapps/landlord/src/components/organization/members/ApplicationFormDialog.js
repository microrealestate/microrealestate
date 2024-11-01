import * as Yup from 'yup';
import {
  createAppCredentials,
  QueryKeys,
  updateOrganization
} from '../../../utils/restcalls';
import { Form, Formik } from 'formik';
import { mergeOrganization, updateStoreOrganization } from '../utils';
import { RENTER_ROLE, ROLES } from '../../../store/User';
import { useCallback, useContext, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../ui/button';
import { DateField } from '../../formfields/DateField';
import moment from 'moment';
import ResponsiveDialog from '../../ResponsiveDialog';
import { SelectField } from '../../formfields/SelectField';
import { StoreContext } from '../../../store';
import { TextField } from '../../formfields/TextField';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

const applicationInitialValues = {
  name: '',
  expiryDate: null,
  role: RENTER_ROLE
};

export default function ApplicationFormDialog({
  open,
  setOpen,
  data: organization,
  onClose
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
  const { mutateAsync: mutateAppCredzAsync, isError: isAppCredzError } =
    useMutation({
      mutationFn: createAppCredentials
    });

  const handleClose = useCallback(
    (appCredz) => {
      setOpen(false);
      appCredz && onClose?.(appCredz);
    },
    [onClose, setOpen]
  );

  const handleCancel = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const _onSubmit = useCallback(
    async (app) => {
      if (!store.user.isAdministrator) {
        return;
      }
      // create app credentials
      const appCredz = await mutateAppCredzAsync({
        organization,
        expiryDate: app.expiryDate
      });

      await mutateAsync({
        store,
        organization: mergeOrganization(organization, {
          applications: [...organization.applications, { ...app, ...appCredz }]
        })
      });

      handleClose(appCredz);
    },
    [store, mutateAppCredzAsync, organization, mutateAsync, handleClose]
  );

  const roleValues = useMemo(
    () => ROLES.map((role) => ({ id: role, label: t(role), value: role })),
    [t]
  );

  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        name: Yup.string()
          .notOneOf(organization?.applications.map(({ name }) => name) || [])
          .required(),
        expiryDate: Yup.mixed()
          .required()
          .test('expiryDate_invalid', 'Date is invalid', (value) => {
            if (value) {
              return moment(value).isValid();
            }
            return true;
          })
          .test('expiryDate_past', 'Date must be in the future', (value) => {
            if (value) {
              return moment(value).isAfter(moment(), 'days');
            }
            return true;
          }),
        role: Yup.string()
          .required()
          .oneOf(roleValues.map(({ value }) => value))
      }),
    [organization?.applications, roleValues]
  );

  if (isError) {
    toast.error(t('Error adding application'));
  }

  if (isAppCredzError) {
    toast.error(t('Error creating application credentials'));
  }

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      isLoading={isLoading}
      renderHeader={() => t('New application')}
      renderContent={() => (
        <Formik
          initialValues={applicationInitialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
          innerRef={formRef}
        >
          {() => {
            return (
              <Form autoComplete="off">
                <div className="pt-6 space-y-4">
                  <div>
                    {t('Add an application credential to your organization')}
                  </div>
                  <TextField label={t('Name')} name="name" />
                  <SelectField
                    label={t('Role')}
                    name="role"
                    values={roleValues}
                  />
                  <DateField
                    label={t('Expiry date')}
                    name="expiryDate"
                    minDate={moment()}
                  />
                </div>
              </Form>
            );
          }}
        </Formik>
      )}
      renderFooter={() => (
        <>
          <Button variant="outline" onClick={handleCancel}>
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
