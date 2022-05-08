import * as Yup from 'yup';

import {
  CheckboxField,
  FormNumberField,
  FormSection,
  FormTextField,
  SubmitButton,
} from '../../Form';
import { Form, Formik } from 'formik';
import { useContext, useMemo } from 'react';

import { Box } from '@material-ui/core';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../../store';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  reference: Yup.string().required(),
  isVat: Yup.boolean().required(),
  vatRatio: Yup.mixed().when('isVat', {
    is: true,
    then: Yup.number().moreThan(0).max(100),
  }),
  discount: Yup.number().min(0),
});

const initValues = (tenant) => {
  return {
    reference: tenant?.reference || '',
    isVat: !!tenant?.isVat,
    vatRatio: tenant?.vatRatio * 100 || 0,
    discount: tenant?.discount || 0,
  };
};

export const validate = (tenant) => {
  return validationSchema.validate(initValues(tenant));
};

const Billing = observer(({ readOnly, onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const initialValues = useMemo(
    () => initValues(store.tenant?.selected),
    [store.tenant?.selected]
  );

  const _onSubmit = async (billing) => {
    await onSubmit({
      reference: billing.reference,
      isVat: billing.isVat,
      vatRatio: billing.isVat ? billing.vatRatio / 100 : 0,
      discount: billing.discount,
    });
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={_onSubmit}
    >
      {({ isSubmitting, values }) => {
        return (
          <Form autoComplete="off">
            <FormSection
              label={t('Billing information')}
              visible={!store.tenant.selected.stepperMode}
            >
              <FormTextField
                label={t('Tenant reference')}
                name="reference"
                disabled={readOnly}
              />
              {store.organization.selected &&
                store.organization.selected.isCompany && (
                  <Box display="flex" direction="row" alignItems="flex-end">
                    <CheckboxField
                      name="isVat"
                      //label={t('Subject to VAT')}
                      aria-label={t('Subject to VAT')}
                      disabled={readOnly}
                    />
                    <FormNumberField
                      label={t('VAT percentage')}
                      name="vatRatio"
                      disabled={readOnly || !values.isVat}
                    />
                  </Box>
                )}
              {values.discount > 0 ? (
                <FormNumberField
                  label={t('Discount')}
                  name="discount"
                  disabled={readOnly}
                />
              ) : null}
            </FormSection>
            {!readOnly && (
              <SubmitButton
                size="large"
                label={!isSubmitting ? t('Save') : t('Saving')}
              />
            )}
          </Form>
        );
      }}
    </Formik>
  );
});

export default Billing;
