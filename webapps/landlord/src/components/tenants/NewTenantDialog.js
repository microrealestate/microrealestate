import * as Yup from 'yup';

import { Box, DialogTitle } from '@material-ui/core';
import {
  CheckboxField,
  SelectField,
  SubmitButton,
  TextField,
} from '@microrealestate/commonui/components';
import { Form, Formik } from 'formik';
import React, { useCallback, useContext } from 'react';

import Button from '@material-ui/core/Button';
import { contractEndMoment } from '@microrealestate/commonui/utils/contract';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import moment from 'moment';
import { StoreContext } from '../../store';
import { toJS } from 'mobx';
import useDialog from '../../hooks/useDialog';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  name: Yup.string().required(),
  isCopyFrom: Yup.boolean(),
  copyFrom: Yup.mixed().when('isCopyFrom', {
    is: true,
    then: Yup.string().required(),
  }),
});

const initialValues = {
  name: '',
  copyFrom: '',
  isCopyFrom: false,
};

function NewTenantDialog({ open, setOpen, backPage, backPath }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const router = useRouter();

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const _onSubmit = useCallback(
    async (tenantPart) => {
      let tenant = {
        name: tenantPart.name,
        company: tenantPart.name,
        beginDate: moment().startOf('day').format('DD/MM/YYYY'),
        stepperMode: true,
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
          ...tenant,
        };

        if (originalTenant.lease) {
          const lease = store.lease.items.find(
            ({ _id }) => _id === originalTenant.lease._id
          );
          const newEndDate = contractEndMoment(moment().startOf('day'), lease);
          tenant.endDate = newEndDate.format('DD/MM/YYYY');
        }
      }

      const { status, data } = await store.tenant.create(tenant);
      if (status !== 200) {
        switch (status) {
          case 422:
            return store.pushToastMessage({
              message: t('Tenant name is missing'),
              severity: 'error',
            });
          case 403:
            return store.pushToastMessage({
              message: t('You are not allowed to add a tenant'),
              severity: 'error',
            });
          case 409:
            return store.pushToastMessage({
              message: t('The tenant already exists'),
              severity: 'error',
            });
          default:
            return store.pushToastMessage({
              message: t('Something went wrong'),
              severity: 'error',
            });
        }
      }

      handleClose();

      store.tenant.setSelected(data);
      await router.push(
        `/${store.organization.selected.name}/tenants/${data._id}/${encodeURI(
          backPage
        )}/${encodeURIComponent(backPath)}`
      );
    },
    [store, handleClose, router, backPage, backPath, t]
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
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={handleClose}
      aria-labelledby="new-tenant-dialog"
    >
      <DialogTitle>{t('Add a new tenant')}</DialogTitle>
      <Box p={1}>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={_onSubmit}
        >
          {({ values, isSubmitting }) => {
            return (
              <Form autoComplete="off">
                <DialogContent>
                  <TextField label={t('Name')} name="name" />
                  {!!tenants.length && (
                    <>
                      <CheckboxField
                        name="isCopyFrom"
                        label={t('Copy from an existing tenant')}
                        aria-label={t('Copy from an existing tenant')}
                      />
                      {values.isCopyFrom && (
                        <SelectField
                          name="copyFrom"
                          label={t('Tenant')}
                          values={tenants}
                        />
                      )}
                    </>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleClose} color="primary">
                    {t('Cancel')}
                  </Button>
                  <SubmitButton
                    label={!isSubmitting ? t('Add') : t('Adding tenant')}
                  />
                </DialogActions>
              </Form>
            );
          }}
        </Formik>
      </Box>
    </Dialog>
  );
}

export default function useNewTenantDialog() {
  return useDialog(NewTenantDialog);
}
