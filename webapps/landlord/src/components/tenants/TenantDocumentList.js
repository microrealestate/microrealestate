import {
  BlankDocumentIllustration,
  TermsDocumentIllustration,
} from '../Illustrations';
import { Box, Button, useMediaQuery } from '@material-ui/core';
import { useCallback, useContext, useMemo, useState } from 'react';

import AddIcon from '@material-ui/icons/Add';
import DocumentList from '../DocumentList';
import { downloadDocument } from '../../utils/fetch';
import FullScreenDialogMenu from '../FullScreenDialogMenu';
import ImageViewer from '../ImageViewer/ImageViewer';
import { MobileButton } from '../MobileMenuButton';
import { Observer } from 'mobx-react-lite';
import PdfViewer from '../PdfViewer/PdfViewer';
import { StoreContext } from '../../store';
import useConfirmDialog from '../ConfirmDialog';
import useRichTextEditorDialog from '../RichTextEditor/RichTextEditorDialog';
import useTranslation from 'next-translate/useTranslation';
import useUploadDialog from '../UploadDialog';

function DocumentItems({ onView, onEdit, onDelete, disabled }) {
  const store = useContext(StoreContext);
  return (
    <Observer>
      {() => {
        const documents = store.document.items.filter(
          ({ tenantId }) => store.tenant.selected?._id === tenantId
        );

        return (
          <DocumentList
            documents={documents}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            disabled={disabled}
          />
        );
      }}
    </Observer>
  );
}

function TenantDocumentList({ disabled = false }) {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const [ConfirmDialog, setDocumentToRemove, documentToRemove] =
    useConfirmDialog();
  const [UploadDialog, setEditUploadDocument] = useUploadDialog();

  const [RichTextEditorDialog, setEditTextDocument, editTextDocument] =
    useRichTextEditorDialog();
  const [openImageViewer, setOpenImageViewer] = useState(false);
  const [openPdfViewer, setOpenPdfViewer] = useState(false);

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
  }, [t, store.template?.items, store.tenant?.selected?.leaseId]);

  const handleClickEdit = useCallback(
    (doc) => {
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
    },
    [setEditTextDocument]
  );

  const handleClickUpload = useCallback(() => {
    setEditUploadDocument(true);
  }, [setEditUploadDocument]);

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
      store.document,
      store.tenant.selected?._id,
      store.tenant.selected?.leaseId,
      t,
      setEditTextDocument,
    ]
  );

  const handleLoadTextDocument = useCallback(async () => {
    if (!editTextDocument?._id) {
      store.pushToastMessage({
        message: t('Something went wrong'),
        severity: 'error',
      });
      return '';
    }
    return editTextDocument.contents;
  }, [editTextDocument?._id, editTextDocument.contents, store, t]);

  const handleSaveTextDocument = useCallback(
    async (title, contents, html) => {
      const { status } = await store.document.update({
        ...editTextDocument,
        name: title,
        contents,
        html,
      });
      if (status !== 200) {
        return store.pushToastMessage({
          message: t('Something went wrong'),
          severity: 'error',
        });
      }
    },
    [editTextDocument, store, t]
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
      <Box display="flex" mb={1}>
        {!isMobile ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleClickUpload}
            disabled={disabled}
            data-cy="addTenantFile"
          >
            {t('Upload document')}
          </Button>
        ) : (
          <MobileButton
            label={t('Upload document')}
            Icon={AddIcon}
            onClick={handleClickUpload}
            disabled={disabled}
          />
        )}
        <Box ml={1}>
          <FullScreenDialogMenu
            variant="contained"
            Icon={AddIcon}
            buttonLabel={t('Create document')}
            dialogTitle={t('Create a document')}
            menuItems={menuItems}
            onClick={handleClickAddText}
            disabled={disabled}
            data-cy="addTenantTextDocument"
          />
        </Box>
      </Box>
      <DocumentItems
        onEdit={handleClickEdit}
        onDelete={setDocumentToRemove}
        disabled={disabled}
      />
      <RichTextEditorDialog
        onLoad={handleLoadTextDocument}
        onSave={handleSaveTextDocument}
        title={editTextDocument.name}
        editable={!disabled}
      />

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

export default TenantDocumentList;
