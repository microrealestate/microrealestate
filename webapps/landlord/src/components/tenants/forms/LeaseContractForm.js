import {
  ArrayField,
  ArrayFieldDisplay
} from '@microrealestate/commonui/components/formfields/ArrayField';
import { DateField } from '@microrealestate/commonui/components/formfields/DateField';
import { NumberField } from '@microrealestate/commonui/components/formfields/NumberField';
import { PaymentsField } from '@microrealestate/commonui/components/formfields/PaymentsField';
import { RangeDateField } from '@microrealestate/commonui/components/formfields/RangeDateField';
import { Section } from '@microrealestate/commonui/components/formfields/Section';
import { SelectField } from '@microrealestate/commonui/components/formfields/SelectField';
import { SubmitButton } from '@microrealestate/commonui/components/formfields/SubmitButton';
import { TextField } from '@microrealestate/commonui/components/formfields/TextField';
import { Form, Formik, validateYupSchema, yupToFormErrors } from 'formik';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { nanoid } from 'nanoid';
import { useTranslations } from 'next-intl';
import { Fragment, useCallback, useMemo } from 'react';
import * as Yup from 'yup';
import { useStore } from '@/providers/StoreProvider';
import usePaymentTypes from '../../../hooks/usePaymentTypes';

const validationSchema = Yup.object().shape({
  leaseId: Yup.string().required(),
  beginDate: Yup.date().required(),
  endDate: Yup.date().required(),
  terminationDate: Yup.date()
    .min(Yup.ref('beginDate'))
    .max(Yup.ref('endDate'))
    .nullable(),
  properties: Yup.array()
    .of(
      Yup.object().shape({
        _id: Yup.string().required(),
        rent: Yup.number().moreThan(0).required(),
        expenses: Yup.array().of(
          Yup.object().shape({
            title: Yup.mixed().when('amount', {
              is: (val) => val > 0,
              then: Yup.string().required()
            }),
            amount: Yup.number().min(0),
            beginDate: Yup.date().required(),
            endDate: Yup.date().required()
          })
        ),
        entryDate: Yup.date()
          .required()
          .test(
            'entryDate',
            'Date not included in the contract date range',
            (value, context) => {
              const beginDate = context.options.context.beginDate;
              if (value && beginDate) {
                return moment(value).isSameOrAfter(beginDate);
              }
              return true;
            }
          ),
        exitDate: Yup.date()
          .min(Yup.ref('entryDate'))
          .required()
          .test(
            'exitDate',
            'Date not included in the contract date range',
            (value, context) => {
              const endDate = context.options.context.endDate;
              if (value && endDate) {
                return moment(value).isSameOrBefore(endDate);
              }
              return true;
            }
          )
      })
    )
    .min(1),
  expectedSecurityDeposit: Yup.number().min(0),
  securityDeposit: Yup.array()
    .of(
      Yup.object().shape({
        amount: Yup.number().min(0).required(),
        date: Yup.date().required(),
        paymentType: Yup.string()
          .oneOf([
            'cash',
            'transfer',
            'direct_debit',
            'cheque',
            'card',
            'other'
          ])
          .required(),
        reference: Yup.string()
      })
    )
    .default([]),
  securityDepositRefund: Yup.array()
    .of(
      Yup.object().shape({
        amount: Yup.number().min(0).required(),
        date: Yup.date().required(),
        paymentType: Yup.string()
          .oneOf([
            'cash',
            'transfer',
            'direct_debit',
            'cheque',
            'card',
            'other'
          ])
          .required(),
        reference: Yup.string()
      })
    )
    .default([])
});

const emptySecurityDeposit = () => ({
  key: nanoid(),
  amount: '',
  date: null,
  paymentType: 'transfer',
  reference: ''
});

const emptyExpense = () => ({
  key: nanoid(),
  title: ''
});

