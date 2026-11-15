import Superscript from '@tiptap/extension-superscript';
import {
  Table,
  TableCell,
  TableHeader,
  TableRow
} from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import { Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import jsesc from 'jsesc';
import { toJS } from 'mobx';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import useTimeout from '../../hooks/useTimeout';
import EditorMenu from './EditorMenu';
import PageBreak from './extensions/PageBreak';
import PageSetup, {
  getPageGeometry,
  normalizePageSetup
} from './extensions/PageSetup';
import Pagination from './extensions/Pagination';
import FieldMenu, {
  chipLabel,
  FieldMenuDrawer,
  FieldMenuStrip
} from './FieldMenu';
import TemplateNode from './TemplateNode';
import useFitScale from './useFitScale';

const SAVE_DELAY = 250;
const CLEAR_SAVE_LABEL_DELAY = 2500;
const DEFAULT_GEOMETRY = getPageGeometry(normalizePageSetup(null));

const RichTextEditor = ({
  onLoad,
  onSave,
  onClose,
  title: initialTitle,
  fields = [],
  showPrintButton,
  placeholder = '',
  editable = true,
  readOnlyReason
}) => {
  const t = useTranslations('common');
  const [title, setTitle] = useState(initialTitle || t('Untitled document'));
  const [saving, setSaving] = useState();
  const isWide = useMediaQuery('(min-width: 768px)');
  const [showFieldMenu, setShowFieldMenu] = useState(false);
  const [openFieldGroups, setOpenFieldGroups] = useState(null);
  const zoomState = useFitScale(isWide ? 16 : 8);
  const labelByMarker = useRef(new Map());
  labelByMarker.current = new Map(
    fields.map((field) => [field.marker, chipLabel(t, field)])
  );
  const editor = useEditor({
    editable,
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Superscript,
      TextStyle,
      FontSize,
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableHeader,
      TableCell,
      PageSetup,
      PageBreak,
      Pagination,
      TemplateNode.configure({
        HTMLAttributes: {
          class: 'template'
        },
        renderLabel: ({ node }) =>
          labelByMarker.current.get(node.attrs.id) ?? node.attrs.label
      })
    ],
    onUpdate() {
      setSaving(true);
      triggerSaveContents.start();
    }
  });

  const pageSetup = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor ? normalizePageSetup(editor.state.doc.attrs) : null
  });

  useEffect(() => {
    (async () => {
      if (!editor) {
        return;
      }
      const contents = toJS(await onLoad());
      if (contents) {
        editor
          .chain()
          .setContent(contents, { emitUpdate: false })
          // `setContent` replaces the content of the doc node, not the node
          // itself, so the stored page setup has to be reapplied explicitly.
          .setPageSetup(normalizePageSetup(contents.attrs))
          .setMeta('addToHistory', false)
          .run();
      }
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

  const onToggleFieldMenu = useCallback(() => {
    setShowFieldMenu((shown) => !shown);
  }, []);

  const onTitleChange = useCallback(
    (value) => {
      setSaving(true);
      setTitle(value);
      triggerSaveContents.start();
    },
    [triggerSaveContents]
  );

  if (!editor) {
    return null;
  }

  const geometry = pageSetup ? getPageGeometry(pageSetup) : DEFAULT_GEOMETRY;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <EditorMenu
        editor={editor}
        title={title}
        showPrintButton={showPrintButton}
        saving={saving}
        onChange={onTitleChange}
        onClose={onClose}
        editable={editable}
        readOnlyReason={readOnlyReason}
      />
      <div className="relative flex min-h-0 flex-1">
        {editable && fields.length > 0 && !isWide ? (
          <>
            <FieldMenuStrip onOpen={onToggleFieldMenu} />
            <FieldMenuDrawer
              open={showFieldMenu}
              setOpen={setShowFieldMenu}
              editor={editor}
              fields={fields}
              openGroups={openFieldGroups}
              onOpenGroupsChange={setOpenFieldGroups}
            />
          </>
        ) : null}
        {editable && fields.length > 0 && isWide ? (
          showFieldMenu ? (
            <FieldMenu
              editor={editor}
              fields={fields}
              openGroups={openFieldGroups}
              onOpenGroupsChange={setOpenFieldGroups}
              onClose={onToggleFieldMenu}
            />
          ) : (
            <FieldMenuStrip onOpen={onToggleFieldMenu} />
          )
        ) : null}
        <div ref={zoomState.scrollerRef} className="flex-1 overflow-auto pb-2">
          <div className="mx-auto w-max px-2 md:px-4">
            <div
              className="my-4"
              style={
                zoomState.frameSize && zoomState.scale !== 1
                  ? {
                      width: zoomState.frameSize.width * zoomState.scale,
                      height: zoomState.frameSize.height * zoomState.scale
                    }
                  : undefined
              }
            >
              <div
                ref={zoomState.frameRef}
                className="page-frame relative"
                style={{
                  '--page-width': `${geometry.widthMm}mm`,
                  '--page-height': `${geometry.heightMm}mm`,
                  '--page-margin-top': `${geometry.margins.top}mm`,
                  '--page-margin-right': `${geometry.margins.right}mm`,
                  '--page-margin-bottom': `${geometry.margins.bottom}mm`,
                  '--page-margin-left': `${geometry.margins.left}mm`,
                  ...(zoomState.scale !== 1
                    ? {
                        transform: `scale(${zoomState.scale})`,
                        transformOrigin: '0 0'
                      }
                    : {})
                }}
              >
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
