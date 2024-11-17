import * as Yup from 'yup';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Form, Formik } from 'formik';
import {
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import _ from 'lodash';
import { ArrayField } from '../formfields/ArrayField';
import { Button } from '../ui/button';
import { Collapse } from '../ui/collapse';
import { DateField } from '../formfields/DateField';
import moment from 'moment';
import { NumberField } from '../formfields/NumberField';
import { QueryKeys } from '../../utils/restcalls';
import { SelectField } from '../formfields/SelectField';
import { StoreContext } from '../../store';
import { TextAreaField } from '../formfields/TextAreaField';
import { TextField } from '../formfields/TextField';
import { toast } from 'sonner';
import usePaymentTypes from '../../hooks/usePaymentTypes';
import { useQueryClient } from '@tanstack/react-query';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  payments: Yup.array()
    .of(
      Yup.object().shape({
        amount: Yup.number().min(0),
        date: Yup.mixed().when('amount', {
          is: (val) => val > 0,
          then: Yup.date().required()
        }),
        type: Yup.mixed()
          .oneOf(['cash', 'transfer', 'levy', 'cheque'])
          .required(),
        reference: Yup.mixed().when(['type', 'amount'], {
          is: (type, amount) => type !== 'cash' && amount > 0,
          then: Yup.string().required()
        })
      })
    )
    .min(1),
  description: Yup.string(),
  extracharge: Yup.number().min(0),
  noteextracharge: Yup.mixed().when('extracharge', {
    is: (val) => val > 0,
    then: Yup.string().required()
  }),
  promo: Yup.number().min(0),
  notepromo: Yup.mixed().when('promo', {
    is: (val) => val > 0,
    then: Yup.string().required()
  })
});

const emptyPayment = {
  amount: '',
  date: null,
  type: 'transfer',
  reference: ''
};

