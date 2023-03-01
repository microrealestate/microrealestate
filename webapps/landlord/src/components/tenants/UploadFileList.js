import { Box, List, Paper } from '@material-ui/core';
import { useCallback, useContext, useMemo, useState } from 'react';

import Alert from '../Alert';
import { downloadDocument } from '../../utils/fetch';
import ImageViewer from '../ImageViewer/ImageViewer';
import { observer } from 'mobx-react-lite';
import PdfViewer from '../PdfViewer/PdfViewer';
import { StoreContext } from '../../store';
import UploadFileItem from './UploadFileItem';
import useConfirmDialog from '../ConfirmDialog';
import useTranslation from 'next-translate/useTranslation';
import useUploadDialog from '../UploadDialog';

function UploadFileList({ disabled }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [ConfirmDialog, setDocumentToRemove, documentToRemove] =
    useConfirmDialog();
  const [UploadDialog, setEditUploadDocument] = useUploadDialog();
  const [openImageViewer, setOpenImageViewer] = useState(false);
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
          updatedDate: doc.updatedDate,
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
        document: existingDocuments[template._id],
      }));
  }, [
    store.document.items,
    store.template.items,
    store.tenant.selected?._id,
    store.tenant.selected?.leaseId,
    store.tenant.selected.terminated,
  ]);

  const handleView = useCallback((doc) => {
    if (doc.mimeType.indexOf('image/') !== -1) {
      setOpenImageViewer({ url: `/documents/${doc._id}`, title: doc.name });
    } else if (doc.mimeType.indexOf('application/pdf') !== -1) {
      setOpenPdfViewer({ url: `/documents/${doc._id}`, title: doc.name });
    } else {
      downloadDocument({
        endpoint: `/documents/${doc._id}`,
        documentName: doc.name,
      });
    }
  }, []);

  const handleUpload = useCallback(
    (template) => {
      setEditUploadDocument(template);
    },
    [setEditUploadDocument]
  );

  const handleDelete = useCallback(
    (doc) => {
      setDocumentToRemove(doc);
    },
    [setDocumentToRemove]
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
        versionId: doc.versionId,
      });
      if (status !== 200) {
        return store.pushToastMessage({
          message: t('Something went wrong'),
          severity: 'error',
        });
      }
    },
    [store, t]
  );

  const handleDeleteDocument = useCallback(async () => {
    if (!documentToRemove) {
      return;
    }
    const { status } = await store.document.delete([documentToRemove._id]);
    if (status !== 200) {
      return store.pushToastMessage({
        message: t('Something went wrong'),
        severity: 'error',
      });
    }
  }, [documentToRemove, store, t]);

  return (
    <>
      {!store.organization.canUploadDocumentsInCloud ? (
        <Box mb={1}>
          <Alert
            severity="warning"
            title={t(
              'Unable to upload documents without configuring the cloud storage service in Settings page'
            )}
          />
        </Box>
      ) : null}

      <Paper variant="outlined">
        <Box minHeight={200}>
          <List>
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
          </List>
        </Box>
      </Paper>

      <UploadDialog onSave={handleSaveUploadDocument} />

      <ConfirmDialog
        title={t('Are you sure to remove this document?')}
        subTitle={documentToRemove.name}
        onConfirm={handleDeleteDocument}
      />

      <ImageViewer open={openImageViewer} setOpen={setOpenImageViewer} />

      <PdfViewer open={openPdfViewer} setOpen={setOpenPdfViewer} />
    </>
  );
}

export default observer(UploadFileList);
