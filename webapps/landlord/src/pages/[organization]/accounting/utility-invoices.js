import {
  LuBanknote,
  LuCheckCircle,
  LuCircle,
  LuLoader,
  LuSend,
  LuX
} from 'react-icons/lu';
import { useCallback, useContext, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import { apiFetcher } from '../../../utils/fetch';
import { toast } from 'sonner';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  outstanding: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  void: 'bg-red-100 text-red-700'
};

function toCurrency(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

function InvoiceRow({ invoice, onSend, onMarkPaid, onVoid, t }) {
  const [showPayForm, setShowPayForm] = useState(false);
  const [payMethod, setPayMethod] = useState('');
  const [payRef, setPayRef] = useState('');

  return (
    <div className="rounded-lg border p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {invoice.invoiceNumber}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[invoice.status] || ''}`}
          >
            {t(invoice.status)}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {invoice.occupantEmail} • {invoice.billingMonth}
        </div>
        <div className="text-sm font-semibold">{toCurrency(invoice.invoiceAmount)}</div>
        {invoice.paidAt ? (
          <div className="text-xs text-green-600">
            {t('Paid')} {String(invoice.paidAt).slice(0, 10)}
            {invoice.paymentMethod ? ` • ${invoice.paymentMethod}` : ''}
            {invoice.paymentReference ? ` • ${invoice.paymentReference}` : ''}
          </div>
        ) : null}
        {invoice.sentAt ? (
          <div className="text-xs text-muted-foreground">
            {t('Sent')} {String(invoice.sentAt).slice(0, 10)}
            {invoice.sentBy ? ` ${t('by')} ${invoice.sentBy}` : ''}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        {['draft', 'outstanding'].includes(invoice.status) ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => onSend(invoice._id)}
          >
            <LuSend className="size-3" />
            {invoice.status === 'draft' ? t('Mark Sent') : t('Re-send')}
          </Button>
        ) : null}

        {invoice.status === 'outstanding' && !showPayForm ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setShowPayForm(true)}
          >
            <LuBanknote className="size-3" />
            {t('Mark Paid')}
          </Button>
        ) : null}

        {showPayForm ? (
          <div className="flex flex-col gap-1 mt-1 w-full sm:w-56">
            <input
              className="border rounded px-2 py-1 text-xs"
              placeholder={t('Payment method (check, wire…)')}
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
            />
            <input
              className="border rounded px-2 py-1 text-xs"
              placeholder={t('Reference # (optional)')}
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                className="gap-1 flex-1"
                onClick={() => {
                  onMarkPaid(invoice._id, payMethod, payRef);
                  setShowPayForm(false);
                }}
              >
                <LuCheckCircle className="size-3" />
                {t('Confirm')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPayForm(false)}
              >
                <LuX className="size-3" />
              </Button>
            </div>
          </div>
        ) : null}

        {!['paid', 'void'].includes(invoice.status) ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 gap-1"
            onClick={() => onVoid(invoice._id)}
          >
            <LuCircle className="size-3" />
            {t('Void')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function UtilityInvoices() {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['utility-invoices'],
    queryFn: async () => {
      const response = await apiFetcher().get('/utility-invoices');
      return response.data || [];
    }
  });

  const { data: summary = [] } = useQuery({
    queryKey: ['utility-invoices-outstanding-summary'],
    queryFn: async () => {
      const response = await apiFetcher().get('/utility-invoices/outstanding-summary');
      return response.data || [];
    }
  });

  const sendMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const response = await apiFetcher().post(`/utility-invoices/${invoiceId}/send`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['utility-invoices']);
      queryClient.invalidateQueries(['utility-invoices-outstanding-summary']);
      toast.success(t('Invoice marked as sent'));
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || t('Failed to send invoice'));
    }
  });

  const payMutation = useMutation({
    mutationFn: async ({ invoiceId, paymentMethod, paymentReference }) => {
      const response = await apiFetcher().put(`/utility-invoices/${invoiceId}/pay`, {
        paymentMethod,
        paymentReference
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['utility-invoices']);
      queryClient.invalidateQueries(['utility-invoices-outstanding-summary']);
      toast.success(t('Invoice marked as paid'));
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || t('Failed to mark invoice paid'));
    }
  });

  const voidMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const response = await apiFetcher().post(`/utility-invoices/${invoiceId}/void`, {
        reason: ''
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['utility-invoices']);
      queryClient.invalidateQueries(['utility-invoices-outstanding-summary']);
      toast.success(t('Invoice voided'));
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || t('Failed to void invoice'));
    }
  });

  const handleSend = useCallback(
    (invoiceId) => sendMutation.mutate(invoiceId),
    [sendMutation]
  );

  const handleMarkPaid = useCallback(
    (invoiceId, paymentMethod, paymentReference) =>
      payMutation.mutate({ invoiceId, paymentMethod, paymentReference }),
    [payMutation]
  );

  const handleVoid = useCallback(
    (invoiceId) => voidMutation.mutate(invoiceId),
    [voidMutation]
  );

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return invoices;
    return invoices.filter((inv) => inv.status === statusFilter);
  }, [invoices, statusFilter]);

  const totalOutstanding = useMemo(
    () => summary.reduce((sum, group) => sum + (group.totalOutstanding || 0), 0),
    [summary]
  );

  const statusOptions = ['all', 'draft', 'outstanding', 'sent', 'paid', 'void'];

  return (
    <Page>
      <div className="p-4 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">{t('Utility Invoices')}</h1>

        {summary.length > 0 ? (
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">
              {t('Outstanding Summary')} — {toCurrency(totalOutstanding)}{' '}
              {t('total')}
            </h2>
            <div className="space-y-2">
              {summary.map((group) => (
                <div
                  key={group.occupantId}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-muted-foreground">
                    {group.occupantEmail}
                  </span>
                  <span className="font-semibold text-orange-600">
                    {toCurrency(group.totalOutstanding)} ({group.invoiceCount}{' '}
                    {t('invoices')})
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {statusOptions.map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {t(s === 'all' ? 'All' : s)}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LuLoader className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            {t('No invoices found')}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((invoice) => (
              <InvoiceRow
                key={invoice._id}
                invoice={invoice}
                onSend={handleSend}
                onMarkPaid={handleMarkPaid}
                onVoid={handleVoid}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}

export default withAuthentication(UtilityInvoices);
