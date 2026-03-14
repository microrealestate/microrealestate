import * as Yup from 'yup';
import {
  DateField,
  NumberField,
  RangeDateField,
  SelectField,
  SubmitButton,
  TextField
} from '@microrealestate/commonui/components';
import {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { Form, Formik, validateYupSchema, yupToFormErrors } from 'formik';

import { ArrayField } from '../../formfields/ArrayField';
import moment from 'moment';
import { nanoid } from 'nanoid';
import { observer } from 'mobx-react-lite';
import PdfViewer from '../../PdfViewer/PdfViewer';
import { Section } from '../../formfields/Section';
import { StoreContext } from '../../../store';
import { downloadDocument, uploadDocument } from '../../../utils/fetch';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';

const CONTRACT_PDF_DESCRIPTION = 'uploaded_contract_pdf';

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
  guaranty: Yup.number().min(0).required(),
  guarantyPayback: Yup.number().min(0)
});

const emptyExpense = () => ({
  key: nanoid(),
  title: '',
  amount: 0,
  beginDate: null,
  endDate: null
});

const emptyProperty = () => ({
  key: nanoid(),
  _id: '',
  rent: 0,
  expenses: [{ ...emptyExpense() }]
});

const initValues = (tenant) => {
  const beginDate = tenant?.beginDate
    ? moment(tenant.beginDate, 'DD/MM/YYYY').startOf('day')
    : null;
  const endDate = tenant?.endDate
    ? moment(tenant.endDate, 'DD/MM/YYYY').endOf('day')
    : null;

  return {
    leaseId: tenant?.leaseId || '',
    beginDate,
    endDate,
    terminated: !!tenant?.terminationDate,
    terminationDate: tenant?.terminationDate
      ? moment(tenant.terminationDate, 'DD/MM/YYYY').endOf('day')
      : null,
    properties: tenant?.properties?.length
      ? tenant.properties.map((property) => {
          return {
            key: property.property._id,
            _id: property.property._id,
            rent: property.rent || '',
            expenses: property.expenses.map((expense) => ({
              ...expense,
              beginDate: moment(expense.beginDate, 'DD/MM/YYYY'),
              endDate: moment(expense.endDate, 'DD/MM/YYYY')
            })) || [...emptyExpense(), beginDate, endDate],
            entryDate: property.entryDate
              ? moment(property.entryDate, 'DD/MM/YYYY')
              : moment(beginDate),
            exitDate: property.exitDate
              ? moment(property.exitDate, 'DD/MM/YYYY')
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
    guaranty: tenant?.guaranty || 0,
    guarantyPayback: tenant?.guarantyPayback || 0
  };
};

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
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [contractDuration, setContractDuration] = useState();
  const [uploadingContractPdf, setUploadingContractPdf] = useState(false);
  const [pdfDoc, setPdfDoc] = useState();
  const [openPdfViewer, setOpenPdfViewer] = useState(false);

  useEffect(() => {
    const lease = store.tenant.selected?.lease;
    if (lease) {
      setContractDuration(
        moment.duration(lease.numberOfTerms, lease.timeRange)
      );
    } else {
      setContractDuration();
    }
  }, [store.tenant.selected?.lease]);

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
      { id: '', label: '', value: '' },
      ...store.property.items.map(({ _id, name, status, occupantLabel }) => ({
        id: _id,
        value: _id,
        label: t('{{name}} - {{status}}', {
          name,
          status:
            status === 'occupied'
              ? !currentProperties.includes(_id)
                ? t('occupied by {{tenantName}}', {
                    tenantName: occupantLabel
                  })
                : t('occupied by current tenant')
              : t('vacant')
        })
      }))
    ];
  }, [t, store.tenant.selected.properties, store.property.items]);

  const uploadedContractPdfs = useMemo(() => {
    return (store.document.items || []).filter(
      ({ tenantId, type, description }) =>
        String(tenantId) === String(store.tenant.selected?._id) &&
        type === 'file' &&
        description === CONTRACT_PDF_DESCRIPTION
    );
  }, [store.document.items, store.tenant.selected?._id]);

  const _onSubmit = useCallback(
    async (lease) => {
      await onSubmit({
        leaseId: lease.leaseId,
        frequency: store.lease.items.find(({ _id }) => _id === lease.leaseId)
          .timeRange,
        beginDate: lease.beginDate?.format('DD/MM/YYYY') || '',
        endDate: lease.endDate?.format('DD/MM/YYYY') || '',
        terminationDate: lease.terminationDate?.format('DD/MM/YYYY') || '',
        guaranty: lease.guaranty || 0,
        guarantyPayback: lease.guarantyPayback || 0,
        properties: lease.properties
          .filter((property) => !!property._id)
          .map((property) => {
            return {
              propertyId: property._id,
              rent: property.rent,
              expenses: property.expenses.length
                ? property.expenses.map((expense) => ({
                    ...expense,
                    beginDate: expense.beginDate.format('DD/MM/YYYY'),
                    endDate: expense.endDate.format('DD/MM/YYYY')
                  }))
                : [],
              entryDate: property.entryDate?.format('DD/MM/YYYY'),
              exitDate: property.exitDate?.format('DD/MM/YYYY')
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

  const handleUploadContractPdf = useCallback(
    async (event, leaseId) => {
      const file = event?.target?.files?.[0];
      event.target.value = '';

      if (!file) {
        return;
      }

      if (file.type !== 'application/pdf') {
        toast.error(t('Only PDF files are allowed'));
        return;
      }

      if (!store.tenant.selected?._id) {
        toast.error(t('Tenant must be saved before uploading a contract'));
        return;
      }

      if (!leaseId && !store.tenant.selected?.leaseId) {
        toast.error(t('Please select and save a lease before uploading PDF'));
        return;
      }

      const leaseIdToUse = leaseId || store.tenant.selected?.leaseId;

      try {
        setUploadingContractPdf(true);

        const uploadResponse = await uploadDocument({
          endpoint: '/documents/upload',
          documentName: file.name,
          file,
          folder: [
            store.tenant.selected.name?.replace(/[/\\]/g, '_') ||
              'tenant-documents',
            'lease_contracts'
          ].join('/')
        });

        const { status } = await store.document.create({
          tenantId: store.tenant.selected._id,
          leaseId: leaseIdToUse,
          type: 'file',
          name: file.name,
          description: CONTRACT_PDF_DESCRIPTION,
          mimeType: file.type,
          url: uploadResponse.data.key,
          versionId: uploadResponse.data.versionId
        });

        if (status !== 200) {
          toast.error(t('Cannot save document'));
          return;
        }

        toast.success(t('Contract PDF uploaded'));
      } catch (error) {
        toast.error(t('Cannot upload document'));
      } finally {
        setUploadingContractPdf(false);
      }
    },
    [store, t]
  );

  const handleDeleteContractPdf = useCallback(
    async (documentId) => {
      const { status } = await store.document.delete([documentId]);
      if (status !== 200) {
        toast.error(t('Something went wrong'));
        return;
      }
      toast.success(t('Contract PDF removed'));
    },
    [store.document, t]
  );

  return (
    <>
      <Formik
        initialValues={initialValues}
        validate={handleFormValidation}
        onSubmit={_onSubmit}
      >
        {({ values, isSubmitting, handleChange }) => {
          const onLeaseChange = (evt) => {
            const lease = store.lease.items.find(
              ({ _id }) => _id === evt.target.value
            );
            if (lease) {
              setContractDuration(
                moment.duration(lease.numberOfTerms, lease.timeRange)
              );
            } else {
              setContractDuration();
            }
            handleChange(evt);
          };
          const onPropertyChange = (evt, previousProperty) => {
            const property = store.property.items.find(
              ({ _id }) => _id === evt.target.value
            );
            if (previousProperty) {
              previousProperty._id = property?._id;
              previousProperty.rent = property?.price || '';
              previousProperty.expenses = [
                {
                  title: t('General expenses'),
                  // TODO: find another way to have expenses configurable
                  amount: Math.round(property.price * 100 * 0.1) / 100,
                  beginDate: values.beginDate,
                  endDate: values.endDate
                }
              ];
            }
            handleChange(evt);
          };

          return (
            <Form autoComplete="off">
              {values.terminated && (
                <Section label={t('Termination')}>
                  <DateField
                    label={t('Termination date')}
                    name="terminationDate"
                    minDate={values.beginDate.toISOString()}
                    maxDate={values.endDate.toISOString()}
                    disabled={readOnly}
                  />
                  <NumberField
                    label={t('Amount of the deposit refund')}
                    name="guarantyPayback"
                    disabled={readOnly}
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
                  onChange={onLeaseChange}
                  disabled={readOnly}
                />
                <RangeDateField
                  beginLabel={t('Start date')}
                  beginName="beginDate"
                  endLabel={t('End date')}
                  endName="endDate"
                  duration={contractDuration}
                  disabled={!values.leaseId || readOnly}
                />
                <NumberField
                  label={t('Deposit')}
                  name="guaranty"
                  disabled={!values.leaseId || readOnly}
                />

                <div className="mt-4 rounded border p-3 space-y-2">
                  <div className="text-sm font-medium">
                    {t('Uploaded contract PDF')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t(
                      'Optional: upload the signed lease contract PDF if you do not use generated text contracts.'
                    )}
                  </div>

                  {!readOnly && (
                    <label className="inline-flex items-center px-3 py-1.5 border rounded text-sm cursor-pointer hover:bg-muted">
                      {uploadingContractPdf
                        ? t('Uploading...')
                        : t('Upload PDF')}
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        disabled={uploadingContractPdf}
                        onChange={(event) =>
                          handleUploadContractPdf(event, values.leaseId)
                        }
                      />
                    </label>
                  )}

                  {uploadedContractPdfs.length ? (
                    <div className="space-y-2">
                      {uploadedContractPdfs.map((doc) => (
                        <div
                          key={doc._id}
                          className="flex flex-col gap-2 rounded border p-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="text-sm">{doc.name}</div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="text-xs text-blue-600 hover:text-blue-800"
                              onClick={() => {
                                setPdfDoc({
                                  url: `/documents/${doc._id}`,
                                  title: doc.name
                                });
                                setOpenPdfViewer(true);
                              }}
                            >
                              {t('View')}
                            </button>
                            <button
                              type="button"
                              className="text-xs text-blue-600 hover:text-blue-800"
                              onClick={() =>
                                downloadDocument({
                                  endpoint: `/documents/${doc._id}`,
                                  documentName: doc.name
                                })
                              }
                            >
                              {t('Download')}
                            </button>
                            {!readOnly && (
                              <button
                                type="button"
                                className="text-xs text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteContractPdf(doc._id)}
                              >
                                {t('Delete')}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      {t('No contract PDF uploaded yet')}
                    </div>
                  )}
                </div>
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
                    endDate: values.endDate
                  }}
                  items={values.properties}
                  renderTitle={(property, index) =>
                    t('Property #{{count}}', { count: index + 1 })
                  }
                  renderContent={(property, index) => (
                    <Fragment key={property.key}>
                      <div className="sm:flex sm:gap-2">
                        <div className="md:w-3/4">
                          <SelectField
                            label={t('Property')}
                            name={`properties[${index}]._id`}
                            values={availableProperties}
                            onChange={(evt) => onPropertyChange(evt, property)}
                            disabled={readOnly}
                          />
                        </div>
                        <div className="md:w-1/4">
                          <NumberField
                            label={t('Rent')}
                            name={`properties[${index}].rent`}
                            disabled={
                              !values.properties[index]?._id || readOnly
                            }
                          />
                        </div>
                      </div>
                      <ArrayField
                        name={`properties[${index}].expenses`}
                        addLabel={t('Add a expense')}
                        emptyItem={{
                          ...emptyExpense(),
                          beginDate: values.beginDate,
                          endDate: values.endDate
                        }}
                        items={values.properties[index]?.expenses}
                        renderTitle={(expense, index_expense) =>
                          t('Expense #{{count}}', { count: index_expense + 1 })
                        }
                        renderContent={(expense, index_expense) => (
                          <Fragment key={expense.key}>
                            <div className="sm:flex sm:gap-2">
                              <div className="md:w-1/2">
                                <TextField
                                  label={t('Expense')}
                                  name={`properties[${index}].expenses[${index_expense}].title`}
                                  disabled={
                                    !values.properties[index]?._id || readOnly
                                  }
                                />
                              </div>

                              <div className="md:w-1/6">
                                <NumberField
                                  label={t('Amount')}
                                  name={`properties[${index}].expenses[${index_expense}].amount`}
                                  disabled={
                                    !values.properties[index]?._id || readOnly
                                  }
                                />
                              </div>

                              <div>
                                <RangeDateField
                                  beginLabel={t('Start date')}
                                  beginName={`properties[${index}].expenses[${index_expense}].beginDate`}
                                  endLabel={t('End date')}
                                  endName={`properties[${index}].expenses[${index_expense}].endDate`}
                                  minDate={values?.beginDate}
                                  maxDate={values?.endDate}
                                  disabled={
                                    !values.properties[index]?._id || readOnly
                                  }
                                />
                              </div>
                            </div>
                          </Fragment>
                        )}
                        readOnly={readOnly}
                      />
                      <RangeDateField
                        beginLabel={t('Entry date')}
                        beginName={`properties[${index}].entryDate`}
                        endLabel={t('Exit date')}
                        endName={`properties[${index}].exitDate`}
                        minDate={values?.beginDate}
                        maxDate={values?.endDate}
                        disabled={!property?._id || readOnly}
                      />
                    </Fragment>
                  )}
                  readOnly={readOnly}
                />
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

      <PdfViewer
        open={openPdfViewer}
        setOpen={setOpenPdfViewer}
        pdfDoc={pdfDoc}
      />
    </>
  );
}

export default observer(LeaseContractForm);
