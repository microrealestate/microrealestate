import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import { useTranslations } from 'next-intl';
import { LiaEllipsisVSolid } from 'react-icons/lia';
import { LuHistory } from 'react-icons/lu';
import { RiMailSendLine } from 'react-icons/ri';
import { TbCashRegister } from 'react-icons/tb';
import { useSendEmailDisabledReason } from './SendEmailGate';

export default function DesktopRentActions({ rent, onPay, onSend, onHistory }) {
  const t = useTranslations('common');
  const sendEmailDisabledReason = useSendEmailDisabledReason(rent);

  return (
    <div className="whitespace-nowrap text-right">
      <Button
        variant="ghost"
        size="icon"
        data-cy="payRentAction"
        onClick={() => onPay(rent)}
      >
        <TbCashRegister className="size-6" />
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <LiaEllipsisVSolid className="size-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="p-2 w-40">
          <div className="flex flex-col items-center justify-start gap-2">
            <div className="w-full">
              <Button
                variant="ghost"
                disabled={!!sendEmailDisabledReason}
                onClick={() => onSend(rent)}
                className="gap-2 w-full justify-start"
              >
                <RiMailSendLine className="size-5" />
                {t('Send')}
              </Button>
              {sendEmailDisabledReason ? (
                <p className="px-3 text-xs text-muted-foreground">
                  {sendEmailDisabledReason}
                </p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              onClick={() => onHistory(rent)}
              data-cy="rentHistoryAction"
              className="gap-2 w-full justify-start"
            >
              <LuHistory className="size-5" />
              {t('History')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
