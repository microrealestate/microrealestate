import { Button } from '@microrealestate/commonui/components/ui/button';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LuRotateCw } from 'react-icons/lu';
import { RiMailSendLine } from 'react-icons/ri';
import SendByEmailDialog from './SendByEmailDialog';

export default function SendByEmailButton({ rents, onDone }) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleClick = () => {
    if (sending) {
      return;
    }
    setOpen(true);
  };

  const handleSending = () => {
    setSending(true);
  };

  const handleDone = (isEmailSent) => {
    setSending(false);
    onDone?.(isEmailSent);
  };

  return (
    <>
      <Button
        variant="outline"
        disabled={!rents?.length}
        className="gap-2 w-full"
        onClick={handleClick}
      >
        {!sending ? (
          <>
            <RiMailSendLine />
            {t('Send')}
          </>
        ) : (
          <>
            <LuRotateCw className="animate-spin size-4" />
            {t('Sending...')}
          </>
        )}
      </Button>
      <SendByEmailDialog
        open={open}
        setOpen={setOpen}
        data={rents}
        onSending={handleSending}
        onDone={handleDone}
      />
    </>
  );
}
