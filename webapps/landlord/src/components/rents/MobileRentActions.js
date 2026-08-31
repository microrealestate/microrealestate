import { Button } from '@microrealestate/commonui/components/ui/button';
import { LuHistory } from 'react-icons/lu';
import { RiMailSendLine } from 'react-icons/ri';
import { TbCashRegister } from 'react-icons/tb';
import { SendEmailPopover, useSendEmailDisabledReason } from './SendEmailGate';

export default function MobileRentActions({ rent, onPay, onSend, onHistory }) {
  const sendEmailDisabledReason = useSendEmailDisabledReason(rent);

  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={() => onHistory(rent)}>
        <LuHistory className="size-5" />
      </Button>
      <SendEmailPopover reason={sendEmailDisabledReason}>
        <Button
          variant="ghost"
          size="sm"
          onClick={sendEmailDisabledReason ? undefined : () => onSend(rent)}
        >
          <RiMailSendLine className="size-5" />
        </Button>
      </SendEmailPopover>
      <Button
        variant="ghost"
        size="sm"
        data-cy="payRentAction"
        onClick={() => onPay(rent)}
      >
        <TbCashRegister className="size-5" />
      </Button>
    </div>
  );
}
