import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import { mergeOrganization, updateStoreOrganization } from '../utils';
import { QueryKeys, updateOrganization, fetchProperties } from '../../../utils/restcalls';
import { useCallback, useContext, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../ui/button';
import ResponsiveDialog from '../../ResponsiveDialog';
import { SelectField } from '../../formfields/SelectField';
import { StoreContext } from '../../../store';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

const memberInitialValues = {
};

export default function PropertyManagerFormDialog({
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
      }),
    [organization?.members]
  );

  const { data: properties } = useQuery({
    queryKey: [QueryKeys.PROPERTIES],
    queryFn: () => fetchProperties(store),
    refetchOnMount: 'always',
    retry: 3,
  });

  // Transform the data if available
  const propValues = properties?.map((prop) => ({
    id: prop.id,
    label: t(prop.name) + ": " + t(prop.address.street1) + ", " + t(prop.address.city)+ ", " + t(prop.address.state),
    value: prop,
  }));

  if (isError) {
    toast.error(t('Error assigning property'));
  }

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      isLoading={isLoading}
      renderHeader={() => t('Assign Properties')}
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
                  <div>{t('Currently Assigned Properties')}</div>
                  <SelectField
                    label={t('Properties')}
                    name="property"
                    values={propValues}
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
