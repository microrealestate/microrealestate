import * as Yup from 'yup';
import {
  NumberField,
  SubmitButton,
  TextField,
  DateField
} from '@microrealestate/commonui/components';
import { Form, Formik } from 'formik';
import { useContext, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Section } from '../../formfields/Section';
import { StoreContext } from '../../../store';
import useTranslation from 'next-translate/useTranslation';
import types from './types';

const validationSchema = Yup.object().shape({
  name: Yup.string().required(),
  description: Yup.string().required(),
  startDate: Yup.date().required(),
  endDate: Yup.date().required(),
  amount: Yup.number().required(),
  provider: Yup.string().required(),
  type: Yup.string().required()
});

const WarrantyForm = observer(({ onSubmit }) => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  const initialValues = useMemo(
    () => ({
      name: store.warranty.selected?.name || '',
      description: store.warranty.selected?.description || '',
      startDate: store.warranty.selected?.startDate || '',
      endDate: store.warranty.selected?.endDate || '',
      amount: store.warranty.selected?.amount || '',
      provider: store.warranty.selected?.provider || '',
      type: store.warranty.selected?.type || ''
    }),
    [store.warranty.selected]
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, setFieldValue, values }) => (
        <Form autoComplete="off">
          <Section label={t('Warranty information')}>
            <TextField label={t('Name')} name="name" />
            <TextField label={t('Description')} name="description" />
            <DateField label={t('Start Date')} name="startDate" InputLabelProps={{ shrink: true }} />
            <DateField label={t('End Date')} name="endDate" InputLabelProps={{ shrink: true }} />
            <NumberField label={t('Amount')} name="amount" />
            <TextField label={t('Provider')} name="provider" />
            <div className="flex flex-wrap gap-2 mt-4">
              {types.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`px-4 py-2 border rounded ${values.type === type.id ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
                  onClick={() => setFieldValue('type', type.id)}
                >
                  {t(type.labelId)}
                </button>
              ))}
            </div>
          </Section>
          <div className="flex justify-end mt-4">
            <SubmitButton
              size="large"
              label={!isSubmitting ? t('Save') : t('Saving')}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
});

export default WarrantyForm;
