import { cn } from '@microrealestate/commonui/utils';
import { BsCashCoin } from 'react-icons/bs';
import { FaRegCreditCard } from 'react-icons/fa6';
import {
  LuArrowDownUp,
  LuArrowUpRight,
  LuBanknote,
  LuMountain,
  LuWallet
} from 'react-icons/lu';

export const ChequeIcon = LuBanknote;
export const CashIcon = BsCashCoin;
export const DirectDebitIcon = LuArrowDownUp;
export const TransferIcon = LuArrowUpRight;
export const CardIcon = FaRegCreditCard;
export const OtherIcon = LuWallet;

export default function PaymentIcon({ type, className }) {
  let Icon = LuMountain;
  switch (type) {
    case 'cheque':
      Icon = ChequeIcon;
      break;
    case 'cash':
      Icon = CashIcon;
      break;
    case 'direct_debit':
      Icon = DirectDebitIcon;
      break;
    case 'transfer':
      Icon = TransferIcon;
      break;
    case 'card':
      Icon = CardIcon;
      break;
    case 'other':
      Icon = OtherIcon;
      break;
  }

  return <Icon className={cn('size-6', className)} />;
}
