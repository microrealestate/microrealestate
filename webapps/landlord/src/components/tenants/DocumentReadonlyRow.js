import { Button } from '@microrealestate/commonui/components/ui/button';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { LuPaperclip, LuTrash } from 'react-icons/lu';

export default function DocumentReadonlyRow({
  doc,
  templateName,
  disabled,
  onView,
  onDelete
}) {
  const t = useTranslations('common');

  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Button
          variant="link"
          className="h-fit max-w-full justify-start p-0"
          onClick={onView}
          disabled={!doc.url}
          title={doc.name || templateName}
        >
          <LuPaperclip className="shrink-0" />
          <span className="truncate">{doc.name || templateName}</span>
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="whitespace-nowrap">
            {moment(doc.createdDate).format('L LT')}
          </span>
        </div>
      </div>
      {!disabled ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="shrink-0"
        >
          <LuTrash />
          {t('Delete')}
        </Button>
      ) : null}
    </div>
  );
}
