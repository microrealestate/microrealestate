import { getRentAmounts, RentAmount } from './RentDetails';
import { LuHistory, LuPaperclip } from 'react-icons/lu';
import { useCallback, useContext, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { cn } from '../../utils';
import { downloadDocument } from '../../utils/fetch';
import { EmptyIllustration } from '../Illustrations';
import moment from 'moment';
import NewPaymentDialog from '../payment/NewPaymentDialog';
import RentHistoryDialog from './RentHistoryDialog';
import { Separator } from '../ui/separator';
import { StoreContext } from '../../store';
import { TbCashRegister } from 'react-icons/tb';
import Tooltip from '../Tooltip';
import useTranslation from 'next-translate/useTranslation';

function Reminder({ rent, className }) {
  const { t } = useTranslation('common');

  let label;
  let sentDate;
  let color = 'text-muted-foreground';
  let endpoint;
  let documentName;

  if (rent.emailStatus?.status?.rentcall) {
    sentDate = moment(rent.emailStatus.last.rentcall.sentDate);
    label = t('1st notice sent on {{date}}', {
      date: sentDate.format('L LT')
    });
    documentName = `${rent.occupant.name}-${t('first notice')}.pdf`;
    endpoint = `/documents/rentcall/${rent.occupant._id}/${rent.term}`;
  }

  if (rent.emailStatus?.last?.rentcall_reminder) {
    sentDate = moment(rent.emailStatus.last.rentcall_reminder.sentDate);
    label = t('2nd notice sent on {{date}}', {
      date: sentDate.format('L LT')
    });
    documentName = `${rent.occupant.name}-${t('second notice')}.pdf`;
    endpoint = `/documents/rentcall_reminder/${rent.occupant._id}/${rent.term}`;
  }

  if (rent.emailStatus?.last?.rentcall_last_reminder) {
    sentDate = moment(rent.emailStatus.last.rentcall_last_reminder.sentDate);
    label = t('Last notice sent on {{date}}', {
      date: sentDate.format('L LT')
    });
    color = 'text-warning';
    documentName = `${rent.occupant.name}-${t('last notice')}.pdf`;
    endpoint = `/documents/rentcall_last_reminder/${rent.occupant._id}/${rent.term}`;
  }

  if (rent.emailStatus?.last?.invoice) {
    sentDate = moment(rent.emailStatus.last.invoice.sentDate);
    label = t('Invoice sent on {{date}}', { date: sentDate.format('L LT') });
    color = 'text-success';
    documentName = `${rent.occupant.name}-${t('invoice')}.pdf`;
    endpoint = `/documents/invoice/${rent.occupant._id}/${rent.term}`;
  }

  const visible = label && sentDate;

  const handleDownloadClick = useCallback(() => {
    downloadDocument({ endpoint, documentName });
  }, [documentName, endpoint]);

  return visible ? (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        'rounded-lg text-xs bg-muted font-normal h-fit gap-1 px-1 py-0.5',
        color,
        `hover:${color}`,
        className
      )}
      onClick={handleDownloadClick}
    >
      <LuPaperclip className="size-4" />
      <div className="whitespace-normal">{label}</div>
    </Button>
  ) : null;
}

