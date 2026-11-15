import { Button } from '@microrealestate/commonui/components/ui/button';
import { toast } from '@microrealestate/commonui/components/ui/sonner';
import { cn } from '@microrealestate/commonui/utils';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { LuDownload } from 'react-icons/lu';
import { downloadDocument } from '../../utils/fetch';
import { RENT_DOCUMENTS, type RentDocument } from './rentDocuments';
import type { MonthRent } from './types';

type SentEmail = { sentDate?: string };

export default function RentEmailsSent({ rent }: { rent: MonthRent }) {
  const t = useTranslations('common');

  const sent = RENT_DOCUMENTS.flatMap((document) => {
    const emails = (rent.emailStatus?.[document.name] ?? []) as SentEmail[];
    const fileLabel = t(document.fileLabel);
    return emails
      .filter((email) => email.sentDate)
      .map((email) => ({
        document,
        fileLabel,
        sentDate: moment(email.sentDate)
      }));
  }).sort((a, b) => b.sentDate.valueOf() - a.sentDate.valueOf());

  const download = (document: RentDocument, fileLabel: string) => () => {
    const fileName = `${rent.occupant.name}-${fileLabel}.pdf`;
    downloadDocument({
      endpoint: `/documents/${document.name}/${rent.occupant._id}/${rent.term}`,
      documentName: fileName
    }).catch(() => {
      toast.error(t('Cannot download document'));
    });
  };

  if (!sent.length) {
    return (
      <p className="py-1.5 text-base text-muted-foreground md:text-sm">
        {t('No email sent for this month.')}
      </p>
    );
  }

  return (
    <ul className="text-base md:text-sm">
      {sent.map(({ document, fileLabel, sentDate }) => (
        <li
          key={`${document.name}-${sentDate.valueOf()}`}
          className="flex items-center gap-3 py-1"
        >
          <span className="w-14 shrink-0 text-muted-foreground tabular-nums">
            {sentDate.format('D MMM')}
          </span>
          <document.Icon className={cn('size-4 shrink-0', document.tone)} />
          <span
            className="min-w-0 flex-1 truncate"
            title={sentDate.format('LLL')}
          >
            {t(document.label)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label={t('Download {document}', {
              document: t(document.label)
            })}
            onClick={download(document, fileLabel)}
          >
            <LuDownload className="size-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
