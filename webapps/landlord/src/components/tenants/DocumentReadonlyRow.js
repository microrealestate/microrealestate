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
    <div className="flex items-start justify-between">
      <div className="flex flex-col gap-1">
        <Button
          variant="link"
          className="size-fit p-0"
          onClick={onView}
          disabled={!doc.url}
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
        <Button variant="outline" size="sm" onClick={onDelete}>
          <LuTrash />
          {t('Delete')}
        </Button>
      ) : null}
    </div>
  );
}
