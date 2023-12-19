import * as Yup from 'yup';

import {
  Box,
  Button,
  Collapse,
  Grid,
  IconButton,
  Link,
} from '@material-ui/core';
import {
  DateField,
  NumberField,
  SelectField,
  SubmitButton,
  TextField,
} from '@microrealestate/commonui/components';
import { FieldArray, Form, Formik } from 'formik';
import {
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import _ from 'lodash';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import moment from 'moment';
import { StoreContext } from '../../store';
import usePaymentTypes from '../../hooks/usePaymentTypes';
import useTranslation from 'next-translate/useTranslation';

const validationSchema = Yup.object().shape({
  payments: Yup.array()
    .of(
      Yup.object().shape({
        amount: Yup.number().min(0),
        date: Yup.mixed().when('amount', {
          is: (val) => val > 0,
          then: Yup.date().required(),
        }),
        type: Yup.mixed()
          .oneOf(['cash', 'transfer', 'levy', 'cheque'])
          .required(),
        reference: Yup.mixed().when(['type', 'amount'], {
          is: (type, amount) => type !== 'cash' && amount > 0,
          then: Yup.string().required(),
        }),
      })
    )
    .min(1),
  description: Yup.string(),
  extracharge: Yup.number().min(0),
  noteextracharge: Yup.mixed().when('extracharge', {
    is: (val) => val > 0,
    then: Yup.string().required(),
  }),
  promo: Yup.number().min(0),
  notepromo: Yup.mixed().when('promo', {
    is: (val) => val > 0,
    then: Yup.string().required(),
  }),
});

const emptyPayment = {
  amount: '',
  date: moment(),
  type: 'transfer',
  reference: '',
};

function PaymentPartForm({ term, payments }) {
  const { t } = useTranslation('common');
  const paymentTypes = usePaymentTypes();
  const momentTerm = moment(term, 'YYYYMMDDHH');

  return (
    <FieldArray name="payments">
      {({ form, ...arrayHelpers }) => {
        return payments.map((payment, index) => (
          <Box
            key={index}
            p={2}
            mb={2}
            border={1}
            borderColor="divider"
            borderRadius="borderRadius"
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <SelectField
                  label={t('Type')}
                  name={`payments[${index}].type`}
                  values={paymentTypes.itemList}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <DateField
                  label={t('Date')}
                  name={`payments[${index}].date`}
                  minDate={momentTerm.startOf('month').toISOString()}
                  maxDate={momentTerm.endOf('month').toISOString()}
                />
                {payments[index].type !== 'cash' ? (
                  <TextField
                    label={t('Reference')}
                    name={`payments[${index}].reference`}
                    disabled={payments[index].type === 'cash'}
                  />
                ) : null}
                <NumberField
                  label={t('Settlement')}
                  name={`payments[${index}].amount`}
                />
              </Grid>
            </Grid>
            <Box
              display="flex"
              justifyContent={
                payments.length === index + 1 ? 'space-between' : 'flex-end'
              }
              mt={1}
            >
              {payments.length === index + 1 && (
                <Button
                  color="primary"
                  size="small"
                  onClick={() => arrayHelpers.push(emptyPayment)}
                >
                  {t('New settlement')}
                </Button>
              )}
              {payments.length > 1 && (
                <Button
                  color="primary"
                  size="small"
                  onClick={() => arrayHelpers.remove(index)}
                >
                  {t('Remove this settlement')}
                </Button>
              )}
            </Box>
          </Box>
        ));
      }}
    </FieldArray>
  );
}

function NotePartForm({ description }) {
  return (
    <TextField name="description" value={description} multiline maxRows={5} />
  );
}

function DiscountPartForm({ promo, notepromo }) {
  const { t } = useTranslation('common');

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <NumberField label={t('Amount')} name="promo" value={promo} />
      </Grid>
      <Grid item xs={12} sm={8}>
        <TextField
          label={t('Description')}
          name="notepromo"
          value={notepromo}
          multiline
          maxRows={5}
        />
      </Grid>
    </Grid>
  );
}

