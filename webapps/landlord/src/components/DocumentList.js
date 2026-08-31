import { Button } from '@microrealestate/commonui/components/ui/button';
import { useCallback } from 'react';
import { GrDocumentText } from 'react-icons/gr';
import { LuTrash } from 'react-icons/lu';
import { MdOutlineScanner } from 'react-icons/md';

const DocumentItem = ({ document, onEdit, onDelete, disabled }) => {
  const handleEditClick = useCallback(() => {
    onEdit(document);
  }, [onEdit, document]);

  const handleDeleteClick = useCallback(() => {
    onDelete(document);
  }, [onDelete, document]);

  return (
    <div className="flex gap-2 items-center border rounded-full px-1 py-0.5 w-fit">
      <Button
        variant="link"
        onClick={() => handleEditClick(document._id)}
        className="flex items-center gap-1 p-0 h-fit w-fit text-xs font-normal text-secondary-foreground whitespace-normal"
      >
        {document.type === 'text' ? (
          <GrDocumentText className="size-3.5" />
        ) : (
          <MdOutlineScanner className="size-3.5" />
        )}
        {document.name}
      </Button>
      <Button
        variant="secondary"
        onClick={handleDeleteClick}
        disabled={disabled}
        className="p-1 h-fit rounded-full"
      >
        <LuTrash className="size-4" />
      </Button>
    </div>
  );
};

export default function DocumentList({
  documents,
  onEdit,
  onDelete,
  disabled = false,
  className
}) {
  return (
    <div className={className ? className : 'mt-4 space-y-2'}>
      {documents
        ?.sort(({ type: type1 }, { type: type2 }) => type1.localeCompare(type2))
        .map((document) => (
          <DocumentItem
            key={document._id}
            document={document}
            onEdit={onEdit}
            onDelete={onDelete}
            disabled={disabled}
          />
        ))}
    </div>
  );
}
