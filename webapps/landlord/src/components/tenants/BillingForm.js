import * as Yup from 'yup';

import {
  CheckboxField,
  FormSection,
  FormTextField,
  SubmitButton,
} from '../Form';
import { Form, Formik } from 'formik';

import { Box } from '@material-ui/core';
import { observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import { useContext } from 'react';
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

const Billing = observer(({ readOnly, onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const initialValues = {
    reference: store.tenant.selected?.reference || '',
    isVat: !!store.tenant.selected?.isVat,
    vatRatio: store.tenant.selected?.vatRatio * 100 || 0,
    discount: store.tenant.selected?.discount || 0,
  };

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
            <FormSection label={t('Billing information')}>
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
                    <FormTextField
                      label={t('VAT percentage')}
                      name="vatRatio"
                      disabled={readOnly || !values.isVat}
                    />
                  </Box>
                )}
              <FormTextField
                label={t('Discount')}
                name="discount"
                disabled={readOnly}
              />
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
