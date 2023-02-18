import {
  BlankDocumentIllustration,
  TermsDocumentIllustration,
} from '../Illustrations';
import { useCallback, useContext, useMemo } from 'react';

import AddIcon from '@material-ui/icons/Add';
import { Box } from '@material-ui/core';
import DocumentList from '../DocumentList';
import FullScreenDialogMenu from '../FullScreenDialogMenu';
import { Observer } from 'mobx-react-lite';
import { StoreContext } from '../../store';
import useConfirmDialog from '../ConfirmDialog';
import useRichTextEditorDialog from '../RichTextEditor/RichTextEditorDialog';
import useTranslation from 'next-translate/useTranslation';

function DocumentItems({ onView, onEdit, onDelete, disabled }) {
  const store = useContext(StoreContext);
  return (
    <Observer>
      {() => {
        const documents = store.document.items.filter(
          ({ tenantId, type }) =>
            store.tenant.selected?._id === tenantId && type === 'text'
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

  const [ConfirmDialog, setDocumentToRemove, documentToRemove] =
    useConfirmDialog();

  const [RichTextEditorDialog, setEditTextDocument, editTextDocument] =
    useRichTextEditorDialog();

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
      setEditTextDocument(doc);
    },
    [setEditTextDocument]
  );

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
      <Box mb={1}>
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

      <ConfirmDialog
        title={t('Are you sure to remove this document?')}
        subTitle={documentToRemove.name}
        onConfirm={handleDeleteDocument}
      />
    </>
  );
}

export default TenantDocumentList;
