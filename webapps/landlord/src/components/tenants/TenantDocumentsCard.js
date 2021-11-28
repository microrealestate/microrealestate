import {
  BlankDocumentIllustration,
  EmptyIllustration,
  TermsDocumentIllustration,
} from '../Illustrations';
import {
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from '@material-ui/core';
import { useCallback, useContext, useState } from 'react';

import AddIcon from '@material-ui/icons/Add';
import ConfirmDialog from '../ConfirmDialog';
import { DashboardCard } from '../Cards';
import DeleteIcon from '@material-ui/icons/Delete';
import DescriptionIcon from '@material-ui/icons/DescriptionOutlined';
import FullScreenDialogMenu from '../FullScreenDialogMenu';
import RichTextEditorDialog from '../RichTextEditor/RichTextEditorDialog';
import { StoreContext } from '../../store';
import { nanoid } from 'nanoid';
import { observer } from 'mobx-react-lite';
import useTranslation from 'next-translate/useTranslation';

const DocumentList = observer(({ onEdit, onDelete }) => {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');

  // TODO: optimize to not recompute the document list on each rendered
  const documents = store.document.items.filter(
    ({ tenantId }) => store.tenant.selected?._id === tenantId
  );

  return documents.length > 0 ? (
    <List dense>
      {documents.map((document) => (
        <ListItem key={nanoid()} button onClick={() => onEdit(document)}>
          <ListItemText id={document._id} primary={document.name} />
          <ListItemSecondaryAction>
            <IconButton
              edge="end"
              aria-label="comments"
              onClick={() => onDelete(document)}
            >
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  ) : (
    <EmptyIllustration label={t('No documents found')} />
  );
});

const TenantDocumentsCard = () => {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const [editDocument, setEditDocument] = useState(false);
  const [documentToRemove, setDocumentToRemove] = useState(false);

  const onLoadDocument = useCallback(async () => {
    if (!editDocument || !editDocument._id) {
      //TODO: handle this error. It should not fall in this case.
      // document id should always be provided
      return '';
    }
    store.document.setSelected(
      store.document.items.find(({ _id }) => _id === editDocument._id)
    );
    return store.document.selected.contents;
  }, [store.document, editDocument]);

  const onCreateDocument = useCallback(
    async (template) => {
      //setError('');
      const { status, data } = await store.document.create({
        name: template.name || t('Untitled document'),
        templateId: template._id,
        tenantId: store.tenant.selected?._id,
        leaseId: store.tenant.selected?.leaseId,
      });
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
      setEditDocument(data);
    },
    [store.document, store.tenant.selected]
  );

  const onSaveDocument = useCallback(
    async (title, contents, html) => {
      //setError('');
      const { status } = await store.document.update({
        ...editDocument,
        name: title,
        contents,
        html,
      });
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
    },
    [store.document, editDocument]
  );

  const onDeleteDocument = useCallback(async () => {
    if (!documentToRemove) {
      return;
    }
    await store.document.delete([documentToRemove._id]);
  }, [documentToRemove, store.document]);

  // TODO: optimize to not recompute the template list on each rendered
  const templates = store.template.items.filter(({ linkedResourceIds = [] }) =>
    linkedResourceIds.includes(store.tenant.selected?.leaseId)
  );

  return (
    <DashboardCard
      Icon={DescriptionIcon}
      title={t('Documents')}
      Toolbar={
        <FullScreenDialogMenu
          variant="contained"
          buttonLabel={t('Add')}
          dialogTitle={t('Create a document')}
          size="small"
          startIcon={<AddIcon />}
          menuItems={[
            {
              category: '',
              label: t('New blank document'),
              illustration: <BlankDocumentIllustration />,
              value: {},
            },
            ...templates.map((template) => ({
              category: t('Templates'),
              label: template.name,
              illustration: <TermsDocumentIllustration />,
              value: template,
            })),
          ]}
          onClick={onCreateDocument}
        />
      }
    >
      <DocumentList
        onEdit={(document) => setEditDocument(document)}
        onDelete={(document) => setDocumentToRemove(document)}
      />
      <RichTextEditorDialog
        open={editDocument}
        setOpen={setEditDocument}
        onLoad={onLoadDocument}
        onSave={onSaveDocument}
        title={editDocument.name}
        fields={store.document.fields}
      />
      <ConfirmDialog
        title={t('Are you sure to remove this document?')}
        subTitle={documentToRemove.name}
        open={documentToRemove}
        setOpen={setDocumentToRemove}
        onConfirm={onDeleteDocument}
      />
    </DashboardCard>
  );
};

export default TenantDocumentsCard;