const emptyProperty = () => ({
  key: nanoid(),
  _id: '',
  expenses: [{ ...emptyExpense() }]
});

const initValues = (tenant) => {
  const beginDate = tenant?.beginDate
    ? moment(tenant.beginDate).startOf('day')
    : null;
  const endDate = tenant?.endDate ? moment(tenant.endDate).endOf('day') : null;

  return {
    leaseId: tenant?.leaseId || '',
    beginDate,
    endDate,
    terminated: !!tenant?.terminationDate,
    terminationDate: tenant?.terminationDate
      ? moment(tenant.terminationDate).endOf('day')
      : null,
    properties: tenant?.properties?.length
      ? tenant.properties.map((property) => {
          return {
            key: property.property._id,
            _id: property.property._id,
            rent: property.rent || '',
            expenses: property.expenses?.length
              ? property.expenses.map((expense) => ({
                  ...expense,
                  key: expense.key || nanoid(),
                  beginDate: moment(expense.beginDate),
                  endDate: moment(expense.endDate)
                }))
              : [{ ...emptyExpense(), beginDate, endDate }],
            entryDate: property.entryDate
              ? moment(property.entryDate)
              : moment(beginDate),
            exitDate: property.exitDate
              ? moment(property.exitDate)
              : moment(endDate)
          };
        })
      : [
          {
            ...emptyProperty(),
            expenses: [{ ...emptyExpense(), beginDate, endDate }],
            entryDate: beginDate,
            exitDate: endDate
          }
        ],
    expectedSecurityDeposit: tenant?.expectedSecurityDeposit || 0,
    securityDeposit: (tenant?.securityDeposit || []).map((entry) => ({
      ...entry,
      key: entry.key || nanoid(),
      date: entry.date ? moment(entry.date) : null
    })),
    securityDepositRefund: (tenant?.securityDepositRefund || []).map(
      (entry) => ({
        ...entry,
        key: entry.key || nanoid(),
        date: entry.date ? moment(entry.date) : null
      })
    )
  };
};

const stripDepositKey = ({ key: _k, ...rest }) => rest;

export const validate = (tenant) => {
  const values = initValues(tenant);
  return validationSchema.validate(values, {
    context: {
      beginDate: values.beginDate,
      endDate: values.endDate
    }
  });
};

