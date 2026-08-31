import { Button } from '@microrealestate/commonui/components/ui/button';
import { cn } from '@microrealestate/commonui/utils';
import moment from 'moment';
import { useTranslations } from 'next-intl';
import { LuPaperclip } from 'react-icons/lu';
import { toast } from 'sonner';
import { downloadDocument } from '../../utils/fetch';
import {
  LastReminderDocumentIcon,
  ReceiptDocumentIcon,
  ReminderDocumentIcon,
  RentNoticeDocumentIcon
} from './DocumentIcon';

function addAttachedDocuments(t, acc, rent, template, emails) {
  let documentName = '?';
  let Icon = LuPaperclip;
  let variant = 'muted-foreground';
  if (template === 'rentnotice') {
    Icon = RentNoticeDocumentIcon;
    documentName = `${rent.occupant.name}-${t('first notice')}.pdf`;
  } else if (template === 'rentnotice_reminder') {
    Icon = ReminderDocumentIcon;
    variant = 'warning';
    documentName = `${rent.occupant.name}-${t('reminder notice')}.pdf`;
  } else if (template === 'rentnotice_last_reminder') {
    Icon = LastReminderDocumentIcon;
    variant = 'destructive';
    documentName = `${rent.occupant.name}-${t(
      'last reminder before eviction'
    )}.pdf`;
  } else if (template === 'receipt') {
    Icon = ReceiptDocumentIcon;
    variant = 'success';
    documentName = `${rent.occupant.name}-${t('receipt')}.pdf`;
  }

  const endpoint = `/documents/${template}/${rent.occupant._id}/${rent.term}`;

  emails?.forEach((email) => {
    const sentDate = moment(email.sentDate);
    const sentDateString = sentDate.format('L LT');

    let label = '?';
    if (template === 'rentnotice') {
      label = t('Payment notice - {date}', {
        date: sentDateString
      });
    } else if (template === 'rentnotice_reminder') {
      label = t('Payment notice reminder - {date}', {
        date: sentDateString
      });
    } else if (template === 'rentnotice_last_reminder') {
      label = t('Final notice before eviction - {date}', {
        date: sentDateString
      });
    } else if (template === 'receipt') {
      label = t('Receipt - {date}', {
        date: sentDateString
      });
    }

    acc.push({
      sentDate,
      label,
      documentName,
      endpoint,
      Icon,
      variant
    });
  });

  return acc;
}
export default function RentAttachedDocuments({ rent, className }) {
  const t = useTranslations('common');

  const attachedDocuments = [];
  addAttachedDocuments(
    t,
    attachedDocuments,
    rent,
    'rentnotice',
    rent.emailStatus?.rentnotice
  );
  addAttachedDocuments(
    t,
    attachedDocuments,
    rent,
    'rentnotice_reminder',
    rent.emailStatus?.rentnotice_reminder
  );
  addAttachedDocuments(
    t,
    attachedDocuments,
    rent,
    'rentnotice_last_reminder',
    rent.emailStatus?.rentnotice_last_reminder
  );
  addAttachedDocuments(
    t,
    attachedDocuments,
    rent,
    'receipt',
    rent.emailStatus?.receipt
  );
  attachedDocuments.sort((a, b) => a.sentDate - b.sentDate);

  const handleDownloadClick = (endpoint, documentName) => () => {
    downloadDocument({ endpoint, documentName }).catch((_error) => {
      toast.error(t('Cannot download document'));
    });
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {attachedDocuments.length ? (
        attachedDocuments.map(
          (
            { Icon, sentDate, label, documentName, endpoint, variant },
            index
          ) => {
            const visible = label && sentDate;
            return visible ? (
              <div
                key={`${documentName}-${index}-${sentDate.unix()}`}
                className={cn(
                  'flex items-center flex-nowrap gap-1 py-0.5 px-1 border rounded-xl h-fit w-fit',
                  `text-${variant}`
                )}
              >
                <Icon className="size-4" />
                <Button
                  variant="link"
                  className={cn(
                    'p-0 m-0 h-fit text-xs font-normal',
                    `text-${variant}`
                  )}
                  onClick={handleDownloadClick(endpoint, documentName)}
                >
                  <div>{label}</div>
                </Button>
              </div>
            ) : null;
          }
        )
      ) : (
        <div className="text-muted-foreground text-xs">
          {t('No emails sent yet.')}
        </div>
      )}
    </div>
  );
}
