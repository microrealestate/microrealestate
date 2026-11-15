import { Button } from '@microrealestate/commonui/components/ui/button';
import { Card } from '@microrealestate/commonui/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { RiMailSendLine } from 'react-icons/ri';
import { useMediaQuery } from 'usehooks-ts';
import { QueryKeys } from '../../utils/restcalls';
import { EmptyIllustration } from '../Illustrations';
import {
  isAllSelected,
  type MultiSelection,
  MultiSelectionProvider
} from '../MultiSelection';
import NewPaymentDialog from '../payment/NewPaymentDialog';
import SelectionBar from '../SelectionBar';
import RentCardList from './RentCardList';
import RentDetailsDrawer from './RentDetailsDrawer';
import RentHistoryDialog from './RentHistoryDialog';
import RentTableView from './RentTableView';
import { type RentSort, type RentSortKey, rentKey } from './rentView';
import SendByEmailDialog from './SendByEmailDialog';
import { useCanSendEmails } from './SendEmailGate';
import type { MonthRent, RentTableViewProps } from './types';

type RentHistorySelection = {
  tenant: MonthRent['occupant'] | undefined;
  selectedTerm: number | undefined;
};

export default function RentTable({
  rents = [],
  filteredRents = [],
  monthRents = [],
  selection,
  yearMonth,
  periodLabel,
  sort,
  onSort
}: {
  rents?: MonthRent[];
  // All the rents the search and filters keep, on every page
  filteredRents?: MonthRent[];
  // All the rents of the month, filters ignored
  monthRents?: MonthRent[];
  // The ticked rents, by `rentKey` (`useMultiSelection({ alwaysOn: true })`)
  selection: MultiSelection;
  yearMonth: string;
  periodLabel: string;
  sort: RentSort;
  onSort: (key: RentSortKey) => void;
}) {
  const t = useTranslations('common');
  const queryClient = useQueryClient();
  const canSelect = useCanSendEmails();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [paymentRent, setPaymentRent] = useState<MonthRent | null>(null);
  const [openPayment, setOpenPayment] = useState(false);
  const [detailsKey, setDetailsKey] = useState<string | null>(null);
  const [sendTargets, setSendTargets] = useState<MonthRent[]>([]);
  const [sendingSelection, setSendingSelection] = useState(false);
  const [openSend, setOpenSend] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [historySelection, setHistorySelection] =
    useState<RentHistorySelection>({
      tenant: undefined,
      selectedTerm: undefined
    });

  // Read from the month data, not a copy, so the drawer shows the new amounts
  // once a payment is saved, even when the filters no longer keep the rent
  const detailsRent = useMemo(
    () =>
      detailsKey
        ? (monthRents.find((rent) => rentKey(rent) === detailsKey) ?? null)
        : null,
    [detailsKey, monthRents]
  );

  const selectableIds = useMemo(
    () =>
      filteredRents
        .filter((rent) => rent.occupant.hasContactEmails)
        .map(rentKey),
    [filteredRents]
  );

  const handlePay = useCallback((rent: MonthRent) => {
    setPaymentRent(rent);
    setOpenPayment(true);
  }, []);

  const handleSend = useCallback((rent: MonthRent) => {
    setSendTargets([rent]);
    setSendingSelection(false);
    setOpenSend(true);
  }, []);

  // A ticked rent stays ticked when a filter hides it: read the whole month
  const handleSendSelection = useCallback(() => {
    setSendTargets(
      monthRents.filter((rent) => selection.selected.has(rentKey(rent)))
    );
    setSendingSelection(true);
    setOpenSend(true);
  }, [monthRents, selection.selected]);

  const handleSendDone = useCallback(
    (isEmailSent: boolean) => {
      if (!isEmailSent) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: [QueryKeys.RENTS, yearMonth] });
      if (sendingSelection) {
        selection.clear();
      }
    },
    [queryClient, yearMonth, sendingSelection, selection]
  );

  const handleDetails = useCallback((rent: MonthRent) => {
    setDetailsKey(rentKey(rent));
  }, []);

  const handleHistory = useCallback((rent: MonthRent) => {
    setHistorySelection({
      tenant: rent.occupant,
      selectedTerm: rent.term
    });
    setOpenHistory(true);
  }, []);

  const viewProps: RentTableViewProps = {
    rents,
    selectableIds,
    canSelect,
    sort,
    onSort,
    onDetails: handleDetails
  };

  return (
    <MultiSelectionProvider value={selection}>
      <RentDetailsDrawer
        rent={detailsRent}
        periodLabel={periodLabel}
        open={!!detailsKey}
        onOpenChange={(open) => !open && setDetailsKey(null)}
        onPay={handlePay}
        onSend={handleSend}
        onHistory={handleHistory}
      />

      <NewPaymentDialog
        open={openPayment}
        setOpen={setOpenPayment}
        data={paymentRent}
      />

      <SendByEmailDialog
        open={openSend}
        setOpen={setOpenSend}
        data={sendTargets}
        onDone={handleSendDone}
      />

      <RentHistoryDialog
        open={openHistory}
        setOpen={setOpenHistory}
        data={historySelection}
      />

      <div className="min-w-0">
        {monthRents.length === 0 ? (
          <EmptyIllustration label={t('No rents found')} />
        ) : rents.length === 0 ? (
          <Card className="px-6 py-12 text-center">
            <div className="text-base font-semibold">
              {t('No rent matches your search')}
            </div>
            <div className="mt-1.5 text-sm text-muted-foreground">
              {t('Change the search text or select another status.')}
            </div>
          </Card>
        ) : isDesktop ? (
          <RentTableView {...viewProps} />
        ) : (
          <RentCardList {...viewProps} />
        )}
      </div>

      {canSelect && selection.selected.size > 0 ? (
        <SelectionBar
          label={t(
            '{count, plural, one {# of {total} rents} other {# of {total} rents}}',
            {
              count: selection.selected.size,
              total: selectableIds.length
            }
          )}
          onClose={selection.clear}
          closeLabel={t('Clear selection')}
          onSelectAll={() => selection.setAll(selectableIds)}
          allSelected={isAllSelected(selection.selected, selectableIds)}
        >
          <Button
            className="basis-full gap-2"
            data-cy="sendByEmail"
            onClick={handleSendSelection}
          >
            <RiMailSendLine className="size-4" />
            {t('Send email…')}
          </Button>
        </SelectionBar>
      ) : null}
    </MultiSelectionProvider>
  );
}
