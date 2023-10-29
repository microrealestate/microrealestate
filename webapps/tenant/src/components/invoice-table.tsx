import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DownLoadButton } from '@/components/download-button';
import { getFormatNumber } from '@/utils/formatnumber/server/getFormatNumber';
import getTranslation from '@/utils/i18n/server/getTranslation';
import type { Invoice } from '@/types';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';

export async function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  const { t } = await getTranslation();
  const formatNumber = await getFormatNumber();

  return (
    <div className="flex flex-col gap-2">
      <Label>{t('Invoices')}</Label>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>{t('Invoice')}</TableCell>
            <TableCell>{t('Status')}</TableCell>
            <TableCell>{t('Method')}</TableCell>
            <TableCell className="text-right">{t('Amount')}</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="hover:bg-inherit">
              <TableCell>{invoice.term}</TableCell>
              <TableCell>
                {invoice.status === 'paid' ? (
                  <StatusBadge variant="success">{t('Paid')}</StatusBadge>
                ) : (
                  <StatusBadge variant="warning">{t('Unpaid')}</StatusBadge>
                )}
              </TableCell>
              <TableCell>{t(invoice.method)}</TableCell>
              <TableCell className="text-right">
                {formatNumber({ value: invoice.amount })}
              </TableCell>
              <TableCell className="w-5">
                <DownLoadButton />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
