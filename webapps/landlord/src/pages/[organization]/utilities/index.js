import { useEffect, useMemo, useState } from 'react';
import { LuExternalLink, LuSearch, LuWrench } from 'react-icons/lu';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { toast } from 'sonner';

import { withAuthentication } from '../../../components/Authentication';
import Page from '../../../components/Page';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { apiFetcher } from '../../../utils/fetch';

const DEFAULT_UTILITY_CATEGORIES = [
  'internet',
  'insurance',
  'gas',
  'water',
  'sewer',
  'power',
  'trash',
  'hoa',
  'landscaping',
  'other'
];

const CATEGORY_STORAGE_KEY_PREFIX = 'utilities-category-settings:';

function normalizeCategory(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getCurrentBillingMonth() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

function toCurrency(value) {
  const amount = Number(value || 0);
  return `$${amount.toFixed(2)}`;
}

function UtilitiesPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [billFile, setBillFile] = useState(null);
  const [customCategories, setCustomCategories] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [draft, setDraft] = useState({
    propertyId: '',
    type: 'water',
    customType: '',
    provider: '',
    billingMonth: getCurrentBillingMonth(),
    amount: '',
    dueDate: '',
    paidDate: '',
    notes: ''
  });

  const { data: properties = [], isLoading: loadingProperties } = useQuery({
    queryKey: ['utilities-properties'],
    queryFn: async () => {
      const response = await apiFetcher().get('/properties');
      return response.data || [];
    }
  });

  const utilitiesQuery = useQuery({
    queryKey: ['utilities-all'],
    queryFn: async () => {
      const response = await apiFetcher().get('/utilities');
      return response.data || [];
    }
  });

  const utilities = utilitiesQuery.data || [];
  const loadingUtilities = utilitiesQuery.isLoading;
  const isError = utilitiesQuery.isError;

  const organizationSlug = String(router.query.organization || 'default');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storageKey = `${CATEGORY_STORAGE_KEY_PREFIX}${organizationSlug}`;

    try {
      const storedValue = window.localStorage.getItem(storageKey);
      if (!storedValue) {
        setCustomCategories([]);
        setHiddenCategories([]);
        return;
      }

      const parsedValue = JSON.parse(storedValue);

      setCustomCategories(
        Array.isArray(parsedValue?.custom)
          ? parsedValue.custom
              .map((category) => normalizeCategory(category))
              .filter(Boolean)
          : []
      );
      setHiddenCategories(
        Array.isArray(parsedValue?.hidden)
          ? parsedValue.hidden
              .map((category) => normalizeCategory(category))
              .filter(Boolean)
          : []
      );
    } catch (error) {
      setCustomCategories([]);
      setHiddenCategories([]);
    }
  }, [organizationSlug]);

  const propertyById = useMemo(
    () =>
      (properties || []).reduce((acc, property) => {
        acc[String(property._id)] = property;
        return acc;
      }, {}),
    [properties]
  );

  const availableCategories = useMemo(() => {
    const typeSet = new Set();
    DEFAULT_UTILITY_CATEGORIES.forEach((type) => typeSet.add(type));
    utilities.forEach((utility) => {
      const normalizedType = normalizeCategory(utility?.type);
      if (normalizedType) {
        typeSet.add(normalizedType);
      }
    });
    customCategories.forEach((type) => {
      const normalizedType = normalizeCategory(type);
      if (normalizedType) {
        typeSet.add(normalizedType);
      }
    });

    hiddenCategories.forEach((type) => {
      typeSet.delete(normalizeCategory(type));
    });

    return Array.from(typeSet).sort((a, b) => a.localeCompare(b));
  }, [customCategories, hiddenCategories, utilities]);

  const createCategoryOptions = useMemo(() => {
    return [...availableCategories, 'custom'];
  }, [availableCategories]);

  const billingMonths = useMemo(() => {
    const monthSet = new Set();
    utilities.forEach((utility) => {
      if (utility?.billingMonth) {
        monthSet.add(String(utility.billingMonth));
      }
    });
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [utilities]);

  const providerSuggestions = useMemo(() => {
    const providerByNormalized = new Map();

    utilities.forEach((utility) => {
      const provider = String(utility?.provider || '').trim();
      if (!provider) {
        return;
      }

      const normalizedProvider = provider.toLowerCase();
      if (!providerByNormalized.has(normalizedProvider)) {
        providerByNormalized.set(normalizedProvider, provider);
      }
    });

    return Array.from(providerByNormalized.values()).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [utilities]);

  const filteredUtilities = useMemo(() => {
    const cleanedSearchText = searchText.trim().toLowerCase();
    return utilities.filter((utility) => {
      if (
        typeFilter !== 'all' &&
        normalizeCategory(utility.type) !== normalizeCategory(typeFilter)
      ) {
        return false;
      }

      if (monthFilter !== 'all' && utility.billingMonth !== monthFilter) {
        return false;
      }

      if (!cleanedSearchText) {
        return true;
      }

      const propertyName =
        propertyById[String(utility.propertyId)]?.name?.toLowerCase() || '';
      const provider = String(utility.provider || '').toLowerCase();
      const billingMonth = String(utility.billingMonth || '').toLowerCase();
      const notes = String(utility.notes || '').toLowerCase();
      const utilityType = String(utility.type || '').toLowerCase();

      return (
        propertyName.includes(cleanedSearchText) ||
        provider.includes(cleanedSearchText) ||
        billingMonth.includes(cleanedSearchText) ||
        notes.includes(cleanedSearchText) ||
        utilityType.includes(cleanedSearchText)
      );
    });
  }, [monthFilter, propertyById, searchText, typeFilter, utilities]);

  const totalAmount = useMemo(
    () =>
      filteredUtilities.reduce(
        (sum, utility) => sum + Number(utility.amount || 0),
        0
      ),
    [filteredUtilities]
  );

  const loading = loadingProperties || loadingUtilities;

  const handleCreateBill = async () => {
    const selectedType =
      draft.type === 'custom'
        ? draft.customType.trim().toLowerCase()
        : draft.type;

    if (!draft.propertyId) {
      toast.error(t('Property is required'));
      return;
    }

    if (!selectedType) {
      toast.error(t('Category is required'));
      return;
    }

    if (!draft.billingMonth) {
      toast.error(t('Billing month is required'));
      return;
    }

    const amount = Number(draft.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error(t('Amount must be a positive number'));
      return;
    }

    setSubmitting(true);
    try {
      let attachmentId = null;
      if (billFile) {
        const formData = new FormData();
        formData.append('file', billFile);
        formData.append('targetType', 'property');
        formData.append('targetId', draft.propertyId);
        formData.append('category', 'utility_bill');

        const uploadResponse = await apiFetcher().post(
          '/attachments',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
        attachmentId = uploadResponse.data?._id || null;
      }

      const payload = {
        propertyId: draft.propertyId,
        type: selectedType,
        provider: draft.provider,
        billingMonth: draft.billingMonth,
        amount,
        dueDate: draft.dueDate || null,
        paidDate: draft.paidDate || null,
        notes: draft.notes,
        splitMethod: 'equal',
        splitItems: [],
        attachmentIds: attachmentId ? [attachmentId] : []
      };

      await apiFetcher().post('/utilities', payload);
      toast.success(t('Utility bill added'));
      setBillFile(null);
      setDraft((prev) => ({
        ...prev,
        amount: '',
        provider: '',
        dueDate: '',
        paidDate: '',
        notes: '',
        customType: ''
      }));
      await utilitiesQuery.refetch();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || t('Failed to add utility bill')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page loading={loading} dataCy="utilitiesPage">
      <Card className="p-6 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <LuWrench className="size-5" />
            <h1 className="text-2xl font-bold">{t('Utilities')}</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredUtilities.length} {t('entry(ies)')} •{' '}
            {toCurrency(totalAmount)}
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="text-base font-semibold">{t('Add utility bill')}</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="text-xs text-muted-foreground">
                {t('Property')}
              </label>
              <select
                value={draft.propertyId}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    propertyId: event.target.value
                  }))
                }
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
              >
                <option value="">{t('Select property')}</option>
                {properties.map((property) => (
                  <option key={property._id} value={property._id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                {t('Category')}
              </label>
              <select
                value={draft.type}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, type: event.target.value }))
                }
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
              >
                {createCategoryOptions.map((type) => (
                  <option key={type} value={type}>
                    {type === 'custom' ? t('Custom category') : type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                {t('Billing month')}
              </label>
              <Input
                type="month"
                value={draft.billingMonth}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    billingMonth: event.target.value
                  }))
                }
              />
            </div>
            {draft.type === 'custom' ? (
              <div>
                <label className="text-xs text-muted-foreground">
                  {t('New category name')}
                </label>
                <Input
                  type="text"
                  placeholder={t('e.g. pest control')}
                  value={draft.customType}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      customType: event.target.value
                    }))
                  }
                />
              </div>
            ) : null}
            <div>
              <label className="text-xs text-muted-foreground">
                {t('Amount')}
              </label>
              <Input
                type="number"
                value={draft.amount}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, amount: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                {t('Provider')}
              </label>
              <Input
                type="text"
                value={draft.provider}
                list="utility-provider-options"
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    provider: event.target.value
                  }))
                }
              />
              <datalist id="utility-provider-options">
                {providerSuggestions.map((provider) => (
                  <option key={provider} value={provider} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                {t('Due date')}
              </label>
              <Input
                type="date"
                value={draft.dueDate}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, dueDate: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                {t('Paid date')}
              </label>
              <Input
                type="date"
                value={draft.paidDate}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    paidDate: event.target.value
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">
                {t('Notes')}
              </label>
              <Input
                type="text"
                value={draft.notes}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, notes: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                {t('Bill file')}
              </label>
              <Input
                type="file"
                onChange={(event) =>
                  setBillFile(event.target.files?.[0] || null)
                }
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreateBill} disabled={submitting}>
              {submitting ? t('Saving...') : t('Add bill')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('Search by property, type, provider, month...')}
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="pl-10"
            />
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="all">{t('All types')}</option>
              {availableCategories.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm bg-background"
            >
              <option value="all">{t('All months')}</option>
              {billingMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isError ? (
          <div className="text-sm text-red-600">
            {t('Failed to load utilities')}
          </div>
        ) : filteredUtilities.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            {t('No utilities found for current filters')}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUtilities.map((utility) => {
              const property = propertyById[String(utility.propertyId)];
              const propertyName = property?.name || t('Unknown property');

              return (
                <div
                  key={utility._id}
                  className="rounded-lg border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">
                      {utility.type} • {utility.billingMonth}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {propertyName}
                      {utility.provider ? ` • ${utility.provider}` : ''}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {utility.paidDate
                        ? `${t('Paid')} ${String(utility.paidDate).slice(0, 10)}`
                        : t('Not paid yet')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold">
                      {toCurrency(utility.amount)}
                    </div>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() =>
                        router.push(
                          `/${router.query.organization}/properties/${utility.propertyId}`
                        )
                      }
                    >
                      <LuExternalLink className="size-4" />
                      {t('Open property')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </Page>
  );
}

export default withAuthentication(UtilitiesPage);
