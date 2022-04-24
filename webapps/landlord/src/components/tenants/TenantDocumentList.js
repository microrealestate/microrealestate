import {
  BlankDocumentIllustration,
  TermsDocumentIllustration,
} from '../Illustrations';
import { Box, Button } from '@material-ui/core';
import { useCallback, useContext, useMemo, useState } from 'react';

import AddIcon from '@material-ui/icons/Add';
import ConfirmDialog from '../ConfirmDialog';
import DocumentList from '../DocumentList';
import { downloadDocument } from '../../utils/fetch';
import FullScreenDialogMenu from '../FullScreenDialogMenu';
import ImageViewer from '../ImageViewer/ImageViewer';
import { observer } from 'mobx-react-lite';
import PdfViewer from '../PdfViewer/PdfViewer';
import RichTextEditorDialog from '../RichTextEditor/RichTextEditorDialog';
import { StoreContext } from '../../store';
import UploadDialog from '../UploadDialog';
import useTranslation from 'next-translate/useTranslation';

function TenantDocumentList({ disabled = false }) {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');

  const [editTextDocument, setEditTextDocument] = useState(false);
  const [editUploadDocument, setEditUploadDocument] = useState(false);
  const [documentToRemove, setDocumentToRemove] = useState(false);
  const [openImageViewer, setOpenImageViewer] = useState(false);
  const [openPdfViewer, setOpenPdfViewer] = useState(false);

  // TODO: optimize to not recompute the document list on each rendered
  const documents = store.document.items.filter(
    ({ tenantId }) => store.tenant.selected?._id === tenantId
  );

  const menuItems = useMemo(() => {
    const templates = store.template.items.filter(
      ({ type, linkedResourceIds = [] }) =>
        type === 'text' &&
        linkedResourceIds.includes(store.tenant.selected?.leaseId)
    );
    return [
      {
        key: 'blank',
        label: t('Blank document'),
        illustration: <BlankDocumentIllustration />,
        value: {},
      },
      ...templates.map((template) => ({
        key: template._id,
        label: template.name,
        illustration: <TermsDocumentIllustration />,
        value: template,
      })),
    ];
  }, [
    //t,
    store.template?.items,
    store.tenant?.selected?.leaseId,
  ]);

  const handleClickEdit = useCallback((doc) => {
    if (doc.type === 'text') {
      setEditTextDocument(doc);
    } else if (doc.type === 'file') {
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
    }
  }, []);

  const handleClickUpload = useCallback(() => {
    setEditUploadDocument(true);
  }, []);

  const handleClickAddText = useCallback(
    async (template) => {
      const { status, data } = await store.document.create({
        name: template.name || t('Untitled document'),
        type: 'text',
        templateId: template._id,
        tenantId: store.tenant.selected?._id,
        leaseId: store.tenant.selected?.leaseId,
      });
      if (status !== 200) {
        return console.error(status);
      }
      setEditTextDocument(data);
    },
    [
      // t,
      store.document,
      store.tenant.selected?._id,
      store.tenant.selected?.leaseId,
    ]
  );

  const handleLoadTextDocument = useCallback(async () => {
    if (!editTextDocument?._id) {
      //TODO: handle this error. It should not fall in this case.
      // document id should always be provided
      return '';
    }
    return editTextDocument.contents;
  }, [editTextDocument?._id, editTextDocument.contents]);

  const handleSaveTextDocument = useCallback(
    async (title, contents, html) => {
      const { status } = await store.document.update({
        ...editTextDocument,
        name: title,
        contents,
        html,
      });
      if (status !== 200) {
        return console.error(status);
      }
    },
    [editTextDocument, store.document]
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
        return console.error(status);
      }
    },
    [
      //t,
      store.document,
      store.tenant.selected?._id,
      store.tenant.selected?.leaseId,
    ]
  );

  const handleDeleteDocument = useCallback(async () => {
    if (!documentToRemove) {
      return;
    }
    await store.document.delete([documentToRemove._id]);
  }, [documentToRemove, store.document]);

  return (
    <>
      <Box display="flex" mb={1}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleClickUpload}
          disabled={disabled}
        >
          {t('Upload document')}
        </Button>
        <Box ml={1}>
          <FullScreenDialogMenu
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            buttonLabel={t('Create document')}
            dialogTitle={t('Create a document')}
            menuItems={menuItems}
            onClick={handleClickAddText}
            disabled={disabled}
          />
        </Box>
      </Box>
      <DocumentList
        documents={documents}
        onEdit={handleClickEdit}
        onDelete={setDocumentToRemove}
        disabled={disabled}
      />
      <RichTextEditorDialog
        open={editTextDocument}
        setOpen={setEditTextDocument}
        onLoad={handleLoadTextDocument}
        onSave={handleSaveTextDocument}
        title={editTextDocument.name}
        editable={!disabled}
      />

      <UploadDialog
        open={editUploadDocument}
        setOpen={setEditUploadDocument}
        onSave={handleSaveUploadDocument}
      />

      <ConfirmDialog
        title={t('Are you sure to remove this document?')}
        subTitle={documentToRemove.name}
        open={documentToRemove}
        setOpen={setDocumentToRemove}
        onConfirm={handleDeleteDocument}
      />

      <ImageViewer open={openImageViewer} setOpen={setOpenImageViewer} />

      <PdfViewer open={openPdfViewer} setOpen={setOpenPdfViewer} />
    </>
  );
}

export default observer(TenantDocumentList);
