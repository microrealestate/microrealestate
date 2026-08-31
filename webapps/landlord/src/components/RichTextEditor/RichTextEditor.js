import Placeholder from '@tiptap/extension-placeholder';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import jsesc from 'jsesc';
import { toJS } from 'mobx';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import useTimeout from '../../hooks/useTimeout';
import EditorMenu from './EditorMenu';
import { handlePageBreaks } from './helpers';
import TemplateNode from './TemplateNode';

const SAVE_DELAY = 250;
const CLEAR_SAVE_LABEL_DELAY = 2500;

const RichTextEditor = ({
  onLoad,
  onSave,
  onClose,
  title: initialTitle,
  fields = [],
  showPrintButton,
  placeholder = '',
  editable = true
}) => {
  const t = useTranslations('common');
  const [title, setTitle] = useState(initialTitle || t('Untitled document'));
  const [saving, setSaving] = useState();
  const editor = useEditor({
    editable,
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Superscript,
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableHeader,
      TableCell,
      TemplateNode.configure({
        HTMLAttributes: {
          class: 'template'
        }
      })
    ],
    onUpdate({ editor }) {
      setSaving(true);
      triggerSaveContents.start();
      handlePageBreaks(editor);
    }
  });

  useEffect(() => {
    (async () => {
      if (!editor) {
        return;
      }
      const data = await onLoad();
      if (data) {
        editor.commands.setContent(toJS(data));
      }
      handlePageBreaks(editor);
    })();
  }, [editor, onLoad]);

  const triggerClearSaveState = useTimeout(() => {
    setSaving();
  }, CLEAR_SAVE_LABEL_DELAY);

  const triggerSaveContents = useTimeout(async () => {
    if (editor) {
      try {
        await onSave(title, editor.getJSON(), jsesc(editor.getHTML()));
        triggerClearSaveState.start();
      } catch (error) {
        console.error(error);
      } finally {
        setSaving(false);
      }
    }
  }, SAVE_DELAY);

  const onTitleChange = useCallback(
    (value) => {
      setSaving(true);
      setTitle(value);
      triggerSaveContents.start();
    },
    [triggerSaveContents]
  );

  return (
    <>
      {editor ? (
        <>
          <EditorMenu
            editor={editor}
            title={title}
            fields={fields}
            showPrintButton={showPrintButton}
            saving={saving}
            onChange={onTitleChange}
            onClose={onClose}
            editable={editable}
          />
          <div className="overflow-y-auto pb-2">
            <div className="w-[794px] my-4 mx-auto relative">
              <EditorContent editor={editor} />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};

export default RichTextEditor;
