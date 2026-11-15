import { Checkbox } from '@microrealestate/commonui/components/ui/checkbox';
import { TableHead } from '@microrealestate/commonui/components/ui/table';
import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { LuArrowDown, LuArrowUp } from 'react-icons/lu';
import {
  isAllSelected,
  SelectCheckbox,
  useMultiSelectionContext
} from '../MultiSelection';
import { type RentSort, type RentSortKey, rentKey } from './rentView';
import { SendEmailPopover, useSendEmailDisabledReason } from './SendEmailGate';
import type { MonthRent } from './types';

export function SortHeader({
  sortKey,
  sort,
  onSort,
  children,
  className
}: {
  sortKey: RentSortKey;
  sort: RentSort;
  onSort: (key: RentSortKey) => void;
  children: ReactNode;
  className?: string;
}) {
  const active = sort.key === sortKey;
  const Arrow = sort.direction === 1 ? LuArrowUp : LuArrowDown;
  let ariaSort: 'ascending' | 'descending' | undefined;
  if (active) {
    ariaSort = sort.direction === 1 ? 'ascending' : 'descending';
  }
  return (
    <TableHead className={className} aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 uppercase tracking-wide text-xs font-semibold',
          active ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {children}
        {active ? <Arrow className="size-3.5" aria-hidden="true" /> : null}
      </button>
    </TableHead>
  );
}

export function SelectAllCheckbox({
  selectableIds
}: {
  selectableIds: string[];
}) {
  const t = useTranslations('common');
  const { selected, setAll, clear } = useMultiSelectionContext();
  const allTicked = isAllSelected(selected, selectableIds);
  let checked: boolean | 'indeterminate' = allTicked;
  if (!allTicked && selected.size > 0) {
    checked = 'indeterminate';
  }
  return (
    <Checkbox
      checked={checked}
      disabled={selectableIds.length === 0}
      onCheckedChange={(value) =>
        value === true ? setAll(selectableIds) : clear()
      }
      aria-label={t('Select every tenant with an email address')}
    />
  );
}

export function RentCheckbox({ rent }: { rent: MonthRent }) {
  const reason = useSendEmailDisabledReason(rent);
  return (
    <SendEmailPopover reason={reason}>
      <SelectCheckbox
        id={rentKey(rent)}
        name={rent.occupant.name}
        disabled={!!reason}
      />
    </SendEmailPopover>
  );
}

export function TenantName({
  rent,
  onOpen,
  className
}: {
  rent: MonthRent;
  onOpen: (rent: MonthRent) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn('text-left text-base font-semibold', className)}
      onClick={() => onOpen(rent)}
    >
      {rent.occupant.name}
    </button>
  );
}
