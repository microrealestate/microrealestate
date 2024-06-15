'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './ui/tooltip';
import { useCallback, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { DateRange } from 'react-day-picker';
import { Download } from 'lucide-react';
import { DownLoadButton } from '@/components/download-button';
import getEnv from '@/utils/env/client';
import { getFormatNumber } from '@/utils/formatnumber';
import { getFormatTimeRange } from '@/utils';
import { Label } from '@/components/ui/label';
import type { Lease } from '@/types';
import moment from 'moment';
import { StatusBadge } from '@/components/ui/status-badge';
import TermPicker from './term-picker';
import useTranslation from '@/utils/i18n/client/useTranslation';

const MIN_VISIBLE_INVOICES = 6;

export function InvoiceTable({ lease }: { lease: Lease }) {
  const { locale, t } = useTranslation();
  const [showFullList, setShowFullList] = useState(false);
  const [filter, setFilter] = useState<
    DateRange | { month?: number; year: number } | null
  >();

  const filteredInvoices = useMemo(() => {
    if (!filter) {
      return lease.invoices;
    }

    if ('year' in filter) {
      return lease.invoices.filter((invoice) => {
        let match = false;
        const mTerm = moment(String(invoice.term), 'YYYYMMDDHH');
        if (filter.month !== undefined && filter.month >= 0) {
          if (mTerm.month() === filter.month && mTerm.year() === filter.year) {
            match = true;
          }
        } else if (mTerm.year() === filter.year) {
          match = true;
        }
        return match;
      });
    }

    if ('from' in filter) {
      return lease.invoices.filter((invoice) => {
        let match = false;
        const mTerm = moment(String(invoice.term), 'YYYYMMDDHH');
        if (filter.from && filter.to) {
          if (
            mTerm.isSameOrAfter(filter.from) &&
            mTerm.isSameOrBefore(filter.to)
          ) {
            match = true;
          }
        }
        return match;
      });
    }

    return lease.invoices;
  }, [filter, lease.invoices]);

  const visibleInvoices = useMemo(() => {
    if (filteredInvoices.length <= MIN_VISIBLE_INVOICES) {
      return filteredInvoices;
    }
    return showFullList
      ? filteredInvoices
      : filteredInvoices.slice(0, MIN_VISIBLE_INVOICES);
  }, [showFullList, filteredInvoices]);

  const formatNumber = getFormatNumber(locale, lease.landlord.currency);
  const formatTimeRange = getFormatTimeRange(locale, lease.timeRange);

  const onTermChange = useCallback(
    (filter: DateRange | { month?: number; year: number } | undefined) => {
      if (!filter) {
        return setFilter(null);
      }

      if ('year' in filter) {
        return setFilter(filter);
      }

      if ('from' in filter) {
        return setFilter(filter);
      }

      setFilter(null);
    },
    []
  );

  return (
    <div className="flex flex-col gap-2">
      {lease.beginDate ? (
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
          <Label>{t('Invoices')}</Label>
          <TermPicker
            timeRange={lease.timeRange}
            fromDate={lease.beginDate}
            toDate={new Date()}
            onValueChange={onTermChange}
          />
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>{t('Term')}</TableCell>
            <TableCell className="text-right hidden sm:table-cell">
              {t('Rent')}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {t('Status')}
            </TableCell>
            <TableCell className="text-center hidden lg:table-cell">
              {t('Method')}
            </TableCell>
            <TableCell className="text-right hidden sm:table-cell">
              {t('Paid')}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleInvoices.map((invoice) => {
            const mTerm = moment(String(invoice.term), 'YYYYMMDDHH');
            const isNowTerm = mTerm.isSame(moment(), lease.timeRange);
            return (
              <TableRow
                key={`${lease.tenant.id}_${invoice.id}`}
                className="hover:bg-inherit"
              >
                <TableCell className="sm:uppercase">
                  {formatTimeRange(invoice.term)}
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  {formatNumber({ value: invoice.grandTotal })}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {!isNowTerm ? (
                    invoice.status === 'paid' ? (
                      <StatusBadge variant="success">
                        {t(invoice.status)}
                      </StatusBadge>
                    ) : (
                      <StatusBadge variant="warning">
                        {t('overdue')}
                      </StatusBadge>
                    )
                  ) : invoice.status !== 'unpaid' ? (
                    <StatusBadge variant="success">
                      {t(invoice.status)}
                    </StatusBadge>
                  ) : null}
                </TableCell>
                <TableCell className="text-center hidden lg:table-cell">
                  {invoice.methods
                    .reduce<string[]>((acc, method) => {
                      if (!acc.includes(method)) {
                        acc.push(method);
                      }
                      return acc;
                    }, [])
                    .map((method) => t(method))
                    .join(', ')}
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  {!isNowTerm
                    ? formatNumber({ value: invoice.payment })
                    : invoice.payment > 0
                      ? formatNumber({ value: invoice.payment })
                      : ''}
                </TableCell>
                <TableCell className="w-5">
                  {getEnv('DEMO_MODE') === 'true' ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Download className="h-4 w-4 text-ring" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {t('Download only available in production mode')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (isNowTerm && invoice.status === 'paid') || !isNowTerm ? (
                    <DownLoadButton tenant={lease.tenant} invoice={invoice} />
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {filteredInvoices.length > MIN_VISIBLE_INVOICES && (
        <Button
          variant="secondary"
          className="text-sm"
          onClick={() => setShowFullList(!showFullList)}
        >
          {showFullList ? t('Show less') : t('Show more')}
        </Button>
      )}
    </div>
  );
}
