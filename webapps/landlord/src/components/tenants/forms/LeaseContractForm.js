/* eslint-disable sort-imports */
import {
  DateField,
  SelectField,
  SubmitButton
} from '@microrealestate/commonui/components';
import { useCallback, useContext, useMemo, useState } from 'react';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';
import { observer } from 'mobx-react-lite';
import PdfViewer from '../../PdfViewer/PdfViewer';
import { Section } from '../../formfields/Section';
import { StoreContext } from '../../../store';
import { downloadDocument, uploadDocument } from '../../../utils/fetch';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';
/* eslint-enable sort-imports */

const CONTRACT_PDF_DESCRIPTION = 'uploaded_contract_pdf';
const CUSTOM_LEASE_VALUE = '__custom__';

const validationSchema = Yup.object().shape({
  leaseId: Yup.string().nullable(),
  beginDate: Yup.date().nullable(),
  endDate: Yup.date().nullable()
});

const initValues = (tenant) => ({
  leaseId:
    tenant?.leaseId?._id ||
    (typeof tenant?.leaseId === 'string' && tenant.leaseId ? tenant.leaseId : null) ||
    CUSTOM_LEASE_VALUE,
  propertyId: tenant?.properties?.[0]?.propertyId || tenant?.properties?.[0]?.property?._id || '',
  beginDate: tenant?.beginDate
    ? moment(tenant.beginDate, 'DD/MM/YYYY').startOf('day').toDate()
    : null,
  endDate: tenant?.endDate
    ? moment(tenant.endDate, 'DD/MM/YYYY').endOf('day').toDate()
    : null
});

export const validate = (tenant) =>
  validationSchema.validate(initValues(tenant));

function LeaseContractForm({ readOnly, onSubmit }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [uploadingContractPdf, setUploadingContractPdf] = useState(false);
  const [pdfDoc, setPdfDoc] = useState();
  const [openPdfViewer, setOpenPdfViewer] = useState(false);

  const initialValues = useMemo(
    () => initValues(store.tenant?.selected),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      store.tenant.selected?._id,
      store.tenant.selected?.beginDate,
      store.tenant.selected?.endDate,
      store.tenant.selected?.leaseId
    ]
  );

  const availableLeases = useMemo(
    () => [
      {
        id: CUSTOM_LEASE_VALUE,
        value: CUSTOM_LEASE_VALUE,
        label: t('Custom lease (no template)')
      },
      ...store.lease.items.map(({ _id, name, active }) => ({
        id: _id,
        value: _id,
        label: name,
        disabled: !active
      }))
    ],
    [store.lease.items, t]
  );

  const uploadedContractPdfs = useMemo(
    () =>
      (store.document.items || []).filter(
        ({ tenantId, type, description }) =>
          String(tenantId) === String(store.tenant.selected?._id) &&
          type === 'file' &&
          description === CONTRACT_PDF_DESCRIPTION
      ),
    [store.document.items, store.tenant.selected?._id]
  );

  const availableProperties = useMemo(
    () => [
      { id: '', value: '', label: t('No property assigned') },
      ...store.property.items.map(({ _id, name }) => ({
        id: _id,
        value: _id,
        label: name
      }))
    ],
    [store.property.items, t]
  );

  const _onSubmit = useCallback(
    async (values) => {
      const submittedLeaseId =
        values.leaseId === CUSTOM_LEASE_VALUE ? null : values.leaseId;
      await onSubmit({
        leaseId: submittedLeaseId || null,
        frequency: store.lease.items.find(({ _id }) => _id === submittedLeaseId)
          ?.timeRange,
        beginDate: values.beginDate
          ? moment(values.beginDate).format('DD/MM/YYYY')
          : '',
        endDate: values.endDate
          ? moment(values.endDate).format('DD/MM/YYYY')
          : '',
        propertyId: values.propertyId || null
      });
    },
    [onSubmit, store.lease.items]
  );

  const handleUploadContractPdf = useCallback(
    async (event, leaseId) => {
      const file = event?.target?.files?.[0];
      event.target.value = '';
      if (!file) return;
      if (file.type !== 'application/pdf') {
        toast.error(t('Only PDF files are allowed'));
        return;
      }
      if (!store.tenant.selected?._id) {
        toast.error(t('Tenant must be saved before uploading a contract'));
        return;
      }
      const selectedLeaseId = leaseId === CUSTOM_LEASE_VALUE ? null : leaseId;
      const fallbackLeaseId =
        store.tenant.selected?.leaseId?._id ||
        (typeof store.tenant.selected?.leaseId === 'string'
          ? store.tenant.selected.leaseId
          : null);
      const leaseIdToUse = selectedLeaseId || fallbackLeaseId || null;

      try {
        setUploadingContractPdf(true);
        const uploadResponse = await uploadDocument({
          endpoint: '/documents/upload',
          documentName: file.name,
          file,
          folder: [
            store.tenant.selected.name?.replace(/[\/\\]/g, '_') ||
              'tenant-documents',
            'lease_contracts'
          ].join('/')
        });

        const { status } = await store.document.create({
          tenantId: store.tenant.selected._id,
          ...(leaseIdToUse ? { leaseId: leaseIdToUse } : {}),
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
        // Refresh document store so the list shows immediately
        await store.document.fetch();
        toast.success(t('Contract PDF uploaded'));
      } catch {
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
        validationSchema={validationSchema}
        onSubmit={_onSubmit}
        enableReinitialize
      >
        {({ values, isSubmitting }) => (
          <Form autoComplete="off">
            <Section
              label={t('Lease')}
              visible={!store.tenant.selected.stepperMode}
            >
              <SelectField
                label={t('Lease type')}
                name="leaseId"
                values={availableLeases}
                disabled={readOnly}
              />
              <SelectField
                label={t('Property')}
                name="propertyId"
                values={availableProperties}
                disabled={readOnly}
              />
              <DateField
                label={t('Start date')}
                name="beginDate"
                disabled={readOnly}
              />
              <DateField
                label={t('End date')}
                name="endDate"
                disabled={readOnly}
              />

              <div className="mt-4 rounded border p-3 space-y-2">
                <div className="text-sm font-medium">{t('Contract PDF')}</div>
                <div className="text-xs text-muted-foreground">
                  {t('Upload the signed lease contract PDF.')}
                </div>

                {!readOnly && (
                  <label className="inline-flex items-center px-3 py-1.5 border rounded text-sm cursor-pointer hover:bg-muted">
                    {uploadingContractPdf ? t('Uploading...') : t('Upload PDF')}
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

            {!readOnly && (
              <SubmitButton
                size="large"
                label={!isSubmitting ? t('Save') : t('Saving')}
              />
            )}
          </Form>
        )}
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
