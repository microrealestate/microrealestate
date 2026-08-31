import { SelectField } from '@microrealestate/commonui/components/formfields/SelectField';
import { SwitchField } from '@microrealestate/commonui/components/formfields/SwitchField';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { toJS } from 'mobx';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { useRouter } from '@/i18n/navigation';
import { useStore } from '@/providers/StoreProvider';
import { fetchTenants, QueryKeys } from '@/utils/restcalls';
import ResponsiveDialog from '../ResponsiveDialog';

const validationSchema = Yup.object().shape({
  name: Yup.string().required(),
  isCopyFrom: Yup.boolean(),
  copyFrom: Yup.mixed().when('isCopyFrom', {
    is: true,
    then: Yup.string().required()
  })
});

const initialValues = {
  name: '',
  copyFrom: '',
  isCopyFrom: false
};

export default function NewTenantDialog({ open, setOpen }) {
  const t = useTranslations('common');
  const store = useStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef();

  const tenantsQuery = useQuery({
    queryKey: [QueryKeys.TENANTS],
    queryFn: () => fetchTenants(store),
    refetchOnMount: 'always',
    retry: 3,
    enabled: !!open
  });

  const handleClose = () => {
    setOpen(false);
  };

  const _onSubmit = async (tenantPart) => {
    try {
      setIsLoading(true);
      let tenant = {
        name: tenantPart.name,
        company: tenantPart.name,
        beginDate: moment().startOf('day'),
        stepperMode: true
      };
      if (tenantPart.isCopyFrom) {
        const {
          _id,
          reference: _reference,
          name: _name,
          terminated: _terminated,
          beginDate: _beginDate,
          endDate: _endDate,
          terminationDate: _terminationDate,
          properties: _properties,
          discount: _discount,
          expectedSecurityDeposit: _expectedSecurityDeposit,
          securityDeposit: _securityDeposit,
          securityDepositRefund: _securityDepositRefund,
          ...originalTenant
        } = toJS(
          store.tenant.items.find(({ _id }) => tenantPart.copyFrom === _id)
        );

        tenant = {
          ...originalTenant,
          ...tenant
        };

        if (originalTenant.lease) {
          const lease = store.lease.items.find(
            ({ _id }) => _id === originalTenant.lease._id
          );
          if (lease.numberOfTerms && lease.timeRange) {
            const newEndDate = moment()
              .startOf('day')
              .add(moment.duration(lease.numberOfTerms, lease.timeRange))
              .subtract(1, 'second');
            tenant.endDate = newEndDate;
          } else {
            tenant.endDate = null;
          }
        }
      }

      const { status, data } = await store.tenant.create(tenant);
      if (status !== 200) {
        switch (status) {
          case 422:
            return toast.error(t('Tenant name is missing'));
          case 409:
            return toast.error(t('The tenant already exists'));
          default:
            return toast.error(t('Something went wrong'));
        }
      }

      queryClient.invalidateQueries({ queryKey: [QueryKeys.TENANTS] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TENANT_COUNT] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.OCCUPANCY_RATE] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TOP_UNPAID] });
      handleClose();

      store.tenant.setSelected(data);
      await router.push(`/tenants/${data._id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const tenants =
    tenantsQuery.data
      // remove duplicates from tenant list
      ?.filter((tenant, index, tenants) => {
        return (
          tenants.findIndex(
            (currentTenant) => currentTenant.name === tenant.name
          ) === index
        );
      })
      // transform to use it in select field
      .map(({ _id, name }) => {
        return { id: _id, label: name, value: _id };
      }) || [];

  return (
    <ResponsiveDialog
      open={!!open}
      setOpen={setOpen}
      isLoading={isLoading}
      title={t('Add a tenant')}
      renderContent={() => (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
          innerRef={formRef}
        >
          {({ values }) => (
            <Form autoComplete="off" className="w-full">
              <div className="pt-6 space-y-4">
                <TextField label={t('Name')} name="name" />
                {tenants?.length ? (
                  <>
                    <SwitchField
                      name="isCopyFrom"
                      label={t('Copy from an existing tenant')}
                      aria-label={t('Copy from an existing tenant')}
                      dataCy="copyFromExistingTenant"
                    />
                    {values.isCopyFrom ? (
                      <SelectField
                        name="copyFrom"
                        label={t('Tenant')}
                        values={tenants}
                      />
                    ) : null}
                  </>
                ) : null}
              </div>
            </Form>
          )}
        </Formik>
      )}
      renderFooter={() => (
        <>
          <Button variant="outline" onClick={handleClose}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={() => formRef.current.submitForm()}
            data-cy="submitTenant"
          >
            {t('Add')}
          </Button>
        </>
      )}
    />
  );
}
