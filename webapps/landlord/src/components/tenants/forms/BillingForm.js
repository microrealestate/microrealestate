import * as Yup from 'yup';

import { Form, Formik } from 'formik';
import {
  NumberField,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import { useContext, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Section } from '../../formfields/Section';
import { StoreContext } from '../../../store';
import { SwitchField } from '../../formfields/SwitchField';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  reference: Yup.string().required(),
  isVat: Yup.boolean().required(),
  vatRatio: Yup.mixed().when('isVat', {
    is: true,
    then: Yup.number().moreThan(0).max(100)
  }),
  discount: Yup.number().min(0)
});

const initValues = (tenant) => {
  return {
    reference: tenant?.reference || '',
    isVat: !!tenant?.isVat,
    vatRatio: tenant?.vatRatio * 100 || 0,
    discount: tenant?.discount || 0
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
      discount: billing.discount
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
            <Section
              label={t('Billing information')}
              visible={!store.tenant.selected.stepperMode}
              className="space-y-6"
            >
              <TextField
                label={t('Tenant reference')}
                name="reference"
                disabled={readOnly}
              />
              {store.organization.selected &&
                store.organization.selected.isCompany && (
                  <>
                    <SwitchField
                      name="isVat"
                      label={t('Subject to VAT')}
                      aria-label={t('Subject to VAT')}
                      disabled={readOnly}
                    />
                    <NumberField
                      label={t('VAT percentage')}
                      name="vatRatio"
                      disabled={readOnly || !values.isVat}
                    />
                  </>
                )}
              {values.discount > 0 ? (
                <NumberField
                  label={t('Discount')}
                  name="discount"
                  disabled={readOnly}
                />
              ) : null}
            </Section>
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
