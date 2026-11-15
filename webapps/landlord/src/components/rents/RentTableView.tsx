import { Card } from '@microrealestate/commonui/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@microrealestate/commonui/components/ui/table';
import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import { LuChevronRight } from 'react-icons/lu';
import { useMultiSelectionContext } from '../MultiSelection';
import {
  LeftToPay,
  Money,
  RentEmailSummary,
  RentProgress,
  RentStatusBadge,
  useRentPropertySummary
} from './RentCells';
import {
  RentCheckbox,
  SelectAllCheckbox,
  SortHeader,
  TenantName
} from './RentTableParts';
import { rentKey } from './rentView';
import type { RentTableViewProps } from './types';

const AMOUNT_HEAD = 'w-px text-right text-xs uppercase tracking-wide';
const TEXT_CELL = 'align-baseline';
const AMOUNT_CELL = cn(TEXT_CELL, 'text-right whitespace-nowrap');

export default function RentTableView({
  rents,
  selectableIds,
  canSelect,
  sort,
  onSort,
  onDetails
}: RentTableViewProps) {
  const t = useTranslations('common');
  const propertySummary = useRentPropertySummary();
  const { selected } = useMultiSelectionContext();
  const firstColumnPadding = canSelect ? '' : 'pl-4';

  return (
    <Card className="@container p-0 overflow-x-auto">
      <Table className="w-full">
        <TableHeader>
          <TableRow className="text-nowrap hover:bg-transparent">
            {canSelect ? (
              <TableHead className="w-11 pl-4">
                <SelectAllCheckbox selectableIds={selectableIds} />
              </TableHead>
            ) : null}
            <SortHeader
              sortKey="tenant"
              sort={sort}
              onSort={onSort}
              className={cn('min-w-48', firstColumnPadding)}
            >
              {t('Tenant')}
            </SortHeader>
            <TableHead className={AMOUNT_HEAD}>{t('Rent due')}</TableHead>
            <TableHead className={AMOUNT_HEAD}>{t('Paid')}</TableHead>
            <SortHeader
              sortKey="left"
              sort={sort}
              onSort={onSort}
              className="w-px text-right"
            >
              {t('Left to pay')}
            </SortHeader>
            <SortHeader
              sortKey="status"
              sort={sort}
              onSort={onSort}
              className="hidden w-44 @4xl:table-cell"
            >
              {t('Status')}
            </SortHeader>
            <TableHead className="w-8" aria-hidden="true" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rents.map((rent) => {
            const key = rentKey(rent);
            const isSelected = selected.has(key);
            return (
              <TableRow
                key={key}
                className={cn('cursor-pointer', isSelected && 'bg-primary/5')}
                onClick={() => onDetails(rent)}
              >
                {canSelect ? (
                  <TableCell
                    className="pl-4 align-top"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="mt-1">
                      <RentCheckbox rent={rent} />
                    </div>
                  </TableCell>
                ) : null}
                <TableCell className={cn(TEXT_CELL, firstColumnPadding)}>
                  <TenantName
                    rent={rent}
                    onOpen={onDetails}
                    className="hover:underline"
                  />
                  <div className="line-clamp-2 text-sm text-muted-foreground">
                    {propertySummary(rent)}
                  </div>
                  <RentEmailSummary rent={rent} />
                  <div className="mt-1.5 @4xl:hidden">
                    <RentStatusBadge rent={rent} />
                    <RentProgress rent={rent} className="mt-2 w-28" />
                  </div>
                </TableCell>
                <TableCell
                  className={AMOUNT_CELL}
                  data-cy="rent-due"
                  data-cy-amount={rent.totalAmount}
                >
                  <Money
                    value={Math.max(0, rent.totalAmount)}
                    className={
                      rent.totalAmount <= 0
                        ? 'text-muted-foreground'
                        : undefined
                    }
                  />
                </TableCell>
                <TableCell
                  className={AMOUNT_CELL}
                  data-cy="rent-payment"
                  data-cy-amount={rent.payment}
                >
                  <Money value={rent.payment} />
                </TableCell>
                <TableCell className={cn(TEXT_CELL, 'text-right')}>
                  <LeftToPay
                    rent={rent}
                    layout="stacked"
                    className="text-base"
                  />
                </TableCell>
                <TableCell className={cn(TEXT_CELL, 'hidden @4xl:table-cell')}>
                  <RentStatusBadge rent={rent} />
                  <RentProgress rent={rent} className="mt-2 w-28" />
                </TableCell>
                <TableCell className="w-8 pr-3">
                  <LuChevronRight
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
