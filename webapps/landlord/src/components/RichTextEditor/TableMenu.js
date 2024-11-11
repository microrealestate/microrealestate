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
        <RiTable2 />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().deleteTable()}
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        <RiDeleteBin2Line />
      </Button>
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().addColumnBefore()}
        onClick={() => editor.chain().focus().addColumnBefore().run()}
      >
        <RiInsertColumnLeft />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().addColumnAfter()}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      >
        <RiInsertColumnRight />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().deleteColumn()}
        onClick={() => editor.chain().focus().deleteColumn().run()}
      >
        <RiDeleteColumn />
      </Button>
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().addRowBefore()}
        onClick={() => editor.chain().focus().addRowBefore().run()}
      >
        <RiInsertRowTop />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().addRowAfter()}
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        <RiInsertRowBottom />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().deleteRow()}
        onClick={() => editor.chain().focus().deleteRow().run()}
      >
        <RiDeleteRow />
      </Button>
      <Separator orientation="vertical" />
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().mergeCells()}
        onClick={() => editor.chain().focus().mergeCells().run()}
      >
        <RiMergeCellsHorizontal />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!editor.isEditable || !editor.can().splitCell()}
        onClick={() => editor.chain().focus().splitCell().run()}
      >
        <RiSplitCellsHorizontal />
      </Button>
    </div>
  ) : null;
};

export default TableMenu;
