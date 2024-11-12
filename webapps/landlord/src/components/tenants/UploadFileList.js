import { Card, CardContent } from '../ui/card';
import { useCallback, useContext, useMemo, useState } from 'react';
import { Alert } from '../ui/alert';
import ConfirmDialog from '../ConfirmDialog';
import { downloadDocument } from '../../utils/fetch';
import ImageViewer from '../ImageViewer/ImageViewer';
import { LuAlertTriangle } from 'react-icons/lu';
import { observer } from 'mobx-react-lite';
import PdfViewer from '../PdfViewer/PdfViewer';
import { StoreContext } from '../../store';
import { toast } from 'sonner';
import UploadDialog from '../UploadDialog';
import UploadFileItem from './UploadFileItem';
import useTranslation from 'next-translate/useTranslation';

function UploadFileList({ disabled }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [
    openDocumentToRemoveConfirmDialog,
    setOpenDocumentToRemoveConfirmDialog
  ] = useState(false);
  const [selectedDocumentToRemove, setSelectedDocumentToRemove] =
    useState(null);
  const [openUploadDocumentDialog, setOpenUploadDocumentDialog] =
    useState(false);
  const [selectedUploadDocument, setSelectedUploadDocument] = useState(null);
  const [openImageViewer, setOpenImageViewer] = useState(false);
  const [pdfDoc, setPdfDoc] = useState();
  const [openPdfViewer, setOpenPdfViewer] = useState(false);

  const files = useMemo(() => {
    const existingDocuments = store.document.items
      .filter(
        ({ tenantId, type }) =>
          store.tenant.selected?._id === tenantId && type === 'file'
      )
      .reduce((acc, doc) => {
        acc[doc.templateId] = {
          _id: doc._id,
          url: doc.url,
          versionId: doc.versionId,
          mimeType: doc.mimeType,
          expiryDate: doc.expiryDate,
          createdDate: doc.createdDate,
          updatedDate: doc.updatedDate
        };
        return acc;
      }, {});

    return store.template.items
      .filter((template) => {
        if (store.tenant.selected.terminated) {
          return (
            template.type === 'fileDescriptor' &&
            template.linkedResourceIds?.includes(store.tenant.selected?.leaseId)
          );
        }
        return (
          template.type === 'fileDescriptor' &&
          template.linkedResourceIds?.includes(
            store.tenant.selected?.leaseId
          ) &&
          !template.requiredOnceContractTerminated
        );
      })
      .map((template) => ({
        template,
        document: existingDocuments[template._id]
      }));
  }, [
    store.document.items,
    store.template.items,
    store.tenant.selected?._id,
    store.tenant.selected?.leaseId,
    store.tenant.selected.terminated
  ]);

  const handleView = useCallback((doc, template) => {
    if (doc.mimeType.indexOf('image/') !== -1) {
      setOpenImageViewer({ url: `/documents/${doc._id}`, title: doc.name });
    } else if (doc.mimeType.indexOf('application/pdf') !== -1) {
      setPdfDoc({ url: `/documents/${doc._id}`, title: template.name });
      setOpenPdfViewer(true);
    } else {
      downloadDocument({
        endpoint: `/documents/${doc._id}`,
        documentName: doc.name
      });
    }
  }, []);

  const handleUpload = useCallback(
    (template) => {
      setSelectedUploadDocument(template);
      setOpenUploadDocumentDialog(true);
    },
    [setOpenUploadDocumentDialog, setSelectedUploadDocument]
  );

  const handleDelete = useCallback(
    (doc) => {
      setSelectedDocumentToRemove(doc);
      setOpenDocumentToRemoveConfirmDialog(true);
    },
    [setOpenDocumentToRemoveConfirmDialog, setSelectedDocumentToRemove]
  );

  const handleSaveUploadDocument = useCallback(
    async (doc) => {
      const { status } = await store.document.create({
        tenantId: store.tenant.selected?._id,
        leaseId: store.tenant.selected?.leaseId,
        templateId: doc.template._id,
        type: 'file',
        name: doc.name || t('Untitled document'),
        description: doc.description || '',
        mimeType: doc.mimeType || '',
        expiryDate: doc.expiryDate || '',
        url: doc.url || '',
        versionId: doc.versionId
      });
      if (status !== 200) {
        return toast.error(t('Something went wrong'));
      }
    },
    [store, t]
  );

  const handleDeleteDocument = useCallback(async () => {
    if (!selectedDocumentToRemove) {
      return;
    }
    const { status } = await store.document.delete([
      selectedDocumentToRemove._id
    ]);
    if (status !== 200) {
      return toast.error(t('Something went wrong'));
    }
  }, [selectedDocumentToRemove, store, t]);

  return (
    <>
      {!store.organization.canUploadDocumentsInCloud ? (
        <Alert variant="warning" className="mb-2">
          <div className="flex items-center gap-4">
            <LuAlertTriangle className="size-6" />
            <div className="text-sm">
              {t(
                'Unable to upload documents without configuring the cloud storage service in Settings page'
              )}
            </div>
          </div>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-0 h-72 overflow-y-auto">
          {files.map(({ template, document }) => {
            return (
              <UploadFileItem
                key={template._id}
                template={template}
                document={document}
                disabled={
                  disabled || !store.organization.canUploadDocumentsInCloud
                }
                onView={handleView}
                onUpload={handleUpload}
                onDelete={handleDelete}
              />
            );
          })}
        </CardContent>
      </Card>

      <UploadDialog
        open={openUploadDocumentDialog}
        setOpen={setOpenUploadDocumentDialog}
        data={selectedUploadDocument}
        onSave={handleSaveUploadDocument}
      />

      <ConfirmDialog
        title={t('Are you sure to remove this document?')}
        subTitle={selectedDocumentToRemove?.name}
        open={openDocumentToRemoveConfirmDialog}
        setOpen={setOpenDocumentToRemoveConfirmDialog}
        data={selectedDocumentToRemove}
        onConfirm={handleDeleteDocument}
      />

      <ImageViewer open={openImageViewer} setOpen={setOpenImageViewer} />

      <PdfViewer
        open={openPdfViewer}
        setOpen={setOpenPdfViewer}
        pdfDoc={pdfDoc}
      />
    </>
  );
}

export default observer(UploadFileList);