function RentRow({ rent, isSelected, onSelect, onEdit, onHistory }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const rentAmounts = getRentAmounts(rent);

  return (
    <>
      <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center">
        <div className="w-full md:w-2/6 space-y-2">
          <div className="flex items-center gap-4">
            {store.organization.canSendEmails ? (
              rent.occupant.hasContactEmails ? (
                <Checkbox
                  checked={isSelected}
                  disabled={!store.organization.canSendEmails}
                  onCheckedChange={onSelect(rent)}
                  aria-labelledby={rent.occupant.name}
                />
              ) : (
                <Tooltip title={t('No emails available for this tenant')}>
                  <Checkbox
                    onCheckedChange={onSelect(rent)}
                    aria-labelledby={rent.occupant.name}
                    disabled
                  />
                </Tooltip>
              )
            ) : null}

            <Button
              variant="link"
              className="p-0 h-fit text-lg whitespace-normal text-left"
              onClick={onEdit(rent)}
            >
              {rent.occupant.name}
            </Button>
          </div>
          <Reminder rent={rent} className="hidden md:inline-flex ml-8" />
        </div>
        <div className="flex pl-8 md:pl-0 md:grid md:grid-cols-3 lg:grid-cols-5 gap-4 w-full md:w-4/6">
          <RentAmount
            label={t('Rent')}
            amount={rentAmounts.rent}
            withColor={false}
            className="hidden lg:block text-muted-foreground"
          />
          <RentAmount
            label={t('Balance')}
            amount={rentAmounts.balance}
            withColor={false}
            className="hidden lg:block text-muted-foreground"
          />
          <RentAmount
            label={t('Rent due')}
            amount={rentAmounts.totalAmount}
            withColor={false}
            debitColor={rentAmounts.totalAmount > 0}
            creditColor={rentAmounts.totalAmount < 0}
            className={rentAmounts.totalAmount !== 0 ? 'font-bold' : ''}
          />
          <div className="grow">
            <RentAmount
              label={t('Settlement')}
              amount={rent.payment}
              className={rentAmounts.payment > 0 ? 'font-bold' : ''}
            />
          </div>
          <div className="text-right space-x-2 grow whitespace-nowrap">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit(rent)}
              className="hidden sm:inline-flex"
            >
              <TbCashRegister className="size-6" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onHistory(rent)}>
              <LuHistory className="size-6" />
            </Button>
          </div>
        </div>
        <Reminder rent={rent} className="md:hidden w-fit" />
      </div>
    </>
  );
}

function RentTable({ rents = [], selected, setSelected }) {
  const store = useContext(StoreContext);
  const { t } = useTranslation('common');
  const [openNewPaymentDialog, setOpenNewPaymentDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [openRentHistoryDialog, setOpenRentHistoryDialog] = useState(false);
  const [selectedRentHistory, setSelectedRentHistory] = useState(null);

  const selectableRentNum = useMemo(() => {
    return rents.reduce((acc, { _id, occupant: { hasContactEmails } }) => {
      if (hasContactEmails) {
        acc.push(_id);
      }
      return acc;
    }, []).length;
  }, [rents]);

  const onSelectAllClick = useCallback(
    (checked) => {
      let rentSelected = [];
      if (checked) {
        rentSelected = rents.filter((rent) => rent.occupant.hasContactEmails);
      }
      setSelected?.(rentSelected);
    },
    [rents, setSelected]
  );

  const onSelectClick = useCallback(
    (rent) => (checked) => {
      let rentSelected = [];
      if (checked) {
        rentSelected = [...selected, rent];
      } else {
        rentSelected = selected.filter((r) => r._id !== rent._id);
      }
      setSelected?.(rentSelected);
    },
    [selected, setSelected]
  );

  const handleEdit = useCallback(
    (rent) => () => {
      setSelectedPayment(rent);
      setOpenNewPaymentDialog(true);
    },
    [setOpenNewPaymentDialog, setSelectedPayment]
  );

  const handleHistory = useCallback(
    (rent) => () => {
      setSelectedRentHistory(rent.occupant);
      setOpenRentHistoryDialog(true);
    },
    [setOpenRentHistoryDialog, setSelectedRentHistory]
  );

  return (
    <>
      <NewPaymentDialog
        open={openNewPaymentDialog}
        setOpen={setOpenNewPaymentDialog}
        data={selectedPayment}
      />

      <RentHistoryDialog
        open={openRentHistoryDialog}
        setOpen={setOpenRentHistoryDialog}
        data={selectedRentHistory}
      />

      {rents.length ? (
        <Card className="p-6">
          {store.organization.canSendEmails ? (
            <div className="space-y-2">
              <Checkbox
                checked={
                  selected.length > 0 && selected.length < selectableRentNum
                    ? 'intermediate'
                    : selected.length === selectableRentNum
                }
                disabled={!store.organization.canSendEmails}
                onCheckedChange={onSelectAllClick}
                aria-labelledby={t('select all rents')}
              />
              <Separator className="my-1" />
            </div>
          ) : null}
          {rents.map((rent) => {
            const isItemSelected = selected
              .map((r) => r._id)
              .includes(rent._id);
            return (
              <div key={`${rent._id}_${rent.term}`}>
                <div className="my-3">
                  <RentRow
                    rent={rent}
                    isSelected={isItemSelected}
                    onSelect={onSelectClick}
                    onEdit={handleEdit}
                    onHistory={handleHistory}
                  />
                </div>
                <Separator />
              </div>
            );
          })}
        </Card>
      ) : (
        <EmptyIllustration label={t('No rents found')} />
      )}
    </>
  );
}

export default RentTable;
