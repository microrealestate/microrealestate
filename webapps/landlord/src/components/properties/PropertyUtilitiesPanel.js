import { apiFetcher } from '../../utils/fetch';
import { Card } from '../ui/card';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const utilityTypes = [
  'internet',
  'insurance',
  'gas',
  'water',
  'sewer',
  'power',
  'other'
];

function getCurrentMonth() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

function toCurrency(value) {
  const amount = Number(value || 0);
  return `$${amount.toFixed(2)}`;
}

export default function PropertyUtilitiesPanel({ property, childUnits = [] }) {
  const propertyId = property?._id;
  const [utilities, setUtilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [billFile, setBillFile] = useState(null);
  const [draft, setDraft] = useState({
    type: 'water',
    provider: '',
    accountNumber: '',
    billingMonth: getCurrentMonth(),
    amount: '',
    dueDate: '',
    paidDate: '',
    notes: '',
    splitMethod: 'equal',
    splitItems: []
  });

  const units = useMemo(() => childUnits || [], [childUnits]);

  useEffect(() => {
    setDraft((previous) => ({
      ...previous,
      splitItems: units.map((unit) => ({
        subPropertyId: unit._id,
        splitType: previous.splitMethod,
        percentage:
          previous.splitMethod === 'percentage' && units.length
            ? Number((100 / units.length).toFixed(2))
            : undefined
      }))
    }));
  }, [units.length]);

  const fetchUtilities = async () => {
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
  };

  useEffect(() => {
    fetchUtilities();
  }, [propertyId]);

  const uploadBill = async () => {
    if (!billFile || !propertyId) return null;

    const formData = new FormData();
    formData.append('file', billFile);
    formData.append('targetType', 'property');
    formData.append('targetId', propertyId);
    formData.append('category', 'utility_bill');

    const response = await apiFetcher().post('/attachments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data?._id || null;
  };

  const handleCreate = async () => {
    if (!draft.amount || Number(draft.amount) < 0) {
      toast.error('Amount is required');
      return;
    }

    try {
      const attachmentId = await uploadBill();
      const payload = {
        ...draft,
        amount: Number(draft.amount),
        splitItems: (draft.splitItems || []).map((item) => ({
          ...item,
          splitType: draft.splitMethod
        })),
        attachmentIds: attachmentId ? [attachmentId] : []
      };

      await apiFetcher().post('/utilities', payload);
      toast.success('Utility bill saved');
      setBillFile(null);
      setDraft((previous) => ({
        ...previous,
        amount: '',
        notes: ''
      }));
      fetchUtilities();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || 'Failed to save utility bill'
      );
    }
  };

  const handleDelete = async (utilityId) => {
    try {
      await apiFetcher().delete(`/utilities/${utilityId}`);
      setUtilities((prev) => prev.filter((item) => item._id !== utilityId));
      toast.success('Utility entry removed');
    } catch (error) {
      toast.error('Failed to remove utility entry');
    }
  };

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

  const updateSplitPercentage = (subPropertyId, value) => {
    const parsedValue = Number(value);
    setDraft((previous) => ({
      ...previous,
      splitItems: previous.splitItems.map((item) =>
        item.subPropertyId === subPropertyId
          ? {
              ...item,
              percentage: Number.isFinite(parsedValue) ? parsedValue : 0
            }
          : item
      )
    }));
  };

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
      <h3 className="text-sm font-semibold">Utilities & expense tracking</h3>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground">Type</label>
          <select
            value={draft.type}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, type: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded bg-background text-foreground"
          >
            {utilityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Billing month</label>
          <input
            type="month"
            value={draft.billingMonth}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, billingMonth: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded bg-background text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Provider</label>
          <input
            type="text"
            value={draft.provider}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, provider: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded bg-background text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">
            Account number
          </label>
          <input
            type="text"
            value={draft.accountNumber}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, accountNumber: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded bg-background text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Amount</label>
          <input
            type="number"
            value={draft.amount}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, amount: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded bg-background text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Due date</label>
          <input
            type="date"
            value={draft.dueDate}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, dueDate: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded bg-background text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Paid date</label>
          <input
            type="date"
            value={draft.paidDate}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, paidDate: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded bg-background text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">
            Bill file (optional)
          </label>
          <input
            type="file"
            onChange={(e) => setBillFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Split method</label>
        <div className="flex gap-2">
          <button
            type="button"
            className={`px-3 py-1.5 border rounded text-sm ${draft.splitMethod === 'equal' ? 'bg-muted' : ''}`}
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                splitMethod: 'equal',
                splitItems: (prev.splitItems || []).map((item) => ({
                  ...item,
                  splitType: 'equal',
                  percentage: undefined
                }))
              }))
            }
          >
            Equal
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 border rounded text-sm ${draft.splitMethod === 'percentage' ? 'bg-muted' : ''}`}
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                splitMethod: 'percentage',
                splitItems: (prev.splitItems || []).map((item) => ({
                  ...item,
                  splitType: 'percentage',
                  percentage:
                    item.percentage ??
                    (units.length ? Number((100 / units.length).toFixed(2)) : 0)
                }))
              }))
            }
          >
            Percentage
          </button>
        </div>

        {draft.splitMethod === 'percentage' &&
          (draft.splitItems || []).length > 0 && (
            <div className="rounded border p-3 space-y-2">
              {draft.splitItems.map((item) => {
                const unit = units.find((u) => u._id === item.subPropertyId);
                return (
                  <div
                    key={item.subPropertyId}
                    className="grid grid-cols-2 gap-2 items-center"
                  >
                    <div className="text-sm">
                      {unit?.name || item.subPropertyId}
                      {unit?.status === 'vacant' ? ' (vacant)' : ''}
                    </div>
                    <input
                      type="number"
                      value={item.percentage ?? 0}
                      onChange={(e) =>
                        updateSplitPercentage(
                          item.subPropertyId,
                          e.target.value
                        )
                      }
                      className="w-full px-2 py-1 border rounded bg-background text-foreground"
                      min="0"
                      max="100"
                    />
                  </div>
                );
              })}
            </div>
          )}
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Notes</label>
        <textarea
          rows={3}
          value={draft.notes}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, notes: e.target.value }))
          }
          className="w-full px-3 py-2 border rounded bg-background text-foreground"
        />
      </div>

      <button
        type="button"
        onClick={handleCreate}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
      >
        Save utility bill
      </button>

      <div className="pt-2 border-t space-y-2">
        <h4 className="text-sm font-semibold">History</h4>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : !utilities.length ? (
          <div className="text-sm text-muted-foreground">
            No utility bills yet.
          </div>
        ) : (
          utilities.map((utility) => (
            <div key={utility._id} className="rounded border p-3 space-y-1">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="text-sm font-medium">
                    {utility.type} • {utility.billingMonth}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {utility.provider || 'No provider'}
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
              <button
                type="button"
                className="text-xs text-red-600 hover:text-red-700"
                onClick={() => handleDelete(utility._id)}
              >
                Delete entry
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
