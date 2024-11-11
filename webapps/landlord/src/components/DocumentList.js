import { Card, CardContent } from './ui/card';
import { LuAlertTriangle, LuInfo, LuTrash } from 'react-icons/lu';
import { useCallback, useMemo } from 'react';
import { Alert } from './ui/alert';
import { Button } from './ui/button';
import { GrDocumentText } from 'react-icons/gr';
import { MdOutlineScanner } from 'react-icons/md';
import moment from 'moment';
import useTranslation from 'next-translate/useTranslation';

const DocumentItem = ({ document, onEdit, onDelete, disabled }) => {
  const { t } = useTranslation('common');

  const handleEditClick = useCallback(() => {
    onEdit(document);
  }, [onEdit, document]);

  const handleDeleteClick = useCallback(() => {
    onDelete(document);
  }, [onDelete, document]);

  const expiryMoment = useMemo(() => {
    return document.expiryDate ? moment(document.expiryDate) : null;
  }, [document.expiryDate]);

  const isExpired = useMemo(() => {
    return expiryMoment ? moment().isSameOrAfter(expiryMoment) : false;
  }, [expiryMoment]);

  return (
    <div className="flex justify-between items-center p-4 border-b">
      <div>
        <Button
          variant="link"
          onClick={() => handleEditClick(document._id)}
          className="gap-1 p-0"
        >
          {document.type === 'text' ? (
            <GrDocumentText className="size-6" />
          ) : (
            <MdOutlineScanner className="size-6" />
          )}
          {document.name}
        </Button>

        {document.description ? (
          <div className="text-muted-foreground text-sm">
            {document.description}
          </div>
        ) : null}

        {expiryMoment ? (
          <Alert variant={isExpired ? 'warning' : 'default'}>
            <div className="flex items-center gap-4">
              {isExpired ? (
                <LuAlertTriangle className="size-4" />
              ) : (
                <LuInfo className="size-4" />
              )}
              <div className="text-sm">
                {isExpired
                  ? t('expired document')
                  : t('expiry {{relativeDate}}', {
                      relativeDate: expiryMoment.fromNow()
                    })}
              </div>
            </div>
          </Alert>
        ) : null}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDeleteClick}
        disabled={disabled}
      >
        <LuTrash className="size-6" />
      </Button>
    </div>
  );
};

export default function DocumentList({
  documents,
  onEdit,
  onDelete,
  disabled = false
}) {
  return (
    <Card>
      <CardContent className="p-0 h-72 overflow-y-auto">
        {documents
          ?.sort(({ type: type1 }, { type: type2 }) =>
            type1.localeCompare(type2)
          )
          .map((document) => (
            <DocumentItem
              key={document._id}
              document={document}
              onEdit={onEdit}
              onDelete={onDelete}
              disabled={disabled}
            />
          ))}
      </CardContent>
    </Card>
  );
}
