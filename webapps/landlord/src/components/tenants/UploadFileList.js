import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useStore } from '@/providers/StoreProvider';
import { downloadDocument } from '../../utils/fetch';
import ConfirmDialog from '../ConfirmDialog';
import DocumentViewerDialog from '../DocumentViewer/DocumentViewerDialog';
import UploadDialog from '../UploadDialog';
import UploadFileItem from './UploadFileItem';

function UploadFileList({ disabled }) {
  const t = useTranslations('common');
  const store = useStore();
  const [
    openDocumentToRemoveConfirmDialog,
    setOpenDocumentToRemoveConfirmDialog
  ] = useState(false);
  const [selectedDocumentToRemove, setSelectedDocumentToRemove] =
    useState(null);

  const [openUploadDocumentDialog, setOpenUploadDocumentDialog] =
    useState(false);

  const [selectedDocumentToEdit, setSelectedDocumentToEdit] = useState(null);

  const [openDocumentViewer, setOpenDocumentViewer] = useState(false);
  const [selectedDocumentToView, setSelectedDocumentToView] = useState();

  const files = useMemo(() => {
    const existingDocuments = store.document.items
      .filter(
        (doc) =>
          doc.relatesTo.tenants.includes(store.tenant.selected?._id) &&
          doc.type === 'file'
      )
      .reduce((acc, doc) => {
        if (!doc.relatesTo.template) {
          return acc;
        }

        if (!acc[doc.relatesTo.template]) {
          acc[doc.relatesTo.template] = [];
        }
        acc[doc.relatesTo.template].push({
          _id: doc._id,
          name: doc.name,
          url: doc.url,
          mimeType: doc.mimeType,
          expiryDate: doc.expiryDate,
          createdDate: doc.createdDate,
          updatedDate: doc.updatedDate
        });
        return acc;
      }, {});

    return store.template.items
      .filter((template) => {
        if (store.tenant.selected?.terminated) {
          return (
            template.type === 'fileDescriptor' &&
            template.relatesTo?.includes(store.tenant.selected?.leaseId)
          );
        }
        return (
          template.type === 'fileDescriptor' &&
          template.relatesTo?.includes(store.tenant.selected?.leaseId) &&
          !template.requiredOnceContractTerminated
        );
      })
      .map((template) => ({
        template,
        documents: existingDocuments[template._id] || []
      }));
  }, [
    store.document.items,
    store.template.items,
    store.tenant.selected?._id,
    store.tenant.selected?.leaseId,
    store.tenant.selected?.terminated
  ]);

  const handleView = useCallback(
    (doc) => {
      const mimeType = doc.mimeType || '';
      if (mimeType.includes('image/') || mimeType.includes('application/pdf')) {
        setSelectedDocumentToView({
          url: `/documents/${doc._id}`,
          title: doc.name,
          mimeType: doc.mimeType
        });
        setOpenDocumentViewer(true);
      } else {
        downloadDocument({
          endpoint: `/documents/${doc._id}`,
          documentName: doc.name
        }).catch((_error) => {
          toast.error(t('Cannot download document'));
        });
      }
    },
    [t]
  );

  const handleUpload = useCallback((template) => {
    setSelectedDocumentToEdit(template);
    setOpenUploadDocumentDialog(true);
  }, []);

  const handleDelete = useCallback((doc) => {
    setSelectedDocumentToRemove(doc);
    setOpenDocumentToRemoveConfirmDialog(true);
  }, []);

  const handleSaveDocument = async (doc) => {
    const { status } = await store.document.create({
      tenantId: store.tenant.selected?._id,
      leaseId: store.tenant.selected?.leaseId,
      templateId: doc.template._id,
      type: 'file',
      name: doc.name || t('Untitled document'),
      description: doc.description || '',
      mimeType: doc.mimeType || '',
      expiryDate: doc.expiryDate || '',
      url: doc.url || ''
    });
    if (status !== 200) {
      // Throw so UploadDialog keeps itself open for retry instead of closing
      // on an uploaded-but-unsaved (orphaned) file.
      throw new Error('Failed to save document');
    }
  };

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
      <div className="mt-8 space-y-10">
        {files.map((file) => {
          return (
            <UploadFileItem
              key={file.template._id}
              file={file}
              disabled={disabled}
              onView={handleView}
              onUpload={handleUpload}
              onDelete={handleDelete}
            />
          );
        })}
      </div>

      <UploadDialog
        open={openUploadDocumentDialog}
        setOpen={setOpenUploadDocumentDialog}
        data={selectedDocumentToEdit}
        onSave={handleSaveDocument}
      />

      <DocumentViewerDialog
        open={openDocumentViewer}
        setOpen={setOpenDocumentViewer}
        serverFile={selectedDocumentToView}
      />

      <ConfirmDialog
        title={t('Are you sure to remove this document?')}
        subTitle={selectedDocumentToRemove?.name}
        open={openDocumentToRemoveConfirmDialog}
        setOpen={setOpenDocumentToRemoveConfirmDialog}
        data={selectedDocumentToRemove}
        onConfirm={handleDeleteDocument}
      />
    </>
  );
}

export default observer(UploadFileList);
