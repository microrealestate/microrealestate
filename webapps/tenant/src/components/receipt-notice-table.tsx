'use client';
import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader
} from '@microrealestate/commonui/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow
} from '@microrealestate/commonui/components/ui/table';
import type { DateRange } from '@microrealestate/shared';
import moment from 'moment';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { DownloadButton } from '@/components/download-button';
import type { Lease, Receipt } from '@/types';
import { getFormatTimeRange } from '@/utils';
import { getFormatNumber } from '@/utils/formatnumber';
import TermPicker from './term-picker';

const MIN_VISIBLE_RECEIPTS = 6;

function ReceiptDownloadCell({
  lease,
  receipt,
  documentType,
  available
}: {
  lease: Lease;
  receipt: Receipt;
  documentType: 'receipt' | 'rentnotice';
  available: boolean;
}) {
  return (
    <TableCell className="text-center">
      {available ? (
        <DownloadButton
          tenant={lease.tenant}
          receipt={receipt}
          documentType={documentType}
        />
      ) : null}
    </TableCell>
  );
}

export function ReceiptNoticeTable({ lease }: { lease: Lease }) {
  const t = useTranslations('common');
  const locale = useLocale();
  const [showFullList, setShowFullList] = useState(false);
  const [filter, setFilter] = useState<
    DateRange | { month?: number; year: number } | null
  >(() => {
    if (lease.timeRange === 'days' || lease.timeRange === 'weeks') {
      return null;
    }
    const year =
      lease.status !== 'active'
        ? (lease.terminationDate || lease.endDate)?.getFullYear()
        : new Date().getFullYear();
    return year ? { year } : null;
  });

  const filteredReceipts = useMemo(() => {
    if (!filter) {
      return lease.receipts;
    }

    if ('year' in filter) {
      return lease.receipts.filter((receipt) => {
        let match = false;
        const mTerm = moment(String(receipt.term), 'YYYYMMDDHH');
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
      return lease.receipts.filter((receipt) => {
        if (!filter.from) {
          return false;
        }
        const mTerm = moment(String(receipt.term), 'YYYYMMDDHH');
        return (
          mTerm.isSameOrAfter(filter.from) &&
          (!filter.to || mTerm.isSameOrBefore(filter.to))
        );
      });
    }

    return lease.receipts;
  }, [filter, lease.receipts]);

  const visibleReceipts = useMemo(() => {
    if (filteredReceipts.length <= MIN_VISIBLE_RECEIPTS) {
      return filteredReceipts;
    }
    return showFullList
      ? filteredReceipts
      : filteredReceipts.slice(0, MIN_VISIBLE_RECEIPTS);
  }, [showFullList, filteredReceipts]);

  const formatNumber = getFormatNumber(locale, lease.landlord.currency);
  const formatTimeRange = getFormatTimeRange(locale, lease.timeRange);

  const onTermChange = useCallback(
    (filter: DateRange | { month?: number; year: number } | undefined) => {
      setShowFullList(false);

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
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        {lease.beginDate ? (
          <div className="flex justify-end items-center gap-2">
            <TermPicker
              timeRange={lease.timeRange}
              fromDate={lease.beginDate}
              toDate={
                lease.status !== 'active'
                  ? (lease.terminationDate ?? lease.endDate ?? new Date())
                  : new Date()
              }
              onValueChange={onTermChange}
            />
          </div>
        ) : (
          <p className="font-medium">{t('Receipts')}</p>
        )}
      </CardHeader>
      <CardContent className="pt-4 px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="pl-6">{t('Period')}</TableCell>
              <TableCell className="text-right hidden sm:table-cell">
                {t('Rent')}
              </TableCell>
              <TableCell className="text-center hidden lg:table-cell">
                {t('Method')}
              </TableCell>
              <TableCell className="text-right hidden sm:table-cell">
                {t('Paid')}
              </TableCell>
              <TableCell className="text-center">{t('Notice')}</TableCell>
              <TableCell className="text-center">{t('Receipt')}</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleReceipts.map((receipt) => {
              const mTerm = moment(String(receipt.term), 'YYYYMMDDHH');
              const isNowTerm = mTerm.isSame(moment(), lease.timeRange);
              return (
                <TableRow
                  key={`${lease.tenant.id}_${receipt.id}`}
                  className="hover:bg-inherit"
                  data-cy={`receipt-row-${receipt.id}`}
                >
                  <TableCell className="pl-6 sm:uppercase">
                    <span>{formatTimeRange(receipt.term)}</span>
                    <span className="block text-xs text-muted-foreground sm:hidden">
                      {formatNumber({ value: receipt.grandTotal })}
                      {receipt.payment > 0 &&
                        ` · ${t('{amount} paid', { amount: formatNumber({ value: receipt.payment }) })}`}
                    </span>
                  </TableCell>
                  <TableCell
                    className="text-right hidden sm:table-cell"
                    data-cy="receipt-rent"
                    data-cy-amount={receipt.grandTotal}
                  >
                    {formatNumber({ value: receipt.grandTotal })}
                  </TableCell>
                  <TableCell className="text-center hidden lg:table-cell">
                    {[...new Set(receipt.methods)]
                      .map((method) => t(method))
                      .join(', ')}
                  </TableCell>
                  <TableCell
                    className="text-right hidden sm:table-cell"
                    data-cy="receipt-paid"
                    data-cy-amount={receipt.payment}
                  >
                    {!isNowTerm || receipt.payment > 0
                      ? formatNumber({ value: receipt.payment })
                      : ''}
                  </TableCell>
                  <ReceiptDownloadCell
                    lease={lease}
                    receipt={receipt}
                    documentType="rentnotice"
                    available={!isNowTerm || receipt.status !== 'unpaid'}
                  />
                  <ReceiptDownloadCell
                    lease={lease}
                    receipt={receipt}
                    documentType="receipt"
                    available={!isNowTerm || receipt.status !== 'unpaid'}
                  />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filteredReceipts.length > MIN_VISIBLE_RECEIPTS && (
          <div className="p-4 pt-2">
            <Button
              variant="secondary"
              className="w-full text-sm"
              onClick={() => setShowFullList(!showFullList)}
            >
              {showFullList ? t('Show less') : t('Show more')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
