import { Divider } from '@material-ui/core';
import EditorButton from './EditorButton';
import FormatToolbar from './FormatToolbar';

const TableMenu = ({ editor }) => {
  return editor ? (
    <FormatToolbar>
      <EditorButton
        iconType="ri-table-2"
        onClick={() =>
          editor.commands.insertTable({
            rows: 1,
            cols: 2,
            withHeaderRow: false,
          })
        }
        disabled={!editor.isEditable}
      />
      <EditorButton
        iconType="ri-delete-bin-2-line"
        disabled={!editor.isEditable || !editor.can().deleteTable()}
        onClick={() => editor.chain().focus().deleteTable().run()}
      />
      <Divider orientation="vertical" flexItem />
      <EditorButton
        iconType="ri-insert-column-left"
        disabled={!editor.isEditable || !editor.can().addColumnBefore()}
        onClick={() => editor.chain().focus().addColumnBefore().run()}
      />
      <EditorButton
        iconType="ri-insert-column-right"
        disabled={!editor.isEditable || !editor.can().addColumnAfter()}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      />
      <EditorButton
        iconType="ri-delete-column"
        disabled={!editor.isEditable || !editor.can().deleteColumn()}
        onClick={() => editor.chain().focus().deleteColumn().run()}
      />
      <Divider orientation="vertical" flexItem />
      <EditorButton
        iconType="ri-insert-row-top"
        disabled={!editor.isEditable || !editor.can().addRowBefore()}
        onClick={() => editor.chain().focus().addRowBefore().run()}
      />
      <EditorButton
        iconType="ri-insert-row-bottom"
        disabled={!editor.isEditable || !editor.can().addRowAfter()}
        onClick={() => editor.chain().focus().addRowAfter().run()}
      />
      <EditorButton
        iconType="ri-delete-row"
        disabled={!editor.isEditable || !editor.can().deleteRow()}
        onClick={() => editor.chain().focus().deleteRow().run()}
      />
      <Divider orientation="vertical" flexItem />
      <EditorButton
        iconType="ri-merge-cells-horizontal"
        disabled={!editor.isEditable || !editor.can().mergeCells()}
        onClick={() => editor.chain().focus().mergeCells().run()}
      />
      <EditorButton
        iconType="ri-split-cells-horizontal"
        disabled={!editor.isEditable || !editor.can().splitCell()}
        onClick={() => editor.chain().focus().splitCell().run()}
      />
    </FormatToolbar>
  ) : null;
};

export default TableMenu;
