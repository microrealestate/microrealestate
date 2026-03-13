import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetcher } from '../../utils/fetch';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { LuExternalLink } from 'react-icons/lu';
import { toast } from 'sonner';
import { useRouter } from 'next/router';

function toCurrency(value) {
  const amount = Number(value || 0);
  return `$${amount.toFixed(2)}`;
}

export default function PropertyUtilitiesPanel({ property, childUnits = [] }) {
  const router = useRouter();
  const propertyId = property?._id;
  const [utilities, setUtilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const organizationSlug = String(router.query.organization || '');

  const units = useMemo(() => childUnits || [], [childUnits]);

  const fetchUtilities = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const response = await apiFetcher().get('/utilities', {
        params: { propertyId }
      });
      setUtilities(response.data || []);
    } catch (error) {
      toast.error('Failed to load utilities');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchUtilities();
  }, [fetchUtilities]);

  const handleDownloadAttachment = async (attachmentId, filename) => {
    try {
      const response = await apiFetcher().get(
        `/attachments/${attachmentId}/download`,
        {
          responseType: 'blob'
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || 'utility-bill');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download utility bill');
    }
  };

  const totals = useMemo(() => {
    const totalAmount = utilities.reduce(
      (sum, utility) => sum + Number(utility.amount || 0),
      0
    );
    const paidCount = utilities.filter((utility) =>
      Boolean(utility.paidDate)
    ).length;
    const unpaidCount = utilities.length - paidCount;

    return {
      totalAmount,
      paidCount,
      unpaidCount
    };
  }, [utilities]);

  const typeTotals = useMemo(() => {
    const amountByType = new Map();

    utilities.forEach((utility) => {
      const type = String(utility?.type || 'other');
      amountByType.set(
        type,
        Number(amountByType.get(type) || 0) + Number(utility.amount || 0)
      );
    });

    return Array.from(amountByType.entries())
      .map(([type, amount]) => ({ type, amount }))
      .sort((left, right) => right.amount - left.amount);
  }, [utilities]);

  const recentUtilities = useMemo(() => {
    return [...utilities]
      .sort((left, right) => {
        const leftDate = new Date(
          left.updatedAt || left.createdAt || left.paidDate || 0
        ).getTime();
        const rightDate = new Date(
          right.updatedAt || right.createdAt || right.paidDate || 0
        ).getTime();
        return rightDate - leftDate;
      })
      .slice(0, 8);
  }, [utilities]);

  const renderAllocationPreview = (utility) => {
    const amount = Number(utility.amount || 0);
    const splitItems = utility.splitItems || [];

    if (!splitItems.length) {
      return (
        <div className="text-xs text-muted-foreground">
          No split configured.
        </div>
      );
    }

    if (utility.splitMethod === 'equal') {
      const eachShare = splitItems.length ? amount / splitItems.length : 0;
      const vacantShares = splitItems.filter((item) => {
        const unit = units.find((u) => u._id === item.subPropertyId);
        return unit?.status === 'vacant';
      }).length;

      return (
        <div className="text-xs text-muted-foreground">
          Equal split: {toCurrency(eachShare)} each. Owner covers {vacantShares}{' '}
          vacant share(s).
        </div>
      );
    }

    const ownerShare = Math.max(
      0,
      amount -
        splitItems.reduce(
          (sum, item) => sum + (amount * Number(item.percentage || 0)) / 100,
          0
        )
    );

    return (
      <div className="text-xs text-muted-foreground">
        Percentage split configured. Owner remainder: {toCurrency(ownerShare)}.
      </div>
    );
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Utilities report</h3>
          <p className="text-xs text-muted-foreground">
            Utility entry is now managed from the Utilities menu to keep billing
            in one place.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => router.push(`/${organizationSlug}/utilities`)}
          disabled={!organizationSlug}
        >
          <LuExternalLink className="size-4" />
          Open Utilities
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded border p-3">
          <div className="text-xs text-muted-foreground">Bills</div>
          <div className="text-lg font-semibold">{utilities.length}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-xs text-muted-foreground">Total amount</div>
          <div className="text-lg font-semibold">
            {toCurrency(totals.totalAmount)}
          </div>
        </div>
        <div className="rounded border p-3">
          <div className="text-xs text-muted-foreground">Status</div>
          <div className="text-sm">
            {totals.paidCount} paid • {totals.unpaidCount} unpaid
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold">By category</h4>
        {!typeTotals.length ? (
          <div className="text-sm text-muted-foreground">No data yet.</div>
        ) : (
          typeTotals.map((item) => (
            <div
              key={item.type}
              className="flex items-center justify-between rounded border px-3 py-2"
            >
              <span className="text-sm">{item.type}</span>
              <span className="text-sm font-medium">
                {toCurrency(item.amount)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t space-y-2">
        <h4 className="text-sm font-semibold">Recent bills</h4>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : !recentUtilities.length ? (
          <div className="text-sm text-muted-foreground">
            No utility bills yet.
          </div>
        ) : (
          recentUtilities.map((utility) => (
            <div key={utility._id} className="rounded border p-3 space-y-1">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="text-sm font-medium">
                    {utility.type} • {utility.billingMonth}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {utility.provider || 'No provider'}
                    {utility.accountNumber ? ` • ${utility.accountNumber}` : ''}
                  </div>
                </div>
                <div className="text-sm font-semibold">
                  {toCurrency(utility.amount)}
                </div>
              </div>
              {renderAllocationPreview(utility)}
              <div className="text-xs text-muted-foreground">
                {utility.paidDate
                  ? `Paid ${utility.paidDate.slice(0, 10)}`
                  : 'Not paid yet'}
              </div>
              {utility.attachmentIds?.length ? (
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() =>
                    handleDownloadAttachment(
                      utility.attachmentIds[0],
                      `${utility.type}-${utility.billingMonth}-bill`
                    )
                  }
                >
                  Download bill
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
