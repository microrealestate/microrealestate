import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import React, { useContext, useMemo, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { DateField } from '../formfields/DateField';
import moment from 'moment';
import { NumberField } from '../formfields/NumberField';
import { QueryKeys } from '../../utils/restcalls';
import ResponsiveDialog from '../ResponsiveDialog';
import { SelectField } from '../formfields/SelectField';
import { StoreContext } from '../../store';
import { toast } from 'sonner';
import { toJS } from 'mobx';
import { useQueryClient } from '@tanstack/react-query';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  tenantId: Yup.string().required(),
  terminationDate: Yup.date().required(),
  guarantyPayback: Yup.number().min(0)
});

export default function TerminateLeaseDialog({ open, setOpen, tenantList }) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const store = useContext(StoreContext);
  const [isLoading, setIsLoading] = useState(false);
  const [minMaxDates, setMinMaxDates] = useState({
    minDate: store.tenant.selected?.beginDate
      ? moment(store.tenant.selected.beginDate, 'DD/MM/YYYY')
      : null,
    maxDate: store.tenant.selected?.endDate
      ? moment(store.tenant.selected.endDate, 'DD/MM/YYYY')
      : null
  });
  const formRef = useRef();

  const initialValues = useMemo(
    () => ({
      tenantId:
        !tenantList && store.tenant.selected?._id
          ? store.tenant.selected._id
          : '',
      terminationDate:
        !tenantList && store.tenant.selected?.terminationDate
          ? moment(store.tenant.selected.terminationDate, 'DD/MM/YYYY')
          : null,
      guarantyPayback: !tenantList ? store.tenant.selected?.guarantyPayback : ''
    }),
    [
      store.tenant.selected._id,
      store.tenant.selected?.guarantyPayback,
      store.tenant.selected.terminationDate,
      tenantList
    ]
  );

  const tenants = useMemo(() => {
    if (tenantList) {
      return tenantList.map((tenant) => ({
        id: tenant._id,
        value: tenant._id,
        label: tenant.name
      }));
    }

    if (store.tenant.selected) {
      return [
        {
          id: store.tenant.selected._id,
          value: store.tenant.selected._id,
          label: store.tenant.selected.name
        }
      ];
    }

    return [];
  }, [store.tenant.selected, tenantList]);

  const handleClose = () => setOpen(false);

  const handleTenantChange = (event) => {
    const name = event.target.name;
    if (name === 'tenantId') {
      const tenantId = event.target.value;
      if (tenantId) {
        const tenant =
          tenantList.find(({ _id }) => _id === tenantId) ||
          store.tenant.selected;
        setMinMaxDates({
          minDate: moment(tenant.beginDate, 'DD/MM/YYYY'),
          maxDate: moment(tenant.endDate, 'DD/MM/YYYY')
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
        tenantList?.find(({ _id }) => _id === tenantPart.tenantId) ||
        store.tenant.selected;
      const updatedTenant = {
        ...toJS(tenant),
        terminationDate: tenantPart.terminationDate.format('DD/MM/YYYY'),
        guarantyPayback: tenantPart.guarantyPayback || 0
      };

      const { status, data } = await store.tenant.update(updatedTenant);

      if (status !== 200) {
        switch (status) {
          case 422:
            return toast.error(t('Tenant name is missing'));
          case 403:
            return toast.error(t('You are not allowed to update the tenant'));
          case 409:
            return toast.error(
              t('Termination date is out of the contract time frame')
            );
          default:
            return toast.error(t('Something went wrong'));
        }
      }

      queryClient.invalidateQueries({ queryKey: [QueryKeys.TENANTS] });
      queryClient.invalidateQueries({ queryKey: [QueryKeys.DASHBOARD] });
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
      renderHeader={() => t('Terminate a lease')}
      renderContent={() => (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          innerRef={formRef}
        >
          {() => {
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
                    disabled={tenants.length <= 1}
                  />
                  <DateField
                    label={t('Termination date')}
                    name="terminationDate"
                    minDate={minMaxDates.minDate}
                    maxDate={minMaxDates.maxDate}
                  />
                  <NumberField
                    label={t('Amount of the deposit refund')}
                    name="guarantyPayback"
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