function LeaseContractForm({ readOnly, onSubmit }) {
  const t = useTranslations('common');
  const store = useStore();
  const paymentTypes = usePaymentTypes();

  const initialValues = useMemo(() => {
    const initialValues = initValues(store.tenant?.selected);

    return initialValues;
  }, [store.tenant.selected]);

  const availableLeases = useMemo(() => {
    return store.lease.items.map(({ _id, name, active }) => ({
      id: _id,
      value: _id,
      label: name,
      disabled: !active
    }));
  }, [store.lease.items]);

  const availableProperties = useMemo(() => {
    const currentProperties = store.tenant.selected?.properties
      ? store.tenant.selected.properties.map(({ propertyId }) => propertyId)
      : [];
    return [
      ...store.property.items.map(({ _id, name, status, occupantLabel }) => ({
        id: _id,
        value: _id,
        label: t('{name} - {status}', {
          name,
          status:
            status === 'occupied'
              ? !currentProperties.includes(_id)
                ? t('occupied by {tenantName}', {
                    tenantName: occupantLabel
                  })
                : t('occupied by current tenant')
              : t('vacant')
        })
      }))
    ];
  }, [t, store.tenant.selected.properties, store.property.items]);

  const _onSubmit = useCallback(
    async (lease) => {
      await onSubmit({
        leaseId: lease.leaseId,
        frequency: store.lease.items.find(({ _id }) => _id === lease.leaseId)
          .timeRange,
        beginDate: lease.beginDate || '',
        endDate: lease.endDate || '',
        terminationDate: lease.terminationDate || '',
        expectedSecurityDeposit: lease.expectedSecurityDeposit || 0,
        securityDeposit: (lease.securityDeposit || []).map(stripDepositKey),
        securityDepositRefund: (lease.securityDepositRefund || []).map(
          stripDepositKey
        ),
        properties: lease.properties
          .filter((property) => !!property._id)
          .map((property) => {
            return {
              propertyId: property._id,
              rent: property.rent,
              expenses: property.expenses.length
                ? property.expenses.map((expense) => ({
                    ...expense,
                    beginDate: expense.beginDate,
                    endDate: expense.endDate
                  }))
                : [],
              entryDate: property.entryDate,
              exitDate: property.exitDate
            };
          })
      });
    },
    [onSubmit, store.lease.items]
  );

  const handleFormValidation = useCallback((value) => {
    try {
      validateYupSchema(value, validationSchema, true, value);
    } catch (err) {
      return yupToFormErrors(err); //for rendering validation errors
    }
    return {};
  }, []);

  return (
    <Formik
      initialValues={initialValues}
      validate={handleFormValidation}
      onSubmit={_onSubmit}
    >
      {({ values }) => {
        let contractDuration = null;
        if (values?.leaseId && !store.tenant.selected.renewalCount) {
          const lease = store.lease.items.find(
            ({ _id }) => _id === values.leaseId
          );
          contractDuration =
            lease.numberOfTerms && lease.timeRange
              ? moment.duration(lease.numberOfTerms, lease.timeRange)
              : null;
        }

        return (
          <Form autoComplete="off">
            {values.terminated && (
              <Section label={t('Termination')}>
                <DateField
                  label={t('Termination date')}
                  name="terminationDate"
                  min={values.beginDate}
                  max={values.endDate}
                  readOnly={readOnly}
                />
                <PaymentsField
                  name="securityDepositRefund"
                  items={values.securityDepositRefund}
                  emptyItem={emptySecurityDeposit()}
                  addLabel={t('Add a security deposit refund')}
                  renderTitle={(_, index) =>
                    t('Refund installment {count}', { count: index + 1 })
                  }
                  paymentTypes={paymentTypes.itemList}
                  typeKey="paymentType"
                  minItems={0}
                  readOnly={readOnly}
                  organizationName={store.organization.selected?.name}
                />
              </Section>
            )}
            <Section
              label={t('Lease')}
              visible={!store.tenant.selected.stepperMode}
            >
              <SelectField
                label={t('Lease')}
                name="leaseId"
                values={availableLeases}
                readOnly={readOnly}
              />
              <RangeDateField
                beginLabel={t('Start date')}
                beginName="beginDate"
                endLabel={t('End date')}
                endName="endDate"
                duration={contractDuration}
                disabled={!values.leaseId}
                readOnly={readOnly}
              />
              <NumberField
                label={t('Expected deposit')}
                name="expectedSecurityDeposit"
                disabled={!values.leaseId}
                readOnly={readOnly}
              />
              <PaymentsField
                name="securityDeposit"
                items={values.securityDeposit}
                emptyItem={emptySecurityDeposit()}
                addLabel={t('Add a security deposit payment')}
                renderTitle={(_, index) =>
                  t('Security deposit installment {count}', {
                    count: index + 1
                  })
                }
                paymentTypes={paymentTypes.itemList}
                typeKey="paymentType"
                minItems={0}
                readOnly={readOnly}
                organizationName={store.organization.selected?.name}
              />
            </Section>
            <Section label={t('Properties')}>
              <ArrayField
                name="properties"
                addLabel={t('Add a property')}
                emptyItem={{
                  ...emptyProperty(),
                  expenses: [
                    {
                      ...emptyExpense(),
                      beginDate: values.beginDate,
                      endDate: values.endDate
                    }
                  ],
                  entryDate: values.beginDate,
                  exitDate: values.endDate
                }}
                items={values.properties}
                renderTitle={(_property, index) =>
                  t('Property {count}', { count: index + 1 })
                }
                renderContent={(property, index) => {
                  const onPropertyChange = (evt) => {
                    const propertyId = evt?.target?.value;
                    if (!propertyId) {
                      return;
                    }
                    const selectedProperty = store.property.items.find(
                      ({ _id }) => _id === propertyId
                    );
                    if (selectedProperty) {
                      const propertyToUpdate = values.properties[index];
                      propertyToUpdate.rent = selectedProperty?.price || '';
                      propertyToUpdate.expenses = [
                        {
                          title: t('General charges'),
                          // TODO: find another way to have expenses configurable
                          amount:
                            Math.round(selectedProperty.price * 100 * 0.1) /
                            100,
                          beginDate: values.beginDate,
                          endDate: values.endDate
                        }
                      ];
                      propertyToUpdate.entryDate = values.beginDate;
                      propertyToUpdate.exitDate = values.endDate;
                    }
                  };

                  return (
                    <Fragment key={property.key}>
                      <div className="sm:flex sm:gap-2">
                        <div className="sm:w-3/4">
                          <SelectField
                            label={t('Property')}
                            name={`properties[${index}]._id`}
                            values={availableProperties}
                            onChange={onPropertyChange}
                            disabled={!values.leaseId}
                            readOnly={readOnly}
                          />
                        </div>
                        <div className="sm:w-1/4">
                          <NumberField
                            label={t('Rent')}
                            name={`properties[${index}].rent`}
                            disabled={!values.properties[index]?._id}
                            readOnly={readOnly}
                          />
                        </div>
                      </div>
                      <RangeDateField
                        beginLabel={t('Entry date')}
                        beginName={`properties[${index}].entryDate`}
                        endLabel={t('Exit date')}
                        endName={`properties[${index}].exitDate`}
                        min={values?.beginDate}
                        max={values?.endDate}
                        disabled={!property?._id}
                        readOnly={readOnly}
                      />
                      <ArrayField
                        name={`properties[${index}].expenses`}
                        addLabel={t('Add a charge')}
                        emptyItem={{
                          ...emptyExpense(),
                          beginDate: values.beginDate,
                          endDate: values.endDate
                        }}
                        items={values.properties[index]?.expenses}
                        renderTitle={(_expense, index_expense) =>
                          t('Charge {count}', {
                            count: index_expense + 1
                          })
                        }
                        renderContent={(_expense, index_expense) => (
                          <Fragment>
                            <div className="space-y-4 sm:space-y-0 sm:flex sm:gap-2">
                              <div className="w-full">
                                <TextField
                                  label={t('Charge')}
                                  name={`properties[${index}].expenses[${index_expense}].title`}
                                  disabled={!values.properties[index]?._id}
                                  readOnly={readOnly}
                                />
                              </div>

                              <div className="w-full">
                                <NumberField
                                  label={t('Amount')}
                                  name={`properties[${index}].expenses[${index_expense}].amount`}
                                  disabled={!values.properties[index]?._id}
                                  readOnly={readOnly}
                                />
                              </div>
                            </div>

                            <RangeDateField
                              beginLabel={t('Start date')}
                              beginName={`properties[${index}].expenses[${index_expense}].beginDate`}
                              endLabel={t('End date')}
                              endName={`properties[${index}].expenses[${index_expense}].endDate`}
                              min={values?.beginDate}
                              max={values?.endDate}
                              disabled={!values.properties[index]?._id}
                              readOnly={readOnly}
                            />
                          </Fragment>
                        )}
                        singleItemDisplay={ArrayFieldDisplay.FRAMED}
                        readOnly={readOnly}
                      />
                    </Fragment>
                  );
                }}
                readOnly={readOnly}
              />
            </Section>
            {!readOnly && <SubmitButton label={t('Save')} />}
          </Form>
        );
      }}
    </Formik>
  );
}

export default observer(LeaseContractForm);