function PaymentPartForm({ term, payments }) {
  const { t } = useTranslation('common');
  const paymentTypes = usePaymentTypes();
  const momentTerm = moment(term, 'YYYYMMDDHH');

  return (
    <Card>
      <CardHeader className="text-lg px-6 pt-3 pb-0">
        {t('Settlement')}
      </CardHeader>
      <CardContent>
        <ArrayField
          name="payments"
          addLabel={t('Add a settlement')}
          emptyItem={emptyPayment}
          items={payments}
          renderTitle={(payment, index) =>
            `${t('Settlement #{{count}}', { count: index + 1 })}`
          }
          renderContent={(payment, index) => (
            <div className="grid gap-2 items-center grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-2">
              <DateField
                label={t('Date')}
                name={`payments[${index}].date`}
                minDate={moment(momentTerm).startOf('month')}
                maxDate={moment(momentTerm).endOf('month')}
              />
              <SelectField
                label={t('Type')}
                name={`payments[${index}].type`}
                values={paymentTypes.itemList}
              />
              {payment.type !== 'cash' ? (
                <TextField
                  label={t('Reference')}
                  name={`payments[${index}].reference`}
                  disabled={payment.type === 'cash'}
                />
              ) : null}
              <NumberField
                label={t('Amount')}
                name={`payments[${index}].amount`}
              />
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}

function NotePartForm({ description }) {
  const { t } = useTranslation('common');

  return (
    <TextAreaField
      label={t('Note (only visible to landlord)')}
      name="description"
      value={description}
    />
  );
}

function DiscountPartForm({ promo, notepromo }) {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-2">
      <NumberField label={t('Amount')} name="promo" value={promo} />
      <TextAreaField
        label={t('Description (visible to tenant)')}
        name="notepromo"
        value={notepromo}
      />
    </div>
  );
}

function AdditionalCostPartForm({ extracharge, noteextracharge }) {
  const { t } = useTranslation('common');
  return (
    <div className="space-y-2">
      <NumberField label={t('Amount')} name="extracharge" value={extracharge} />
      <TextAreaField
        label={t('Description (visible to tenant)')}
        name="noteextracharge"
        value={noteextracharge}
      />
    </div>
  );
}

function initialFormValues(rent) {
  return {
    payments: rent?.payments?.length
      ? rent.payments.map(({ amount, date, type, reference }) => {
          return {
            amount: amount === 0 ? '' : amount,
            date: date ? moment(date, 'DD/MM/YYYY') : null,
            type: type,
            reference: reference || ''
          };
        })
      : [emptyPayment],
    description: rent?.description?.trimEnd() || '',
    extracharge: rent?.extracharge !== 0 ? rent.extracharge : '',
    noteextracharge: rent?.noteextracharge?.trimEnd() || '',
    promo: rent?.promo !== 0 ? rent.promo : '',
    notepromo: rent?.notepromo?.trimEnd() || ''
  };
}

function PaymentTabs({ rent, onSubmit }, ref) {
  const formRef = useRef();
  const submitButtonRef = useRef();
  const queryClient = useQueryClient();
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const initialValues = initialFormValues(rent);
  const [expandedNote, setExpandedNote] = useState(!!initialValues.description);
  const [expandedDiscount, setExpandedDiscount] = useState(
    initialValues.promo > 0
  );
  const [expandedAdditionalCost, setExpandedAdditionalCost] = useState(
    initialValues.extracharge > 0
  );

  const handleChange =
    ({ note = false, discount = false, additionalCost = false }) =>
    () => {
      if (note) {
        setExpandedNote((prev) => !prev);
      }
      if (discount) {
        setExpandedDiscount((prev) => !prev);
      }
      if (additionalCost) {
        setExpandedAdditionalCost((prev) => !prev);
      }
    };

  useImperativeHandle(
    ref,
    () => ({
      isDirty() {
        return formRef?.current?.dirty;
      },
      async submit() {
        // Hack to workaround a formik issue when calling submitForm imperatively: form errors are not shown.
        // Imperativly clicking on the button makes the form behaving properly.
        submitButtonRef?.current?.click();
      },
      setValues(rent) {
        formRef?.current?.setValues(initialFormValues(rent));
      }
    }),
    []
  );

  const handleSubmit = useCallback(
    async (values) => {
      const clonedValues = _.cloneDeep(values);
      clonedValues.payments = clonedValues.payments
        .filter(({ amount }) => amount > 0)
        .map((payment) => {
          // convert moment into string for the DB
          payment.date = payment.date.format('DD/MM/YYYY');
          if (payment.type === 'cash') {
            delete payment.reference;
          }
          return payment;
        });

      const payment = {
        _id: rent._id,
        month: rent.month,
        year: rent.year,
        ...clonedValues
      };

      const period = moment(String(rent.term), 'YYYYMMDDHH').format('YYYY.MM');
      try {
        await store.rent.pay(String(rent.term), payment);
        queryClient.invalidateQueries({ queryKey: [QueryKeys.RENTS, period] });
        queryClient.invalidateQueries({ queryKey: [QueryKeys.DASHBOARD] });
        onSubmit?.();
      } catch (error) {
        console.error(error);
        toast.error(t('Something went wrong'));
      }
    },
    [
      onSubmit,
      queryClient,
      rent._id,
      rent.month,
      rent.term,
      rent.year,
      store.rent,
      t
    ]
  );

  return (
    <Formik
      innerRef={formRef}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({
        values: {
          payments,
          description,
          promo,
          notepromo,
          extracharge,
          noteextracharge
        }
      }) => {
        return (
          <Form autoComplete="off">
            <div className="space-y-4">
              <PaymentPartForm term={rent.term} payments={payments} />
              <Collapse
                title={t('Note')}
                open={expandedNote}
                onOpenChange={setExpandedNote}
              >
                <NotePartForm description={description} />
              </Collapse>
              <Collapse
                title={t('Discount')}
                open={expandedDiscount}
                onOpenChange={setExpandedDiscount}
              >
                <DiscountPartForm promo={promo} notepromo={notepromo} />
              </Collapse>
              <Collapse
                title={t('Additional cost')}
                open={expandedAdditionalCost}
                onOpenChange={setExpandedAdditionalCost}
              >
                <AdditionalCostPartForm
                  extracharge={extracharge}
                  noteextracharge={noteextracharge}
                />
              </Collapse>
            </div>

            {/* 
                Hack to workaround a formik issue when calling submitForm imperatively: form errors are not shown.
                Imperativly clicking on the button makes the form behaving properly. 
              */}
            <Button ref={submitButtonRef} className="hidden" type="submit" />
          </Form>
        );
      }}
    </Formik>
  );
}

export default forwardRef(PaymentTabs);
