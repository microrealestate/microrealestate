import { DateField } from '@microrealestate/commonui/components/formfields/DateField';
import { PaymentsField } from '@microrealestate/commonui/components/formfields/PaymentsField';
import { SelectField } from '@microrealestate/commonui/components/formfields/SelectField';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import { toJS } from 'mobx';
import moment from 'moment';
import { nanoid } from 'nanoid';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { useStore } from '@/providers/StoreProvider';
import usePaymentTypes from '../../hooks/usePaymentTypes';
import { fetchTenants, QueryKeys } from '../../utils/restcalls';
import ResponsiveDialog from '../ResponsiveDialog';

const validationSchema = Yup.object().shape({
  tenantId: Yup.string().required(),
  terminationDate: Yup.date().required(),
  securityDepositRefund: Yup.array()
    .of(
      Yup.object().shape({
        amount: Yup.number().min(0).required(),
        date: Yup.date().required(),
        paymentType: Yup.string()
          .oneOf([
            'cash',
            'transfer',
            'direct_debit',
            'cheque',
            'card',
            'other'
          ])
          .required(),
        reference: Yup.string()
      })
    )
    .default([])
});

const emptyRefund = () => ({
  key: nanoid(),
  amount: '',
  date: null,
  paymentType: 'transfer',
  reference: ''
});

const stripKey = ({ key: _k, ...rest }) => rest;

export default function TerminateLeaseDialog({
  open,
  setOpen,
  tenant: defaultTenant
}) {
  const t = useTranslations('common');
  const queryClient = useQueryClient();
  const store = useStore();
  const paymentTypes = usePaymentTypes();
  const [isLoading, setIsLoading] = useState(false);
  const [minMaxDates, setMinMaxDates] = useState({
    minDate: null,
    maxDate: null
  });
  const formRef = useRef();

  const tenantsQuery = useQuery({
    queryKey: [QueryKeys.TENANTS],
    queryFn: () => fetchTenants(store),
    refetchOnMount: 'always',
    retry: 3,
    enabled: !!open && !defaultTenant
  });

  useEffect(() => {
    setMinMaxDates({
      minDate: defaultTenant?.beginDate
        ? moment(defaultTenant.beginDate)
        : null,
      maxDate: defaultTenant?.endDate ? moment(defaultTenant.endDate) : null
    });
  }, [defaultTenant?.beginDate, defaultTenant?.endDate]);

  const initialValues = useMemo(
    () => ({
      tenantId: defaultTenant?._id ?? '',
      terminationDate: defaultTenant?.terminationDate
        ? moment(defaultTenant.terminationDate)
        : null,
      securityDepositRefund: (defaultTenant?.securityDepositRefund ?? []).map(
        (entry) => ({
          ...entry,
          key: entry.key || nanoid(),
          date: entry.date ? moment(entry.date) : null
        })
      )
    }),
    [
      defaultTenant?._id,
      defaultTenant?.securityDepositRefund,
      defaultTenant?.terminationDate
    ]
  );

  const tenants = useMemo(() => {
    if (defaultTenant) {
      return [
        {
          id: defaultTenant._id,
          value: defaultTenant._id,
          label: defaultTenant.name
        }
      ];
    }

    if (tenantsQuery.data) {
      return tenantsQuery.data
        .filter((tenant) => !tenant.terminated)
        .map((tenant) => ({
          id: tenant._id,
          value: tenant._id,
          label: tenant.name
        }));
    }
    return [];
  }, [defaultTenant, tenantsQuery.data]);

  if (tenantsQuery.isError) {
    toast.error(t('Something went wrong'));
  }
  const handleClose = () => setOpen(false);

  const handleTenantChange = (event) => {
    const name = event.target.name;
    if (name === 'tenantId') {
      const tenantId = event.target.value;
      if (tenantId) {
        const tenant =
          defaultTenant ||
          tenantsQuery.data?.find(({ _id }) => _id === tenantId);
        setMinMaxDates({
          minDate: moment(tenant.beginDate),
          maxDate: moment(tenant.endDate)
        });
      } else {
        setMinMaxDates({
          minDate: null,
          maxDate: null
        });
      }
    }
  };

  const handleSubmit = async (tenantPart) => {
    try {
      setIsLoading(true);
      const tenant =
        defaultTenant ||
        tenantsQuery.data?.find(({ _id }) => _id === tenantPart.tenantId);
      const updatedTenant = {
        ...toJS(tenant),
        terminationDate: tenantPart.terminationDate,
        securityDepositRefund: (tenantPart.securityDepositRefund || []).map(
          stripKey
        )
      };

      const { status, data } = await store.tenant.update(updatedTenant);

      if (status !== 200) {
        switch (status) {
          case 422:
            return toast.error(t('Tenant name is missing'));
          case 409:
            return toast.error(
              t('Termination date is out of the contract time frame')
            );
          default:
            return toast.error(t('Something went wrong'));
        }
      }
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TENANTS] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TENANT_COUNT] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.OCCUPANCY_RATE] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.RENT_COUNT] });
      store.tenant.setSelected(data);

      handleClose(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog
      open={!!open}
      setOpen={setOpen}
      isLoading={isLoading}
      title={t('Terminate a lease')}
      renderContent={() => (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          innerRef={formRef}
        >
          {({ values }) => {
            return (
              <Form
                onChange={handleTenantChange}
                autoComplete="off"
                className="w-full"
              >
                <div className="pt-6 space-y-4">
                  <SelectField
                    label={t('Tenant')}
                    name="tenantId"
                    values={tenants}
                    disabled={!!defaultTenant}
                  />
                  <DateField
                    label={t('Termination date')}
                    name="terminationDate"
                    min={minMaxDates.minDate}
                    max={minMaxDates.maxDate}
                  />
                  <PaymentsField
                    name="securityDepositRefund"
                    items={values.securityDepositRefund}
                    emptyItem={emptyRefund()}
                    addLabel={t('Add a security deposit refund')}
                    renderTitle={(_, index) =>
                      t('Refund installment {count}', { count: index + 1 })
                    }
                    paymentTypes={paymentTypes.itemList}
                    typeKey="paymentType"
                    minItems={0}
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
            {t('Terminate')}
          </Button>
        </>
      )}
    />
  );
}
