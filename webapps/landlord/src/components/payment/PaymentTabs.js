import { NumberField } from '@microrealestate/commonui/components/formfields/NumberField';
import { PaymentsField } from '@microrealestate/commonui/components/formfields/PaymentsField';
import { TextAreaField } from '@microrealestate/commonui/components/formfields/TextAreaField';
import { Button } from '@microrealestate/commonui/components/ui/button';

import { Collapse } from '@microrealestate/commonui/components/ui/collapse';
import { useQueryClient } from '@tanstack/react-query';
import { Form, Formik } from 'formik';
import _ from 'lodash';
import moment from 'moment';
import { nanoid } from 'nanoid';
import { useTranslations } from 'next-intl';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { toast } from 'sonner';
import * as Yup from 'yup';
import { useStore } from '@/providers/StoreProvider';
import usePaymentTypes from '../../hooks/usePaymentTypes';
import { QueryKeys } from '../../utils/restcalls';

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
          .oneOf([
            'cash',
            'transfer',
            'direct_debit',
            'cheque',
            'card',
            'other'
          ])
          .required(),
        reference: Yup.mixed().when(['type', 'amount'], {
          is: (type, amount) =>
            !['cash', 'card', 'other'].includes(type) && amount > 0,
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
  key: nanoid(),
  amount: '',
  date: null,
  type: 'transfer',
  reference: ''
};

function PaymentPartForm({ term, payments }) {
  const t = useTranslations('common');
  const paymentTypes = usePaymentTypes();
  const momentTerm = moment(term, 'YYYYMMDDHH');

  return (
    <PaymentsField
      name="payments"
      items={payments}
      emptyItem={emptyPayment}
      addLabel={t('Add a payment')}
      renderTitle={(_, index) => t('Payment {count}', { count: index + 1 })}
      paymentTypes={paymentTypes.itemList}
      typeKey="type"
      defaultMonth={moment(momentTerm).startOf('month')}
      dataCy={{ reference: 'paymentReference', amount: 'paymentAmount' }}
    />
  );
}

function NotePartForm({ description }) {
  const t = useTranslations('common');

  return (
    <TextAreaField
      label={t('Note (only visible to landlord)')}
      name="description"
      value={description}
    />
  );
}

function DiscountPartForm({ promo, notepromo }) {
  const t = useTranslations('common');

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
  const t = useTranslations('common');
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
            key: nanoid(),
            amount: amount === 0 ? '' : amount,
            date: date ? moment(date) : null,
            type: type,
            reference: reference || ''
          };
        })
      : [{ ...emptyPayment, key: nanoid() }],
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
  const store = useStore();
  const t = useTranslations('common');
  const initialValues = initialFormValues(rent);
  const [expandedNote, setExpandedNote] = useState(!!initialValues.description);
  const [expandedDiscount, setExpandedDiscount] = useState(
    initialValues.promo > 0
  );
  const [expandedAdditionalCost, setExpandedAdditionalCost] = useState(
    initialValues.extracharge > 0
  );

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
          if (payment.type === 'cash') {
            delete payment.reference;
          }
          return payment;
        });

      const payment = {
        _id: rent._id,
        ...clonedValues
      };

      const period = moment(String(rent.term), 'YYYYMMDDHH');
      const periodAsString = period.format('YYYY.MM');
      try {
        await store.rent.pay(String(rent.term), payment);
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.RENTS, periodAsString]
        });
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.TOP_UNPAID]
        });
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.REVENUES_BREAKDOWN, period.year()]
        });
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.YEAR_REVENUES, period.year()]
        });
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.MONTH_REVENUES, period.year()]
        });
        onSubmit?.();
      } catch (error) {
        console.error(error);
        toast.error(t('Something went wrong'));
      }
    },
    [onSubmit, queryClient, rent._id, rent.term, store.rent, t]
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
