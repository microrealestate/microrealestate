import { FaDroplet, FaFaucet } from 'react-icons/fa6';
import { LuExternalLink, LuPlus, LuSearch, LuTrash2 } from 'react-icons/lu';
import { useEffect, useMemo, useState } from 'react';
import { apiFetcher } from '../../../utils/fetch';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import Page from '../../../components/Page';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

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

function getPropertyLabel(property, propertyById) {
  if (!property) {
    return '';
  }

  const parentProperty = property.parentPropertyId
    ? propertyById[String(property.parentPropertyId)]
    : null;

  if (!parentProperty) {
    return property.name || 'Unnamed property';
  }

  return `${parentProperty.name} / ${property.name}`;
}

function getInitialAccountDraft() {
  return {
    id: '',
    type: 'water',
    customType: '',
    provider: '',
    accountNumber: '',
    notes: '',
    allocations: [{ propertyId: '', percentage: '' }]
  };
}

function getInitialBillDraft() {
  return {
    utilityAccountId: '',
    propertyId: '',
    type: 'water',
    customType: '',
    provider: '',
    accountNumber: '',
    billingMonth: getCurrentBillingMonth(),
    amount: '',
    dueDate: '',
    paidDate: '',
    notes: ''
  };
}

function getSelectedTypeValue(type, customType) {
  return type === 'custom'
    ? normalizeCategory(customType)
    : normalizeCategory(type);
}

function getCategoryDraftValue(category, categoryOptions) {
  const normalizedCategory = normalizeCategory(category);

  if (categoryOptions.includes(normalizedCategory)) {
    return {
      type: normalizedCategory,
      customType: ''
    };
  }

  return {
    type: 'custom',
    customType: normalizedCategory
  };
}

function sumAllocationPercentages(allocations) {
  return allocations.reduce(
    (sum, allocation) => sum + (Number(allocation.percentage) || 0),
    0
  );
}

function formatPercentage(value) {
  const parsed = Number(value || 0);
  return `${parsed.toFixed(2)}%`;
}

function UtilitiesHeaderIcon() {
  return (
    <span className="relative inline-flex size-5 items-center justify-center">
      <FaFaucet className="size-full text-muted-foreground" />
      <FaDroplet className="absolute right-[-3px] top-[94%] size-2 text-sky-500" />
    </span>
  );
}

function UtilitiesPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [billFile, setBillFile] = useState(null);
  const [customCategories, setCustomCategories] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [utilitiesTab, setUtilitiesTab] = useState('bills');
  const [accountDraft, setAccountDraft] = useState(getInitialAccountDraft());
  const [billDraft, setBillDraft] = useState(getInitialBillDraft());

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

  const utilityAccountsQuery = useQuery({
    queryKey: ['utility-accounts'],
    queryFn: async () => {
      const response = await apiFetcher().get('/utility-accounts');
      return response.data || [];
    }
  });

  const utilities = useMemo(
    () => utilitiesQuery.data || [],
    [utilitiesQuery.data]
  );
  const utilityAccounts = useMemo(
    () => utilityAccountsQuery.data || [],
    [utilityAccountsQuery.data]
  );
  const loadingUtilities = utilitiesQuery.isLoading;
  const loadingUtilityAccounts = utilityAccountsQuery.isLoading;
  const isError = utilitiesQuery.isError || utilityAccountsQuery.isError;

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

  const propertyOptions = useMemo(() => {
    return [...properties].sort((left, right) =>
      getPropertyLabel(left, propertyById).localeCompare(
        getPropertyLabel(right, propertyById)
      )
    );
  }, [properties, propertyById]);

  const availableCategories = useMemo(() => {
    const typeSet = new Set();

    DEFAULT_UTILITY_CATEGORIES.forEach((type) => typeSet.add(type));
    utilities.forEach((utility) => {
      const normalizedType = normalizeCategory(utility?.type);
      if (normalizedType) {
        typeSet.add(normalizedType);
      }
    });
    utilityAccounts.forEach((utilityAccount) => {
      const normalizedType = normalizeCategory(utilityAccount?.type);
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
  }, [customCategories, hiddenCategories, utilityAccounts, utilities]);

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

    [...utilities, ...utilityAccounts].forEach((item) => {
      const provider = String(item?.provider || '').trim();
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
  }, [utilityAccounts, utilities]);

  const accountNumberSuggestions = useMemo(() => {
    const accountNumberByNormalized = new Map();

    [...utilities, ...utilityAccounts].forEach((item) => {
      const accountNumber = String(item?.accountNumber || '').trim();
      if (!accountNumber) {
        return;
      }

      const normalizedAccountNumber = accountNumber.toLowerCase();
      if (!accountNumberByNormalized.has(normalizedAccountNumber)) {
        accountNumberByNormalized.set(normalizedAccountNumber, accountNumber);
      }
    });

    return Array.from(accountNumberByNormalized.values()).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [utilityAccounts, utilities]);

  const selectedUtilityAccount = useMemo(() => {
    return (
      utilityAccounts.find(
        (utilityAccount) => utilityAccount._id === billDraft.utilityAccountId
      ) || null
    );
  }, [billDraft.utilityAccountId, utilityAccounts]);

  useEffect(() => {
    if (!selectedUtilityAccount) {
      return;
    }

    setBillDraft((previous) => ({
      ...previous,
      propertyId: '',
      type: selectedUtilityAccount.type,
      customType: '',
      provider: selectedUtilityAccount.provider || '',
      accountNumber: selectedUtilityAccount.accountNumber || ''
    }));
  }, [selectedUtilityAccount]);

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
      const accountNumber = String(utility.accountNumber || '').toLowerCase();

      return (
        propertyName.includes(cleanedSearchText) ||
        provider.includes(cleanedSearchText) ||
        billingMonth.includes(cleanedSearchText) ||
        notes.includes(cleanedSearchText) ||
        utilityType.includes(cleanedSearchText) ||
        accountNumber.includes(cleanedSearchText)
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

  const loading =
    loadingProperties || loadingUtilities || loadingUtilityAccounts;

  const accountAllocationTotal = useMemo(() => {
    return sumAllocationPercentages(accountDraft.allocations);
  }, [accountDraft.allocations]);

  const handleAccountAllocationChange = (index, field, value) => {
    setAccountDraft((previous) => ({
      ...previous,
      allocations: previous.allocations.map((allocation, allocationIndex) => {
        if (allocationIndex !== index) {
          return allocation;
        }

        return {
          ...allocation,
          [field]: value
        };
      })
    }));
  };

  const handleAddAllocationRow = () => {
    setAccountDraft((previous) => ({
      ...previous,
      allocations: [...previous.allocations, { propertyId: '', percentage: '' }]
    }));
  };

  const handleRemoveAllocationRow = (index) => {
    setAccountDraft((previous) => ({
      ...previous,
      allocations:
        previous.allocations.length === 1
          ? [{ propertyId: '', percentage: '' }]
          : previous.allocations.filter(
              (_, allocationIndex) => allocationIndex !== index
            )
    }));
  };

  const handleEditUtilityAccount = (utilityAccount) => {
    const categoryDraft = getCategoryDraftValue(
      utilityAccount.type,
      availableCategories
    );

    setAccountDraft({
      id: utilityAccount._id,
      type: categoryDraft.type,
      customType: categoryDraft.customType,
      provider: utilityAccount.provider || '',
      accountNumber: utilityAccount.accountNumber || '',
      notes: utilityAccount.notes || '',
      allocations: (utilityAccount.allocations || []).length
        ? utilityAccount.allocations.map((allocation) => ({
            propertyId: String(allocation.propertyId),
            percentage: String(allocation.percentage)
          }))
        : [{ propertyId: '', percentage: '' }]
    });
  };

  const resetAccountDraft = () => {
    setAccountDraft(getInitialAccountDraft());
  };

  const handleSaveUtilityAccount = async () => {
    const selectedType = getSelectedTypeValue(
      accountDraft.type,
      accountDraft.customType
    );
    const allocations = accountDraft.allocations
      .map((allocation) => ({
        propertyId: String(allocation.propertyId || ''),
        percentage: Number(allocation.percentage)
      }))
      .filter((allocation) => allocation.propertyId);

    if (!accountDraft.accountNumber.trim()) {
      toast.error(t('Account number is required'));
      return;
    }

    if (!selectedType) {
      toast.error(t('Category is required'));
      return;
    }

    if (allocations.length !== accountDraft.allocations.length) {
      toast.error(t('Each allocation needs a property or sub property'));
      return;
    }

    if (
      new Set(allocations.map((allocation) => allocation.propertyId)).size !==
      allocations.length
    ) {
      toast.error(t('Each property or sub property can only be selected once'));
      return;
    }

    if (
      allocations.some(
        (allocation) =>
          !Number.isFinite(allocation.percentage) || allocation.percentage <= 0
      )
    ) {
      toast.error(t('Allocation percentages must be positive numbers'));
      return;
    }

    if (Math.abs(sumAllocationPercentages(allocations) - 100) > 0.01) {
      toast.error(t('Allocation percentages must add up to 100'));
      return;
    }

    setSavingAccount(true);
    try {
      const payload = {
        type: selectedType,
        provider: accountDraft.provider,
        accountNumber: accountDraft.accountNumber.trim(),
        notes: accountDraft.notes,
        allocations
      };

      if (accountDraft.id) {
        await apiFetcher().patch(
          `/utility-accounts/${accountDraft.id}`,
          payload
        );
      } else {
        await apiFetcher().post('/utility-accounts', payload);
      }

      toast.success(
        accountDraft.id
          ? t('Utility account updated')
          : t('Utility account added')
      );
      resetAccountDraft();
      await utilityAccountsQuery.refetch();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || t('Failed to save utility account')
      );
    } finally {
      setSavingAccount(false);
    }
  };

  const handleDeleteUtilityAccount = async (utilityAccountId) => {
    try {
      await apiFetcher().delete(`/utility-accounts/${utilityAccountId}`);
      toast.success(t('Utility account removed'));

      if (accountDraft.id === utilityAccountId) {
        resetAccountDraft();
      }

      if (billDraft.utilityAccountId === utilityAccountId) {
        setBillDraft((previous) => ({
          ...getInitialBillDraft(),
          billingMonth: previous.billingMonth
        }));
      }

      await utilityAccountsQuery.refetch();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || t('Failed to remove utility account')
      );
    }
  };

  const handleCreateBill = async () => {
    const selectedType = getSelectedTypeValue(
      billDraft.type,
      billDraft.customType
    );

    if (!billDraft.billingMonth) {
      toast.error(t('Billing month is required'));
      return;
    }

    const amount = Number(billDraft.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error(t('Amount must be a positive number'));
      return;
    }

    setSubmitting(true);
    try {
      if (billDraft.utilityAccountId) {
        let attachmentId = null;

        if (billFile) {
          const formData = new FormData();
          formData.append('file', billFile);
          formData.append('targetType', 'utility_account');
          formData.append('targetId', billDraft.utilityAccountId);
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

        await apiFetcher().post(
          `/utility-accounts/${billDraft.utilityAccountId}/bills`,
          {
            billingMonth: billDraft.billingMonth,
            amount,
            dueDate: billDraft.dueDate || null,
            paidDate: billDraft.paidDate || null,
            notes: billDraft.notes,
            attachmentIds: attachmentId ? [attachmentId] : []
          }
        );

        toast.success(t('Utility bill added to assigned properties'));
        setBillFile(null);
        setBillDraft((previous) => ({
          ...previous,
          amount: '',
          dueDate: '',
          paidDate: '',
          notes: ''
        }));
      } else {
        if (!billDraft.propertyId) {
          toast.error(t('Property is required'));
          return;
        }

        if (!selectedType) {
          toast.error(t('Category is required'));
          return;
        }

        let attachmentId = null;
        if (billFile) {
          const formData = new FormData();
          formData.append('file', billFile);
          formData.append('targetType', 'property');
          formData.append('targetId', billDraft.propertyId);
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

        await apiFetcher().post('/utilities', {
          propertyId: billDraft.propertyId,
          type: selectedType,
          provider: billDraft.provider,
          accountNumber: billDraft.accountNumber,
          billingMonth: billDraft.billingMonth,
          amount,
          dueDate: billDraft.dueDate || null,
          paidDate: billDraft.paidDate || null,
          notes: billDraft.notes,
          splitMethod: 'equal',
          splitItems: [],
          attachmentIds: attachmentId ? [attachmentId] : []
        });

        toast.success(t('Utility bill added'));
        setBillFile(null);
        setBillDraft((previous) => ({
          ...previous,
          amount: '',
          provider: '',
          accountNumber: '',
          dueDate: '',
          paidDate: '',
          notes: '',
          customType: ''
        }));
      }

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
      <Card className="p-6 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <UtilitiesHeaderIcon />
            <h1 className="text-2xl font-bold">{t('Utilities')}</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredUtilities.length} {t('entry(ies)')} •{' '}
            {utilityAccounts.length} {t('saved account(s)')} •{' '}
            {toCurrency(totalAmount)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={utilitiesTab === 'accounts' ? 'default' : 'outline'}
            onClick={() => setUtilitiesTab('accounts')}
          >
            {t('Utility account setup')}
          </Button>
          <Button
            variant={utilitiesTab === 'bills' ? 'default' : 'outline'}
            onClick={() => setUtilitiesTab('bills')}
          >
            {t('Add utility bill')}
          </Button>
        </div>

        {utilitiesTab === 'accounts' ? (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  {t('Utility account setup')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t(
                    'Save an account number once, assign percentages to properties or sub properties, and reuse it when you add bills.'
                  )}
                </p>
              </div>
              {accountDraft.id ? (
                <Button variant="outline" onClick={resetAccountDraft}>
                  {t('Clear')}
                </Button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs text-muted-foreground">
                  {t('Account number')}
                </label>
                <Input
                  type="text"
                  value={accountDraft.accountNumber}
                  list="utility-account-number-options"
                  onChange={(event) =>
                    setAccountDraft((previous) => ({
                      ...previous,
                      accountNumber: event.target.value
                    }))
                  }
                />
                <datalist id="utility-account-number-options">
                  {accountNumberSuggestions.map((accountNumber) => (
                    <option key={accountNumber} value={accountNumber} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  {t('Category')}
                </label>
                <select
                  value={accountDraft.type}
                  onChange={(event) =>
                    setAccountDraft((previous) => ({
                      ...previous,
                      type: event.target.value
                    }))
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
                  {t('Provider')}
                </label>
                <Input
                  type="text"
                  value={accountDraft.provider}
                  list="utility-provider-options"
                  onChange={(event) =>
                    setAccountDraft((previous) => ({
                      ...previous,
                      provider: event.target.value
                    }))
                  }
                />
              </div>
              {accountDraft.type === 'custom' ? (
                <div>
                  <label className="text-xs text-muted-foreground">
                    {t('New category name')}
                  </label>
                  <Input
                    type="text"
                    placeholder={t('e.g. common electric')}
                    value={accountDraft.customType}
                    onChange={(event) =>
                      setAccountDraft((previous) => ({
                        ...previous,
                        customType: event.target.value
                      }))
                    }
                  />
                </div>
              ) : null}
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">
                  {t('Notes')}
                </label>
                <Input
                  type="text"
                  value={accountDraft.notes}
                  onChange={(event) =>
                    setAccountDraft((previous) => ({
                      ...previous,
                      notes: event.target.value
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{t('Allocations')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('Percentages must total 100%')}
                  </div>
                </div>
                <Button variant="outline" onClick={handleAddAllocationRow}>
                  <LuPlus className="size-4 mr-2" />
                  {t('Add allocation')}
                </Button>
              </div>

              <div className="space-y-2">
                {accountDraft.allocations.map((allocation, index) => (
                  <div
                    key={`${index}-${allocation.propertyId}`}
                    className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,2fr)_140px_80px]"
                  >
                    <select
                      value={allocation.propertyId}
                      onChange={(event) =>
                        handleAccountAllocationChange(
                          index,
                          'propertyId',
                          event.target.value
                        )
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                    >
                      <option value="">
                        {t('Select property or sub property')}
                      </option>
                      {propertyOptions.map((property) => (
                        <option key={property._id} value={property._id}>
                          {getPropertyLabel(property, propertyById)}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder={t('Percentage')}
                      value={allocation.percentage}
                      onChange={(event) =>
                        handleAccountAllocationChange(
                          index,
                          'percentage',
                          event.target.value
                        )
                      }
                    />
                    <Button
                      variant="outline"
                      onClick={() => handleRemoveAllocationRow(index)}
                    >
                      <LuTrash2 className="size-4 mr-2" />
                      {t('Remove')}
                    </Button>
                  </div>
                ))}
              </div>

              <div
                className={`text-sm ${
                  Math.abs(accountAllocationTotal - 100) <= 0.01
                    ? 'text-muted-foreground'
                    : 'text-red-600'
                }`}
              >
                {t('Total allocation')}:{' '}
                {formatPercentage(accountAllocationTotal)}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveUtilityAccount}
                disabled={savingAccount}
              >
                {savingAccount
                  ? t('Saving...')
                  : accountDraft.id
                    ? t('Update account')
                    : t('Save account')}
              </Button>
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="text-sm font-medium">{t('Saved accounts')}</div>
              {!utilityAccounts.length ? (
                <div className="text-sm text-muted-foreground">
                  {t('No utility accounts saved yet')}
                </div>
              ) : (
                <div className="space-y-2">
                  {utilityAccounts.map((utilityAccount) => (
                    <div
                      key={utilityAccount._id}
                      className="rounded-lg border p-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">
                          {utilityAccount.accountNumber} • {utilityAccount.type}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {utilityAccount.provider || t('No provider')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(utilityAccount.allocations || [])
                            .map((allocation) => {
                              const property =
                                propertyById[String(allocation.propertyId)];
                              return `${getPropertyLabel(property, propertyById)} (${formatPercentage(allocation.percentage)})`;
                            })
                            .join(' • ')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleEditUtilityAccount(utilityAccount)
                          }
                        >
                          {t('Edit')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleDeleteUtilityAccount(utilityAccount._id)
                          }
                        >
                          {t('Delete')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {utilitiesTab === 'bills' ? (
          <div className="rounded-lg border p-4 space-y-4">
            <div>
              <h2 className="text-base font-semibold">
                {t('Add utility bill')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  'Choose a saved account number to distribute one bill across its assigned properties, or leave it blank for a manual single-property entry.'
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs text-muted-foreground">
                  {t('Saved account number')}
                </label>
                <select
                  value={billDraft.utilityAccountId}
                  onChange={(event) => {
                    const nextUtilityAccountId = event.target.value;
                    const utilityAccount =
                      utilityAccounts.find(
                        (account) => account._id === nextUtilityAccountId
                      ) || null;

                    if (!utilityAccount) {
                      setBillDraft((previous) => ({
                        ...previous,
                        utilityAccountId: '',
                        propertyId: '',
                        type: 'water',
                        customType: '',
                        provider: '',
                        accountNumber: ''
                      }));
                      return;
                    }

                    setBillDraft((previous) => ({
                      ...previous,
                      utilityAccountId: utilityAccount._id,
                      propertyId: '',
                      type: utilityAccount.type,
                      customType: '',
                      provider: utilityAccount.provider || '',
                      accountNumber: utilityAccount.accountNumber || ''
                    }));
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                >
                  <option value="">{t('Manual entry')}</option>
                  {utilityAccounts.map((utilityAccount) => (
                    <option key={utilityAccount._id} value={utilityAccount._id}>
                      {utilityAccount.accountNumber} • {utilityAccount.type}
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
                  value={billDraft.billingMonth}
                  onChange={(event) =>
                    setBillDraft((previous) => ({
                      ...previous,
                      billingMonth: event.target.value
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  {t('Amount')}
                </label>
                <Input
                  type="number"
                  value={billDraft.amount}
                  onChange={(event) =>
                    setBillDraft((previous) => ({
                      ...previous,
                      amount: event.target.value
                    }))
                  }
                />
              </div>

              {billDraft.utilityAccountId ? (
                <div className="md:col-span-3 rounded-md border bg-muted/20 p-3 space-y-1">
                  <div className="text-sm font-medium">
                    {billDraft.accountNumber} • {billDraft.type}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {billDraft.provider || t('No provider')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(selectedUtilityAccount?.allocations || [])
                      .map((allocation) => {
                        const property =
                          propertyById[String(allocation.propertyId)];
                        return `${getPropertyLabel(property, propertyById)} (${formatPercentage(allocation.percentage)})`;
                      })
                      .join(' • ')}
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Property')}
                    </label>
                    <select
                      value={billDraft.propertyId}
                      onChange={(event) =>
                        setBillDraft((previous) => ({
                          ...previous,
                          propertyId: event.target.value
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                    >
                      <option value="">{t('Select property')}</option>
                      {propertyOptions.map((property) => (
                        <option key={property._id} value={property._id}>
                          {getPropertyLabel(property, propertyById)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Category')}
                    </label>
                    <select
                      value={billDraft.type}
                      onChange={(event) =>
                        setBillDraft((previous) => ({
                          ...previous,
                          type: event.target.value
                        }))
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
                      {t('Provider')}
                    </label>
                    <Input
                      type="text"
                      value={billDraft.provider}
                      list="utility-provider-options"
                      onChange={(event) =>
                        setBillDraft((previous) => ({
                          ...previous,
                          provider: event.target.value
                        }))
                      }
                    />
                  </div>
                  {billDraft.type === 'custom' ? (
                    <div>
                      <label className="text-xs text-muted-foreground">
                        {t('New category name')}
                      </label>
                      <Input
                        type="text"
                        placeholder={t('e.g. pest control')}
                        value={billDraft.customType}
                        onChange={(event) =>
                          setBillDraft((previous) => ({
                            ...previous,
                            customType: event.target.value
                          }))
                        }
                      />
                    </div>
                  ) : null}
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Account number')}
                    </label>
                    <Input
                      type="text"
                      value={billDraft.accountNumber}
                      list="utility-account-number-options"
                      onChange={(event) =>
                        setBillDraft((previous) => ({
                          ...previous,
                          accountNumber: event.target.value
                        }))
                      }
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs text-muted-foreground">
                  {t('Due date')}
                </label>
                <Input
                  type="date"
                  value={billDraft.dueDate}
                  onChange={(event) =>
                    setBillDraft((previous) => ({
                      ...previous,
                      dueDate: event.target.value
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  {t('Paid date')}
                </label>
                <Input
                  type="date"
                  value={billDraft.paidDate}
                  onChange={(event) =>
                    setBillDraft((previous) => ({
                      ...previous,
                      paidDate: event.target.value
                    }))
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
              <div className="md:col-span-3">
                <label className="text-xs text-muted-foreground">
                  {t('Notes')}
                </label>
                <Input
                  type="text"
                  value={billDraft.notes}
                  onChange={(event) =>
                    setBillDraft((previous) => ({
                      ...previous,
                      notes: event.target.value
                    }))
                  }
                />
              </div>
            </div>

            <datalist id="utility-provider-options">
              {providerSuggestions.map((provider) => (
                <option key={provider} value={provider} />
              ))}
            </datalist>

            <div className="flex justify-end">
              <Button onClick={handleCreateBill} disabled={submitting}>
                {submitting ? t('Saving...') : t('Add bill')}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t(
                'Search by property, type, provider, account number, month...'
              )}
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
                      {utility.accountNumber
                        ? ` • ${utility.accountNumber}`
                        : ''}
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
