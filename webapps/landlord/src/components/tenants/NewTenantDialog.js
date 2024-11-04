import * as Yup from 'yup';
import { Form, Formik } from 'formik';
import React, { useCallback, useContext, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { contractEndMoment } from '@microrealestate/commonui/utils/contract';
import moment from 'moment';
import ResponsiveDialog from '../ResponsiveDialog';
import { SelectField } from '../formfields/SelectField';
import { StoreContext } from '../../store';
import { SwitchField } from '../formfields/SwitchField';
import { TextField } from '../formfields/TextField';
import { toast } from 'sonner';
import { toJS } from 'mobx';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

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
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef();

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const _onSubmit = useCallback(
    async (tenantPart) => {
      try {
        setIsLoading(true);
        let tenant = {
          name: tenantPart.name,
          company: tenantPart.name,
          beginDate: moment().startOf('day').format('DD/MM/YYYY'),
          stepperMode: true
        };
        if (tenantPart.isCopyFrom) {
          const {
            _id,
            reference,
            name,
            terminated,
            beginDate,
            endDate,
            terminationDate,
            properties,
            discount,
            guaranty,
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
            const newEndDate = contractEndMoment(
              moment().startOf('day'),
              lease
            );
            tenant.endDate = newEndDate.format('DD/MM/YYYY');
          }
        }

        const { status, data } = await store.tenant.create(tenant);
        if (status !== 200) {
          switch (status) {
            case 422:
              return toast.error(t('Tenant name is missing'));
            case 403:
              return toast.error(t('You are not allowed to add a tenant'));
            case 409:
              return toast.error(t('The tenant already exists'));
            default:
              return toast.error(t('Something went wrong'));
          }
        }

        handleClose();

        store.tenant.setSelected(data);
        store.appHistory.setPreviousPath(router.asPath);
        await router.push(
          `/${store.organization.selected.name}/tenants/${data._id}`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [store, handleClose, router, t]
  );

  const tenants = store.tenant.items
    // remove duplicates from tenant list
    .filter((tenant, index, tenants) => {
      return (
        tenants.findIndex(
          (currentTenant) => currentTenant.name === tenant.name
        ) === index
      );
    })
    // transform to use it in select field
    .map(({ _id, name }) => {
      return { id: _id, label: name, value: _id };
    });

  return (
    <ResponsiveDialog
      open={!!open}
      setOpen={setOpen}
      isLoading={isLoading}
      renderHeader={() => t('Add a tenant')}
      renderContent={() => (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
          innerRef={formRef}
        >
          {({ values }) => (
            <Form autoComplete="off">
              <div className="pt-6 space-y-4">
                <TextField label={t('Name')} name="name" />
                {tenants?.length ? (
                  <>
                    <SwitchField
                      name="isCopyFrom"
                      label={t('Copy from an existing tenant')}
                      aria-label={t('Copy from an existing tenant')}
                    />
                    <SelectField
                      name="copyFrom"
                      label={t('Tenant')}
                      values={tenants}
                      disabled={!values.isCopyFrom}
                    />
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
