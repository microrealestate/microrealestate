import {
  BlankDocumentIllustration,
  TermsDocumentIllustration
} from '../Illustrations';
import { useCallback, useContext, useMemo, useState } from 'react';
import AddIcon from '@material-ui/icons/Add';
import { Box } from '@material-ui/core';
import ConfirmDialog from '../ConfirmDialog';
import DocumentList from '../DocumentList';
import FullScreenDialogMenu from '../FullScreenDialogMenu';
import { Observer } from 'mobx-react-lite';
import RichTextEditorDialog from '../RichTextEditor/RichTextEditorDialog';
import { StoreContext } from '../../store';
import { toast } from 'sonner';
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
  const [openDocumentToRemoveDialog, setOpenDocumentToRemoveDialog] =
    useState(false);
  const [selectedDocumentToRemove, setSelectedDocumentToRemove] =
    useState(null);
  const [openTextDocumentDialog, setOpenTextDocumentDialog] = useState(false);
  const [selectedTextDocument, setSelectedTextDocument] = useState(null);

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
        value: {}
      },
      ...templates.map((template) => ({
        key: template._id,
        label: template.name,
        illustration: <TermsDocumentIllustration />,
        value: template
      }))
    ];
  }, [t, store.template?.items, store.tenant?.selected?.leaseId]);

  const handleClickEdit = useCallback(
    (doc) => {
      setSelectedTextDocument(doc);
      setOpenTextDocumentDialog(true);
    },
    [setOpenTextDocumentDialog, setSelectedTextDocument]
  );

  const handleClickAddText = useCallback(
    async (template) => {
      const { status, data } = await store.document.create({
        name: template.name || t('Untitled document'),
        type: 'text',
        templateId: template._id,
        tenantId: store.tenant.selected?._id,
        leaseId: store.tenant.selected?.leaseId
      });
      if (status !== 200) {
        return console.error(status);
      }
      setSelectedTextDocument(data);
      setOpenTextDocumentDialog(true);
    },
    [
      store.document,
      store.tenant.selected?._id,
      store.tenant.selected?.leaseId,
      t,
      setSelectedTextDocument,
      setOpenTextDocumentDialog
    ]
  );

  const handleLoadTextDocument = useCallback(async () => {
    if (!selectedTextDocument?._id) {
      toast.error(t('Something went wrong'));
      return '';
    }
    return selectedTextDocument.contents;
  }, [selectedTextDocument?._id, selectedTextDocument?.contents, t]);

  const handleSaveTextDocument = useCallback(
    async (title, contents, html) => {
      const { status } = await store.document.update({
        ...selectedTextDocument,
        name: title,
        contents,
        html
      });
      if (status !== 200) {
        toast.error(t('Something went wrong'));
      }
    },
    [selectedTextDocument, store, t]
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
  }, [selectedDocumentToRemove, store.document, t]);

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
        onDelete={(docToRemove) => {
          setSelectedDocumentToRemove(docToRemove);
          setOpenDocumentToRemoveDialog(true);
        }}
        disabled={disabled}
      />

      <RichTextEditorDialog
        open={openTextDocumentDialog}
        setOpen={setOpenTextDocumentDialog}
        onLoad={handleLoadTextDocument}
        onSave={handleSaveTextDocument}
        title={selectedTextDocument?.name}
        editable={!disabled}
      />

      <ConfirmDialog
        title={t('Are you sure to remove this document?')}
        subTitle={selectedDocumentToRemove?.name}
        open={openDocumentToRemoveDialog}
        setOpen={setOpenDocumentToRemoveDialog}
        data={selectedDocumentToRemove}
        onConfirm={handleDeleteDocument}
      />
    </>
  );
}

export default TenantDocumentList;
