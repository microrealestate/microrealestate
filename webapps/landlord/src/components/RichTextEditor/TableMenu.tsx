import { type Editor, useEditorState } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import {
  RiDeleteBin2Line,
  RiDeleteColumn,
  RiDeleteRow,
  RiInsertColumnLeft,
  RiInsertColumnRight,
  RiInsertRowBottom,
  RiInsertRowTop,
  RiMergeCellsHorizontal,
  RiSplitCellsHorizontal,
  RiTable2
} from 'react-icons/ri';
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator
} from './toolbar/ToolbarPrimitives';

export default function TableMenu({ editor }: { editor: Editor }) {
  const t = useTranslations('common');
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return null;
      }
      const editable = editor.isEditable;
      return {
        inTable: editor.isActive('table'),
        canDeleteTable: editable && editor.can().deleteTable(),
        canAddColumnBefore: editable && editor.can().addColumnBefore(),
        canAddColumnAfter: editable && editor.can().addColumnAfter(),
        canDeleteColumn: editable && editor.can().deleteColumn(),
        canAddRowBefore: editable && editor.can().addRowBefore(),
        canAddRowAfter: editable && editor.can().addRowAfter(),
        canDeleteRow: editable && editor.can().deleteRow(),
        canMergeCells: editable && editor.can().mergeCells(),
        canSplitCell: editable && editor.can().splitCell()
      };
    }
  });

  if (!state?.inTable) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-y-1 rounded-md bg-muted/50 px-2 py-1">
      <span className="mr-1 flex items-center gap-1 text-xs text-muted-foreground">
        <RiTable2 className="size-4" />
        <span className="hidden sm:inline">{t('Table tools')}</span>
      </span>
      <ToolbarSeparator />

      <ToolbarGroup>
        <ToolbarButton
          label={t('Insert column before')}
          disabled={!state.canAddColumnBefore}
          onClick={() => editor.chain().focus().addColumnBefore().run()}
        >
          <RiInsertColumnLeft />
        </ToolbarButton>
        <ToolbarButton
          label={t('Insert column after')}
          disabled={!state.canAddColumnAfter}
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
          <RiInsertColumnRight />
        </ToolbarButton>
        <ToolbarButton
          label={t('Delete column')}
          disabled={!state.canDeleteColumn}
          onClick={() => editor.chain().focus().deleteColumn().run()}
        >
          <RiDeleteColumn />
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />

      <ToolbarGroup>
        <ToolbarButton
          label={t('Insert row before')}
          disabled={!state.canAddRowBefore}
          onClick={() => editor.chain().focus().addRowBefore().run()}
        >
          <RiInsertRowTop />
        </ToolbarButton>
        <ToolbarButton
          label={t('Insert row after')}
          disabled={!state.canAddRowAfter}
          onClick={() => editor.chain().focus().addRowAfter().run()}
        >
          <RiInsertRowBottom />
        </ToolbarButton>
        <ToolbarButton
          label={t('Delete row')}
          disabled={!state.canDeleteRow}
          onClick={() => editor.chain().focus().deleteRow().run()}
        >
          <RiDeleteRow />
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />

      <ToolbarGroup>
        <ToolbarButton
          label={t('Merge cells')}
          disabled={!state.canMergeCells}
          onClick={() => editor.chain().focus().mergeCells().run()}
        >
          <RiMergeCellsHorizontal />
        </ToolbarButton>
        <ToolbarButton
          label={t('Split cell')}
          disabled={!state.canSplitCell}
          onClick={() => editor.chain().focus().splitCell().run()}
        >
          <RiSplitCellsHorizontal />
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarSeparator />

      <ToolbarButton
        label={t('Delete table')}
        disabled={!state.canDeleteTable}
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        <RiDeleteBin2Line />
      </ToolbarButton>
    </div>
  );
}
