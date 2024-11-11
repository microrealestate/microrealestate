import {
  BlankDocumentIllustration,
  TermsDocumentIllustration
} from '../Illustrations';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../ui/drawer';
import { useCallback, useContext, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import ConfirmDialog from '../ConfirmDialog';
import DocumentList from '../DocumentList';
import Loading from '../Loading';
import { LuPlusCircle } from 'react-icons/lu';
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
  const [creatingDocument, setCreatingDocument] = useState(false);
  const [openDocumentCreatorDialog, setOpenDocumentCreatorDialog] =
    useState(false);
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
      let response;
      try {
        setCreatingDocument(true);
        response = await store.document.create({
          name: template.name || t('Untitled document'),
          type: 'text',
          templateId: template._id,
          tenantId: store.tenant.selected?._id,
          leaseId: store.tenant.selected?.leaseId
        });
        if (response.status !== 200) {
          return console.error(response.status);
        }
      } finally {
        setCreatingDocument(false);
      }
      if (response?.data) {
        setSelectedTextDocument(response.data);
        setOpenDocumentCreatorDialog(false);
        setOpenTextDocumentDialog(true);
      }
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
      <Button
        variant="secondary"
        onClick={() => setOpenDocumentCreatorDialog(true)}
        disabled={disabled}
        className="mb-2 gap-2"
        data-cy="addTenantTextDocument"
      >
        <LuPlusCircle className="size-4" />
        {t('Create a document')}
      </Button>
      <Drawer
        open={openDocumentCreatorDialog}
        onOpenChange={setOpenDocumentCreatorDialog}
        dismissible={!creatingDocument}
      >
        <DrawerContent className="w-full h-full p-4">
          <DrawerHeader className="flex items-center justify-between p-0">
            <DrawerTitle>{t('Create a document')}</DrawerTitle>
            <Button
              variant="secondary"
              onClick={() => setOpenDocumentCreatorDialog(false)}
            >
              {t('Close')}
            </Button>
          </DrawerHeader>
          <div className="flex flex-wrap mx-auto lg:mx-0 gap-4 mt-10">
            {menuItems.map((item) => (
              <Card
                key={item.key}
                onClick={() => handleClickAddText(item.value)}
                className="w-96 cursor-pointer"
                data-cy={`template-${item.label.replace(/\s/g, '')}`}
              >
                <CardHeader>
                  <CardTitle className="h-12">
                    <Button variant="link" className="text-xl">
                      {item.label}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>{item.illustration}</CardContent>
              </Card>
            ))}
          </div>
          {creatingDocument ? (
            <Loading
              fullScreen={false}
              className="absolute top-0 left-0 right-0 bottom-0 bg-secondary/50"
            />
          ) : null}
        </DrawerContent>
      </Drawer>

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
