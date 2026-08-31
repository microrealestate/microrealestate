import { Button } from '@microrealestate/commonui/components/ui/button';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { LuCirclePlus } from 'react-icons/lu';
import { useStore } from '@/providers/StoreProvider';
import ConfirmDialog from '../../ConfirmDialog';
import DocumentList from '../../DocumentList';
import RichTextEditorDialog from '../../RichTextEditor/RichTextEditorDialog';
import FileDescriptorDialog from './FileDescriptorDialog';

const TemplateItems = observer(function TemplateItems({ onEdit, onDelete }) {
  const store = useStore();

  const templates = store.template.items.filter(({ relatesTo = [] }) =>
    relatesTo.includes(store.lease.selected?._id)
  );

  return (
    <DocumentList documents={templates} onEdit={onEdit} onDelete={onDelete} />
  );
});

function TemplateList() {
  const t = useTranslations('common');
  const store = useStore();
  const [openConfirmRemoveTemplate, setOpenConfirmRemoveTemplate] =
    useState(false);
  const [selectedTemplateToRemove, setSelectedTemplateToRemove] =
    useState(null);
  const [openTemplate, setOpenTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [openFileDescriptor, setOpenFileDescriptor] = useState(false);
  const [selectedFileDescriptor, setSelectedFileDescriptor] = useState(null);

  const handleLoadTemplate = useCallback(async () => {
    if (!selectedTemplate?._id) {
      return '';
    }
    store.template.setSelected(
      store.template.items.find(({ _id }) => _id === selectedTemplate._id)
    );
    return store.template.selected.contents;
  }, [selectedTemplate?._id, store.template]);

  const onSaveTemplate = useCallback(
    async (template) => {
      if (!template?._id) {
        const { status, data } = await store.template.create(template);
        if (status !== 200) {
          return console.error(status);
        }
        if (data.type === 'text') {
          selectedTemplate._id = data._id;
        } else if (data.type === 'fileDescriptor') {
          selectedFileDescriptor._id = data._id;
        }
      } else {
        const { status } = await store.template.update(template);
        if (status !== 200) {
          return console.error(status);
        }
      }
    },
    [selectedFileDescriptor, selectedTemplate, store.template]
  );

  const handleSaveTextTemplate = useCallback(
    async (title, contents, html) => {
      await onSaveTemplate({
        _id: selectedTemplate?._id,
        name: title,
        type: 'text',
        contents,
        html,
        relatesTo: store.lease.selected?._id ? [store.lease.selected._id] : []
      });
    },
    [onSaveTemplate, selectedTemplate?._id, store.lease.selected._id]
  );

  const handleSaveFileDescriptor = useCallback(
    async (template) => {
      await onSaveTemplate({
        ...template,
        _id: selectedFileDescriptor?._id,
        type: 'fileDescriptor',
        relatesTo: store.lease.selected?._id ? [store.lease.selected._id] : []
      });
    },
    [onSaveTemplate, selectedFileDescriptor?._id, store.lease.selected._id]
  );

  const handleDeleteTemplate = (template) => {
    setSelectedTemplateToRemove(template);
    setOpenConfirmRemoveTemplate(true);
  };

  const handleConfirmDeleteTemplate = useCallback(async () => {
    if (!selectedTemplateToRemove) {
      return;
    }

    if (selectedTemplateToRemove.relatesTo?.length <= 1) {
      await store.template.delete([selectedTemplateToRemove._id]);
    } else {
      await store.template.update({
        ...selectedTemplateToRemove,
        relatesTo: store.lease.selected?._id
          ? [
              ...selectedTemplate.relatesTo.filter(
                (_id) => store.lease.selected._id !== _id
              )
            ]
          : selectedTemplateToRemove.relatesTo
      });
    }
  }, [
    selectedTemplateToRemove,
    store.template,
    store.lease.selected._id,
    selectedTemplate?.relatesTo
  ]);

  const handleClickEdit = (template) => {
    if (template.type === 'text') {
      setSelectedTemplate(template);
      setOpenTemplate(true);
    } else if (template.type === 'fileDescriptor') {
      setSelectedFileDescriptor(template);
      setOpenFileDescriptor(template);
    }
  };

  const handleClickAddFileDescriptor = () => {
    setSelectedFileDescriptor({});
    setOpenFileDescriptor(true);
  };

  const handleClickAddText = () => {
    setSelectedTemplate({});
    setOpenTemplate(true);
  };

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-4">
        <Button
          variant="secondary"
          onClick={handleClickAddFileDescriptor}
          data-cy="addFileDescriptor"
          className="w-full justify-start sm:justify-normal sm:w-fit gap-2"
        >
          <LuCirclePlus className="size-4" />
          {t('Upload template')}
        </Button>
        <Button
          variant="secondary"
          onClick={handleClickAddText}
          data-cy="addTextDocument"
          className="w-full justify-start sm:justify-normal sm:w-fit gap-2"
        >
          <LuCirclePlus className="size-4" />
          {t('Text template')}
        </Button>
      </div>
      <TemplateItems onEdit={handleClickEdit} onDelete={handleDeleteTemplate} />
      <RichTextEditorDialog
        open={openTemplate}
        setOpen={setOpenTemplate}
        onLoad={handleLoadTemplate}
        onSave={handleSaveTextTemplate}
        title={selectedTemplate?.name}
        fields={store.template.fields}
      />
      <FileDescriptorDialog
        open={openFileDescriptor}
        setOpen={setOpenFileDescriptor}
        data={selectedFileDescriptor}
        onSave={handleSaveFileDescriptor}
      />
      <ConfirmDialog
        title={t('Are you sure to remove this template document?')}
        subTitle={selectedTemplateToRemove?.name}
        open={openConfirmRemoveTemplate}
        setOpen={setOpenConfirmRemoveTemplate}
        data={selectedTemplateToRemove}
        onConfirm={handleConfirmDeleteTemplate}
      />
    </>
  );
}

export default TemplateList;
