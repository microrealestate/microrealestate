import { Button } from '@microrealestate/commonui/components/ui/button';
import { Label } from '@microrealestate/commonui/components/ui/label';
import {
  RadioGroup,
  RadioGroupItem
} from '@microrealestate/commonui/components/ui/radio-group';
import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { BsFileEarmarkCheck } from 'react-icons/bs';
import { GiInjustice } from 'react-icons/gi';
import { HiOutlineBellAlert } from 'react-icons/hi2';
import { LiaFileInvoiceSolid } from 'react-icons/lia';
import { LuRotateCw, LuTriangleAlert } from 'react-icons/lu';
import { RiMailSendLine } from 'react-icons/ri';
import { toast } from 'sonner';
import { useStore } from '@/providers/StoreProvider';
import ResponsiveDialog from '../ResponsiveDialog';

export default function SendByEmailDialog({
  open,
  setOpen,
  data: rents,
  onSending,
  onDone
}) {
  const t = useTranslations('common');
  const store = useStore();
  const [documentName, setDocumentName] = useState();
  const [sending, setSending] = useState(false);

  const handleConfirm = async () => {
    try {
      onSending?.();
      setSending(true);
      const sendStatus = await store.rent.sendEmail({
        document: documentName,
        tenantIds: rents.map((r) => r._id),
        terms: rents.map((r) => r.term)
      });
      if (sendStatus !== 200) {
        return toast.error(t('Email delivery service cannot send emails'));
      }
      const response = await store.rent.fetch();
      if (response.status !== 200) {
        return toast.error(t('Cannot fetch rents from server'));
      }
      handleSetOpen(false, true);
    } finally {
      if (open) {
        handleSetOpen(false, false);
      }
    }
  };

  const handleSetOpen = (isOpen, isEmailSent) => {
    if (isOpen) {
      setOpen(true);
    } else {
      // this avoid send button to flicker
      setTimeout(() => {
        setDocumentName(null);
        setSending(false);
        onDone?.(isEmailSent);
      }, 500);
      setOpen(false);
    }
  };

  const documents = [
    {
      id: 'send_receipt',
      Icon: BsFileEarmarkCheck,
      label: t('Receipt'),
      description: t(
        'A document confirming that the tenant has paid the rent, detailing the payment amount and date.'
      ),
      value: 'receipt',
      variant: 'success'
    },
    {
      id: 'send_rentnotice',
      Icon: LiaFileInvoiceSolid,
      label: t('Payment notice'),
      description: t(
        'A document notifying the tenant of the upcoming rent payment, specifying the amount and deadline.'
      ),
      value: 'rentnotice',
      variant: 'secondary-foreground'
    },
    {
      id: 'send_rentnotice_reminder',
      Icon: HiOutlineBellAlert,
      label: t('Payment notice reminder'),
      description: t(
        'A follow-up reminder reiterating the overdue payment details and urging immediate action to avoid further consequences.'
      ),
      value: 'rentnotice_reminder',
      variant: 'warning'
    },
    {
      id: 'send_rentnotice_last_reminder',
      Icon: GiInjustice,
      label: t('Final notice before eviction'),
      description: t(
        'A last warning issued to the tenant, emphasizing the urgency of resolving overdue payments to avoid eviction proceedings.'
      ),
      value: 'rentnotice_last_reminder',
      variant: 'destructive'
    }
  ];

  const recipientName =
    rents?.length === 1 ? rents[0]?.occupant?.name : undefined;
  const headerText = recipientName
    ? t('This email is going to be sent to {tenant}', {
        tenant: recipientName
      })
    : t('The document is going to be sent to {count} tenants.', {
        count: rents?.length ?? 0
      });

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title={headerText}
      renderHeader={() => (
        <div className="flex items-center gap-2">
          {!recipientName ? <LuTriangleAlert className="size-5" /> : null}
          {headerText}
        </div>
      )}
      renderContent={() => (
        <div className="flex flex-col h-full">
          <div className="text-md mb-4 size-full">
            {t('Choose a document:')}
          </div>
          <RadioGroup onValueChange={setDocumentName} disabled={sending}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-2 first:mb-10 border rounded"
              >
                <RadioGroupItem value={doc.value} id={doc.id} />
                <Label htmlFor={doc.id}>
                  <div className="flex irem items-center gap-2 mb-1">
                    <doc.Icon
                      className={cn('size-6 min-w-6', `text-${doc.variant}`)}
                    />
                    <div className="text-lg">{doc.label}</div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {doc.description}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
      renderFooter={() => (
        <>
          <Button
            variant="outline"
            onClick={() => handleSetOpen(false, false)}
            disabled={sending}
          >
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            className="gap-2"
            disabled={!documentName}
          >
            {!sending ? (
              <>
                <RiMailSendLine />
                {t('Send')}
              </>
            ) : (
              <>
                <LuRotateCw className="animate-spin size-4" />
                {t('Processing...')}
              </>
            )}
          </Button>
        </>
      )}
      isLoading={sending}
    />
  );
}
