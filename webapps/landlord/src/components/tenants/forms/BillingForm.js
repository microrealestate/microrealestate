import { NumberField } from '@microrealestate/commonui/components/formfields/NumberField';
import { Section } from '@microrealestate/commonui/components/formfields/Section';
import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { SwitchField } from '@microrealestate/commonui/components/formfields/SwitchField';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Form, Formik } from 'formik';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import * as Yup from 'yup';
import { useStore } from '@/providers/StoreProvider';

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

function Billing({ readOnly, onSubmit }) {
  const t = useTranslations('common');
  const store = useStore();

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
      {({ values }) => {
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
                readOnly={readOnly}
              />
              {store.organization.selected?.isCompany && (
                <>
                  <SwitchField
                    name="isVat"
                    label={t('Subject to VAT')}
                    aria-label={t('Subject to VAT')}
                    readOnly={readOnly}
                  />
                  <NumberField
                    label={t('VAT percentage')}
                    name="vatRatio"
                    readOnly={readOnly || !values.isVat}
                  />
                </>
              )}
              {values.discount > 0 ? (
                <NumberField
                  label={t('Discount')}
                  name="discount"
                  readOnly={readOnly}
                />
              ) : null}
            </Section>
            {!readOnly && <SubmitButton label={t('Save')} />}
          </Form>
        );
      }}
    </Formik>
  );
}

export default observer(Billing);
