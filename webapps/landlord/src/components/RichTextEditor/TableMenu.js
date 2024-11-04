import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

const TableMenu = ({ editor }) => {
  return editor ? (
    <div className="flex">
      <Button
        variant="ghost"
        size="icon"
        onClick={() =>
          editor.commands.insertTable({
            rows: 1,
            cols: 2,
            withHeaderRow: false
          })
        }
        disabled={!editor.isEditable}
      >
        <i className="ri-table-2"></i>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().deleteTable()}
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        <i className="ri-delete-bin-2-line"></i>
      </Button>
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().addColumnBefore()}
        onClick={() => editor.chain().focus().addColumnBefore().run()}
      >
        <i className="ri-insert-column-left"></i>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().addColumnAfter()}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      >
        <i className="ri-insert-column-right"></i>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().deleteColumn()}
        onClick={() => editor.chain().focus().deleteColumn().run()}
      >
        <i className="ri-delete-column"></i>
      </Button>
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().addRowBefore()}
        onClick={() => editor.chain().focus().addRowBefore().run()}
      >
        <i className="ri-insert-row-top"></i>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().addRowAfter()}
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        <i className="ri-insert-row-bottom"></i>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().deleteRow()}
        onClick={() => editor.chain().focus().deleteRow().run()}
      >
        <i className="ri-delete-row"></i>
      </Button>
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().mergeCells()}
        onClick={() => editor.chain().focus().mergeCells().run()}
      >
        <i className="ri-merge-cells-horizontal"></i>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().splitCell()}
        onClick={() => editor.chain().focus().splitCell().run()}
      >
        <i className="ri-split-cells-horizontal"></i>
      </Button>
    </div>
  ) : null;
};

export default TableMenu;
