import { cn } from '@microrealestate/commonui/utils';
import { BsFileEarmarkCheck } from 'react-icons/bs';
import { GiInjustice } from 'react-icons/gi';
import { HiOutlineBellAlert } from 'react-icons/hi2';
import { LiaFileInvoiceSolid } from 'react-icons/lia';
import { LuPaperclip } from 'react-icons/lu';

export const RentNoticeDocumentIcon = LiaFileInvoiceSolid;
export const ReceiptDocumentIcon = BsFileEarmarkCheck;
export const ReminderDocumentIcon = HiOutlineBellAlert;
export const LastReminderDocumentIcon = GiInjustice;

export default function DocumentIcon({ type, className }) {
  let Icon = LuPaperclip;
  switch (type) {
    case 'rentnotice':
      Icon = RentNoticeDocumentIcon;
      break;
    case 'rentnotice_reminder':
      Icon = ReminderDocumentIcon;
      break;
    case 'rentnotice_last_reminder':
      Icon = LastReminderDocumentIcon;
      break;
    case 'receipt':
      Icon = ReceiptDocumentIcon;
      break;
  }

  return <Icon className={cn('size-6', className)} />;
}