function AdditionalCostPartForm({ extracharge, noteextracharge }) {
  const { t } = useTranslation('common');
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <NumberField
          label={t('Amount')}
          name="extracharge"
          value={extracharge}
        />
      </Grid>
      <Grid item xs={12} sm={8}>
        <TextField
          label={t('Description')}
          name="noteextracharge"
          value={noteextracharge}
          multiline
          maxRows={5}
        />
      </Grid>
    </Grid>
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
          reference: reference || '',
        };
      })
      : [emptyPayment],
    description: rent?.description?.trimEnd() || '',
    extracharge: rent?.extracharge !== 0 ? rent.extracharge : '',
    noteextracharge: rent?.noteextracharge?.trimEnd() || '',
    promo: rent?.promo !== 0 ? rent.promo : '',
    notepromo: rent?.notepromo?.trimEnd() || '',
  };
}

function PaymentTabs({ rent, onSubmit }, ref) {
  const formRef = useRef();
  const submitButtonRef = useRef();
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
      },
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
        ...clonedValues,
      };

      try {
        await store.rent.pay(String(rent.term), payment);
        onSubmit?.();
      } catch (error) {
        console.error(error);
        store.pushToastMessage({
          message: t('Something went wrong'),
          severity: 'error',
        });
      }
    },
    [onSubmit, rent._id, rent.month, rent.term, rent.year, store, t]
  );

  return (
    <Box width="100%" borderRadius="borderRadius">
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
            noteextracharge,
          },
        }) => {
          return (
            <Form autoComplete="off">
              <PaymentPartForm term={rent.term} payments={payments} />

              <Box
                px={2}
                py={expandedNote ? 2 : 0}
                mb={1}
                border={1}
                borderColor="divider"
                borderRadius="borderRadius"
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  onClick={handleChange({ note: true })}
                >
                  <Link color="inherit" underline="none" href="#">
                    {t('Note')}
                  </Link>
                  <IconButton size="small">
                    <ExpandMoreIcon />
                  </IconButton>
                </Box>
                <Collapse in={expandedNote}>
                  <NotePartForm description={description} />
                </Collapse>
              </Box>

              <Box
                px={2}
                py={expandedDiscount ? 2 : 0}
                mb={1}
                border={1}
                borderColor="divider"
                borderRadius="borderRadius"
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  onClick={handleChange({ discount: true })}
                >
                  <Link color="inherit" underline="none" href="#">
                    {t('Discount')}
                  </Link>
                  <IconButton size="small">
                    <ExpandMoreIcon />
                  </IconButton>
                </Box>
                <Collapse in={expandedDiscount}>
                  <DiscountPartForm promo={promo} notepromo={notepromo} />
                </Collapse>
              </Box>

              <Box
                px={2}
                py={expandedAdditionalCost ? 2 : 0}
                border={1}
                borderColor="divider"
                borderRadius="borderRadius"
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  onClick={handleChange({ additionalCost: true })}
                >
                  <Link color="inherit" underline="none" href="#">
                    {t('Additional cost')}
                  </Link>
                  <IconButton size="small">
                    <ExpandMoreIcon />
                  </IconButton>
                </Box>
                <Collapse in={expandedAdditionalCost}>
                  <AdditionalCostPartForm
                    extracharge={extracharge}
                    noteextracharge={noteextracharge}
                  />
                </Collapse>
              </Box>
              {/* 
                Hack to workaround a formik issue when calling submitForm imperatively: form errors are not shown.
                Imperativly clicking on the button makes the form behaving properly. 
              */}
              <SubmitButton
                ref={submitButtonRef}
                style={{ visibility: 'hidden' }}
              />
            </Form>
          );
        }}
      </Formik>
    </Box>
  );
}

export default forwardRef(PaymentTabs);
