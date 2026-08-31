import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@microrealestate/commonui/components/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle
} from '@microrealestate/commonui/components/ui/drawer';
import { Observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { LuCirclePlus } from 'react-icons/lu';
import { toast } from 'sonner';
import { useStore } from '@/providers/StoreProvider';
import ConfirmDialog from '../ConfirmDialog';
import DocumentList from '../DocumentList';
import {
  BlankDocumentIllustration,
  TermsDocumentIllustration
} from '../Illustrations';
import Loading from '../Loading';
import RichTextEditorDialog from '../RichTextEditor/RichTextEditorDialog';

function DocumentItems({ onView, onEdit, onDelete, disabled, className }) {
  const store = useStore();
  return (
    <Observer>
      {() => {
        const documents = store.document.items.filter(
          ({ relatesTo, type }) =>
            relatesTo.tenants.includes(store.tenant.selected?._id) &&
            type === 'text'
        );

        return (
          <DocumentList
            documents={documents}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            disabled={disabled}
            className={className}
          />
        );
      }}
    </Observer>
  );
}

export default function TenantDocumentList({ disabled = false }) {
  const store = useStore();
  const t = useTranslations('common');
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
      ({ type, relatesTo = [] }) =>
        type === 'text' && relatesTo.includes(store.tenant.selected?.leaseId)
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

  const handleClickEdit = (doc) => {
    setSelectedTextDocument(doc);
    setOpenTextDocumentDialog(true);
  };

  const handleClickAddText = async (template) => {
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
  };

  const handleLoadTextDocument = useCallback(async () => {
    if (!selectedTextDocument?._id) {
      toast.error(t('Something went wrong'));
      return '';
    }
    return selectedTextDocument.contents;
  }, [t, selectedTextDocument]);

  const handleSaveTextDocument = async (title, contents, html) => {
    const { status } = await store.document.update({
      ...selectedTextDocument,
      name: title,
      contents,
      html
    });
    if (status !== 200) {
      toast.error(t('Something went wrong'));
    }
  };

  const handleDeleteDocument = async () => {
    if (!selectedDocumentToRemove) {
      return;
    }
    const { status } = await store.document.delete([
      selectedDocumentToRemove._id
    ]);
    if (status !== 200) {
      return toast.error(t('Something went wrong'));
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mt-8">
        <Button
          variant="outline"
          onClick={() => setOpenDocumentCreatorDialog(true)}
          disabled={disabled}
          className="text-xs font-normal gap-2 h-fit w-fit px-2 py-1.5 rounded-full"
          data-cy="addTenantTextDocument"
        >
          <LuCirclePlus className="size-4 text-primary" />
          {t('Create a document')}
        </Button>

        <DocumentItems
          onEdit={handleClickEdit}
          onDelete={(docToRemove) => {
            setSelectedDocumentToRemove(docToRemove);
            setOpenDocumentToRemoveDialog(true);
          }}
          disabled={disabled}
          className="flex flex-wrap items-center gap-2"
        />
      </div>

      <Drawer
        open={openDocumentCreatorDialog}
        onOpenChange={creatingDocument ? setOpenDocumentCreatorDialog : null}
        dismissible={!creatingDocument}
      >
        <DrawerContent
          className="w-full h-full p-4"
          hideHandle={creatingDocument}
        >
          <DrawerHeader className="flex flex-row items-center justify-between p-0">
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
