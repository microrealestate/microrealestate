import { Box, Button } from '@material-ui/core';
import { useCallback, useContext } from 'react';

import AddIcon from '@material-ui/icons/Add';
import DocumentList from '../../DocumentList';
import { Observer } from 'mobx-react-lite';
import { StoreContext } from '../../../store';
import useConfirmDialog from '../../ConfirmDialog';
import useFileDescriptorDialog from './FileDescriptorDialog';
import useRichTextEditorDialog from '../../RichTextEditor/RichTextEditorDialog';
import useTranslation from 'next-translate/useTranslation';

function TemplateItems({ onEdit, onDelete }) {
  const store = useContext(StoreContext);
  return (
    <Observer>
      {() => {
        const templates = store.template.items.filter(
          ({ linkedResourceIds = [] }) =>
            linkedResourceIds.includes(store.lease.selected?._id)
        );

        return (
          <DocumentList
            documents={templates}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      }}
    </Observer>
  );
}

function TemplateList() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [ConfirmDialog, setTemplateToRemove, templateToRemove] =
    useConfirmDialog();
  const [RichTextEditorDialog, setEditTemplate, editTemplate] =
    useRichTextEditorDialog();
  const [FileDescriptorDialog, setEditFileDescriptor, editFileDescriptor] =
    useFileDescriptorDialog();

  const onLoadTemplate = useCallback(async () => {
    if (!editTemplate || !editTemplate._id) {
      return '';
    }
    store.template.setSelected(
      store.template.items.find(({ _id }) => _id === editTemplate._id)
    );
    return store.template.selected.contents;
  }, [store.template, editTemplate]);

  const onSaveTemplate = useCallback(
    async (template) => {
      //setError('');
      if (!template._id) {
        const { status, data } = await store.template.create(template);
        if (status !== 200) {
          // switch (status) {
          //   case 422:
          //     return setError(
          //       t('')
          //     );
          //   case 404:
          //     return setError(t('Template does not exist'));
          //   case 403:
          //     return setError(t(''));
          //   default:
          //     return setError(t('Something went wrong'));
          // }
          return console.error(status);
        }
        if (data.type === 'text') {
          editTemplate._id = data._id;
        } else if (data.type === 'fileDescriptor') {
          editFileDescriptor._id = data._id;
        }
      } else {
        const { status } = await store.template.update(template);
        if (status !== 200) {
          // switch (status) {
          //   case 422:
          //     return setError(
          //       t('')
          //     );
          //   case 404:
          //     return setError(t('Template does not exist'));
          //   case 403:
          //     return setError(t(''));
          //   default:
          //     return setError(t('Something went wrong'));
          // }
          return console.error(status);
        }
      }
    },
    [editFileDescriptor, editTemplate, store.template]
  );

  const onSaveTextTemplate = useCallback(
    async (title, contents, html) => {
      await onSaveTemplate({
        _id: editTemplate?._id,
        name: title,
        type: 'text',
        contents,
        html,
        linkedResourceIds: store.lease.selected?._id
          ? [store.lease.selected._id]
          : [],
      });
    },
    [editTemplate?._id, onSaveTemplate, store.lease.selected._id]
  );

  const onSaveUploadTemplate = useCallback(
    async (template) => {
      await onSaveTemplate({
        ...template,
        _id: editFileDescriptor?._id,
        type: 'fileDescriptor',
        linkedResourceIds: store.lease.selected?._id
          ? [store.lease.selected._id]
          : [],
      });
    },
    [editFileDescriptor?._id, onSaveTemplate, store.lease.selected._id]
  );

  const onDeleteTemplate = useCallback(async () => {
    if (!templateToRemove) {
      return;
    }

    if (templateToRemove.linkedResourceIds?.length <= 1) {
      await store.template.delete([templateToRemove._id]);
    } else {
      await store.template.update({
        ...templateToRemove,
        linkedResourceIds: store.lease.selected?._id
          ? [
              ...editTemplate.linkedResourceIds.filter(
                (_id) => store.lease.selected._id !== _id
              ),
            ]
          : templateToRemove.linkedResourceIds,
      });
    }
  }, [
    templateToRemove,
    store.lease.selected,
    store.template,
    editTemplate.linkedResourceIds,
  ]);

  const handleClickEdit = useCallback(
    (template) => {
      if (template.type === 'text') {
        setEditTemplate(template);
      } else if (template.type === 'fileDescriptor') {
        setEditFileDescriptor(template);
      }
    },
    [setEditFileDescriptor, setEditTemplate]
  );

  const handleClickAddFileDescriptor = useCallback(() => {
    setEditFileDescriptor({});
  }, [setEditFileDescriptor]);

  const handleClickAddText = useCallback(() => {
    setEditTemplate({});
  }, [setEditTemplate]);

  return (
    <>
      <Box display="flex" mb={1}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleClickAddFileDescriptor}
          data-cy="addFileDescriptor"
        >
          {t('Upload template')}
        </Button>
        <Box ml={1}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleClickAddText}
            data-cy="addTextDocument"
          >
            {t('Text template')}
          </Button>
        </Box>
      </Box>

      <TemplateItems onEdit={handleClickEdit} onDelete={setTemplateToRemove} />

      <RichTextEditorDialog
        onLoad={onLoadTemplate}
        onSave={onSaveTextTemplate}
        title={editTemplate.name}
        fields={store.template.fields}
      />
      <FileDescriptorDialog onSave={onSaveUploadTemplate} />
      <ConfirmDialog
        title={t('Are you sure to remove this template document?')}
        subTitle={templateToRemove.name}
        onConfirm={onDeleteTemplate}
      />
    </>
  );
}

export default TemplateList;
