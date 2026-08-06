import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog';
import { FaDroplet, FaFaucet } from 'react-icons/fa6';
import {
  LuDownload,
  LuExternalLink,
  LuFileSearch,
  LuFileSpreadsheet,
  LuLandmark,
  LuPlus,
  LuRefreshCw,
  LuSearch,
  LuSettings2,
  LuTrash2
} from 'react-icons/lu';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetcher } from '../../../utils/fetch';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import NotesPanel from '../../../components/NotesPanel';
import Page from '../../../components/Page';
import SavedBills from '../../../components/utilities/SavedBills';
import { toast } from 'sonner';
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

function formatCategoryLabel(value) {
  const normalized = normalizeCategory(value);
  if (!normalized) {
    return '';
  }

  if (normalized === 'hoa') {
    return 'HOA';
  }

  return normalized.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
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

function getFilenameFromDisposition(contentDisposition, fallback) {
  const value = String(contentDisposition || '');

  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const asciiMatch = value.match(/filename="?([^";]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return fallback;
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

function getInitialTaxDraft() {
  return {
    id: '',
    propertyId: '',
    taxYearLabel: '',
    periodStart: '',
    periodEnd: '',
    county: '',
    accountNumber: '',
    mapNumber: '',
    rmvLandLastYear: '',
    rmvLandThisYear: '',
    rmvBuildingLastYear: '',
    rmvBuildingThisYear: '',
    rmvTotalLastYear: '',
    rmvTotalThisYear: '',
    assessedValueLastYear: '',
    assessedValueThisYear: '',
    propertyTaxesLastYear: '',
    propertyTaxesThisYear: '',
    taxBeforeDiscount: '',
    delinquentTaxes: '',
    totalAfterDiscount: '',
    landLeasedPercentage: '100',
    buildingUnitSplits: [{ subPropertyId: '', percentage: '' }],
    landUnitSplits: [{ subPropertyId: '', percentage: '' }],
    estimatedIncreasePercentage: '3.5',
    priorYearEstimatedTotal: '',
    notes: ''
  };
}

function getInitialTaxPaymentDraft() {
  return {
    paidOn: '',
    paidAmount: '',
    feeAmount: '',
    paymentMethod: '',
    confirmationNumber: '',
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

function formatAllocationSummary(allocations = [], propertyById = {}) {
  return (Array.isArray(allocations) ? allocations : [])
    .map((allocation) => {
      const property = propertyById[String(allocation.propertyId)];
      return `${getPropertyLabel(property, propertyById)} (${formatPercentage(allocation.percentage)})`;
    })
    .join(' • ');
}

function sumSplitPercentages(items) {
  return items.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0);
}

function isHistoricalTaxYearLabel(taxYearLabel) {
  const label = String(taxYearLabel || '').trim();
  if (!label) {
    return false;
  }

  const rangeMatch = label.match(/^(\d{4})\s*[-–]\s*(\d{4})$/);
  const singleMatch = label.match(/^(\d{4})$/);
  const startYear = rangeMatch
    ? Number(rangeMatch[1])
    : singleMatch
      ? Number(singleMatch[1])
      : null;

  if (!Number.isFinite(startYear)) {
    return false;
  }

  return startYear < new Date().getFullYear() - 1;
}

function isHistoricalDefaultEstimateActive(taxPayload) {
  if (!isHistoricalTaxYearLabel(taxPayload?.taxYearLabel)) {
    return false;
  }

  const totalAfterDiscount = Number(taxPayload?.totalAfterDiscount || 0);
  if (!Number.isFinite(totalAfterDiscount) || totalAfterDiscount <= 0) {
    return false;
  }

  const estimatedIncreasePercentage = Number(
    taxPayload?.estimatedIncreasePercentage || 0
  );
  if (estimatedIncreasePercentage !== 0) {
    return false;
  }

  const priorEstimatedRaw = String(
    taxPayload?.priorYearEstimatedTotal ?? ''
  ).trim();
  if (!priorEstimatedRaw) {
    return true;
  }

  const priorEstimatedTotal = Number(priorEstimatedRaw);
  return (
    Number.isFinite(priorEstimatedTotal) &&
    Math.abs(priorEstimatedTotal - totalAfterDiscount) <= 0.01
  );
}

function normalizeAccountKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function hasSavedTaxSplits(statement) {
  const buildingHasSplits = Array.isArray(statement?.buildingUnitSplits)
    ? statement.buildingUnitSplits.some((item) => item?.subPropertyId)
    : false;
  const landHasSplits = Array.isArray(statement?.landUnitSplits)
    ? statement.landUnitSplits.some((item) => item?.subPropertyId)
    : false;
  return buildingHasSplits || landHasSplits;
}

function buildTaxAllocationPreview(taxPayload, propertyById) {
  const totalTax = Number(taxPayload?.totalAfterDiscount || 0);
  const estimatedIncreasePercentage = Number(
    taxPayload?.estimatedIncreasePercentage || 0
  );
  const nextYearTotal = totalTax * (1 + estimatedIncreasePercentage / 100);
  const currentYearMonthlyTotal = totalTax / 12;
  const nextYearMonthlyTotal = nextYearTotal / 12;
  const landLeasedPercentage = Math.min(
    100,
    Math.max(0, Number(taxPayload?.landLeasedPercentage || 0))
  );
  const buildingLeasedPercentage = 100 - landLeasedPercentage;
  const landAmount = (totalTax * landLeasedPercentage) / 100;
  const buildingAmount = (totalTax * buildingLeasedPercentage) / 100;

  const toRows = (items, totalAmount, bucket) => {
    return (Array.isArray(items) ? items : [])
      .filter((item) => item?.subPropertyId)
      .map((item) => {
        const percentage = Number(item.percentage || 0);
        const unitId = String(item.subPropertyId);
        return {
          unitId,
          unitName: propertyById?.[unitId]?.name || unitId,
          percentage,
          amount: (totalAmount * percentage) / 100,
          bucket
        };
      })
      .filter(
        (item) => Number.isFinite(item.percentage) && item.percentage > 0
      );
  };

  const buildingRows = toRows(
    taxPayload?.buildingUnitSplits,
    buildingAmount,
    'building'
  );
  const landRows = toRows(taxPayload?.landUnitSplits, landAmount, 'land');

  const combinedByUnit = {};
  [...buildingRows, ...landRows].forEach((row) => {
    if (!combinedByUnit[row.unitId]) {
      combinedByUnit[row.unitId] = {
        unitId: row.unitId,
        unitName: row.unitName,
        buildingAmount: 0,
        landAmount: 0,
        totalAmount: 0,
        buildingPercentage: 0,
        landPercentage: 0
      };
    }

    if (row.bucket === 'building') {
      combinedByUnit[row.unitId].buildingAmount += row.amount;
      combinedByUnit[row.unitId].buildingPercentage = row.percentage;
    }
    if (row.bucket === 'land') {
      combinedByUnit[row.unitId].landAmount += row.amount;
      combinedByUnit[row.unitId].landPercentage = row.percentage;
    }
    combinedByUnit[row.unitId].totalAmount += row.amount;
  });

  const factor = 1 + estimatedIncreasePercentage / 100;
  Object.values(combinedByUnit).forEach((row) => {
    row.totalSharePercentage =
      totalTax > 0 ? (row.totalAmount / totalTax) * 100 : 0;
    row.currentYearMonthlyAmount = row.totalAmount / 12;
    row.nextYearBuildingAmount = row.buildingAmount * factor;
    row.nextYearLandAmount = row.landAmount * factor;
    row.nextYearAnnualAmount = row.totalAmount * factor;
    row.nextYearMonthlyAmount = row.nextYearAnnualAmount / 12;
  });

  return {
    totalTax,
    estimatedIncreasePercentage,
    nextYearTotal,
    currentYearMonthlyTotal,
    nextYearMonthlyTotal,
    landLeasedPercentage,
    buildingLeasedPercentage,
    landAmount,
    buildingAmount,
    buildingRows,
    landRows,
    combinedRows: Object.values(combinedByUnit).sort((a, b) =>
      a.unitName.localeCompare(b.unitName)
    )
  };
}

function getTaxStatusMeta(status) {
  switch (status) {
    case 'overpaid':
      return {
        label: 'Overpaid',
        className: 'bg-cyan-100 text-cyan-700'
      };
    case 'paid':
      return {
        label: 'Paid',
        className: 'bg-green-100 text-green-700'
      };
    case 'partial':
      return {
        label: 'Partial',
        className: 'bg-amber-100 text-amber-700'
      };
    default:
      return {
        label: 'Unpaid',
        className: 'bg-red-100 text-red-700'
      };
  }
}

function UtilitiesHeaderIcon({ isTaxOnly = false }) {
  if (isTaxOnly) {
    return <LuLandmark className="size-5 text-muted-foreground" />;
  }

  return (
    <span className="relative inline-flex size-5 items-center justify-center">
      <FaFaucet className="size-full text-muted-foreground" />
      <FaDroplet className="absolute right-[-3px] top-[94%] size-2 text-sky-500" />
    </span>
  );
}

export function UtilitiesPage({ view = 'all' }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const isTaxOnly = view === 'tax';
  const isUtilitiesOnly = view === 'utilities';
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [billFile, setBillFile] = useState(null);
  const [batchBillFiles, setBatchBillFiles] = useState([]);
  const [parsingUtilityUpload, setParsingUtilityUpload] = useState(false);
  const [batchUploadingBills, setBatchUploadingBills] = useState(false);
  const [checkingEmailInbox, setCheckingEmailInbox] = useState(false);
  const [deduplicating, setDeduplicating] = useState(false);
  const [backfillingAmounts, setBackfillingAmounts] = useState(false);
  const [batchWorkflowOpen, setBatchWorkflowOpen] = useState(false);
  const [batchPreparingReview, setBatchPreparingReview] = useState(false);
  const [batchReviewItems, setBatchReviewItems] = useState([]);
  const [hardCopyFiles, setHardCopyFiles] = useState([]);
  const [hardCopyAttaching, setHardCopyAttaching] = useState(false);
  const [hardCopyResults, setHardCopyResults] = useState(null);
  const [workingUtilityAttachmentId, setWorkingUtilityAttachmentId] =
    useState('');
  const [workingPendingActionId, setWorkingPendingActionId] = useState('');
  const [workingBatchReviewItemId, setWorkingBatchReviewItemId] = useState('');
  // 'popup' or 'modal' — persisted in localStorage
  const [previewMode, setPreviewModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('utility-bill-preview-mode') || 'popup';
    }
    return 'popup';
  });
  const [modalPreviewUrl, setModalPreviewUrl] = useState('');
  const [modalPreviewName, setModalPreviewName] = useState('');
  const [modalPreviewOpen, setModalPreviewOpen] = useState(false);

  const setPreviewMode = (mode) => {
    setPreviewModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('utility-bill-preview-mode', mode);
    }
  };

  const closeModalPreview = () => {
    if (modalPreviewUrl) window.URL.revokeObjectURL(modalPreviewUrl);
    setModalPreviewOpen(false);
    setModalPreviewUrl('');
    setModalPreviewName('');
  };

  const [
    expandedAllocationHistoryAccountId,
    setExpandedAllocationHistoryAccountId
  ] = useState('');
  const [customCategories, setCustomCategories] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [utilitiesTab, setUtilitiesTab] = useState(
    isTaxOnly ? 'tax-saved' : 'list'
  );
  const [savingTaxStatement, setSavingTaxStatement] = useState(false);
  const [parsingTaxUpload, setParsingTaxUpload] = useState(false);
  const [parsingTaxStatementId, setParsingTaxStatementId] = useState('');
  const [taxFile, setTaxFile] = useState(null);
  const [taxSearchText, setTaxSearchText] = useState('');
  const [taxPropertyFilter, setTaxPropertyFilter] = useState('all');
  const [taxYearFilter, setTaxYearFilter] = useState('all');
  const [taxReportPropertyFilter, setTaxReportPropertyFilter] = useState('all');
  const [taxReportYearFilter, setTaxReportYearFilter] = useState('all');
  const [taxReportStatusFilter, setTaxReportStatusFilter] = useState('all');
  const [exportingTaxReportCsv, setExportingTaxReportCsv] = useState(false);
  const [downloadingTaxAttachmentId, setDownloadingTaxAttachmentId] =
    useState('');
  const [activeTaxPaymentStatementId, setActiveTaxPaymentStatementId] =
    useState('');
  const [activeTaxPaymentBatchStatementId, setActiveTaxPaymentBatchStatementId] =
    useState('');
  const [activeTaxPaymentEditIndex, setActiveTaxPaymentEditIndex] =
    useState(null);
  const [activeTaxNotesStatementId, setActiveTaxNotesStatementId] =
    useState('');
  const [savingTaxPaymentConfirmation, setSavingTaxPaymentConfirmation] =
    useState(false);
  const [deletingTaxPaymentConfirmationKey, setDeletingTaxPaymentConfirmationKey] =
    useState('');
  const [parsingTaxPaymentUpload, setParsingTaxPaymentUpload] = useState(false);
  const [batchUploadingTaxPayments, setBatchUploadingTaxPayments] =
    useState(false);
  const [taxPaymentFile, setTaxPaymentFile] = useState(null);
  const [taxPaymentBatchFiles, setTaxPaymentBatchFiles] = useState([]);
  const [taxPaymentDraft, setTaxPaymentDraft] = useState(
    getInitialTaxPaymentDraft()
  );
  const [accountDraft, setAccountDraft] = useState(getInitialAccountDraft());
  const [billDraft, setBillDraft] = useState(getInitialBillDraft());
  const [taxDraft, setTaxDraft] = useState(getInitialTaxDraft());
  const taxDraftRef = useRef(taxDraft);
  const [taxAllocationCarriedOver, setTaxAllocationCarriedOver] =
    useState(false);

  useEffect(() => {
    taxDraftRef.current = taxDraft;
  }, [taxDraft]);

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

  const propertyTaxStatementsQuery = useQuery({
    queryKey: ['property-tax-statements'],
    queryFn: async () => {
      const response = await apiFetcher().get('/property-tax-statements');
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
  const propertyTaxStatements = useMemo(
    () => propertyTaxStatementsQuery.data || [],
    [propertyTaxStatementsQuery.data]
  );
  const loadingUtilities = utilitiesQuery.isLoading;
  const loadingUtilityAccounts = utilityAccountsQuery.isLoading;
  const loadingPropertyTaxStatements = propertyTaxStatementsQuery.isLoading;
  const isError =
    utilitiesQuery.isError ||
    utilityAccountsQuery.isError ||
    propertyTaxStatementsQuery.isError;

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

  const topLevelPropertyOptions = useMemo(() => {
    return propertyOptions.filter((property) => !property.parentPropertyId);
  }, [propertyOptions]);

  const unitOptionsForTaxDraft = useMemo(() => {
    return propertyOptions.filter(
      (property) =>
        String(property.parentPropertyId || '') === taxDraft.propertyId
    );
  }, [propertyOptions, taxDraft.propertyId]);

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

  const utilityAccountById = useMemo(() => {
    return utilityAccounts.reduce((accumulator, utilityAccount) => {
      accumulator[String(utilityAccount._id)] = utilityAccount;
      return accumulator;
    }, {});
  }, [utilityAccounts]);

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

      if (propertyFilter !== 'all') {
        const matchesDirect =
          String(utility.propertyId) === propertyFilter;
        const prop = propertyById[String(utility.propertyId)];
        const matchesAsChild =
          prop && String(prop.parentPropertyId || '') === propertyFilter;
        if (!matchesDirect && !matchesAsChild) {
          return false;
        }
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
  }, [monthFilter, propertyById, propertyFilter, searchText, typeFilter, utilities]);

  const totalAmount = useMemo(
    () =>
      filteredUtilities.reduce(
        (sum, utility) => sum + Number(utility.amount || 0),
        0
      ),
    [filteredUtilities]
  );

  const pendingEmailUtilities = useMemo(() => {
    return filteredUtilities.filter(
      (utility) =>
        String(utility?.status || '').toLowerCase() === 'pending' &&
        String(utility?.source || '').toLowerCase() === 'email'
    );
  }, [filteredUtilities]);

  const taxYearOptions = useMemo(() => {
    const years = new Set();

    propertyTaxStatements.forEach((statement) => {
      const taxYearLabel = String(statement?.taxYearLabel || '').trim();
      if (taxYearLabel) {
        years.add(taxYearLabel);
      }
    });

    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [propertyTaxStatements]);

  const filteredTaxStatements = useMemo(() => {
    const normalizedSearchText = taxSearchText.trim().toLowerCase();

    return propertyTaxStatements.filter((statement) => {
      if (
        taxPropertyFilter !== 'all' &&
        String(statement.propertyId) !== String(taxPropertyFilter)
      ) {
        return false;
      }

      if (
        taxYearFilter !== 'all' &&
        String(statement.taxYearLabel || '') !== String(taxYearFilter)
      ) {
        return false;
      }

      if (!normalizedSearchText) {
        return true;
      }

      const property = propertyById[String(statement.propertyId)];
      const propertyName = String(property?.name || '').toLowerCase();
      const taxYearLabel = String(statement.taxYearLabel || '').toLowerCase();
      const accountNumber = String(statement.accountNumber || '').toLowerCase();
      const mapNumber = String(statement.mapNumber || '').toLowerCase();
      const notes = String(statement.notes || '').toLowerCase();

      return (
        propertyName.includes(normalizedSearchText) ||
        taxYearLabel.includes(normalizedSearchText) ||
        accountNumber.includes(normalizedSearchText) ||
        mapNumber.includes(normalizedSearchText) ||
        notes.includes(normalizedSearchText)
      );
    });
  }, [
    propertyById,
    propertyTaxStatements,
    taxPropertyFilter,
    taxSearchText,
    taxYearFilter
  ]);

  const taxReportRows = useMemo(() => {
    return propertyTaxStatements
      .map((statement) => {
        const confirmations = Array.isArray(statement.paymentConfirmations)
          ? statement.paymentConfirmations
          : [];
        const totalDue = Number(statement.totalAfterDiscount || 0);
        const totalPaid = confirmations.reduce(
          (sum, confirmation) => sum + Number(confirmation.paidAmount || 0),
          0
        );
        const totalFees = confirmations.reduce(
          (sum, confirmation) => sum + Number(confirmation.feeAmount || 0),
          0
        );
        const signedBalance = Number((totalDue - totalPaid).toFixed(2));
        const balance = Math.max(0, signedBalance);
        const overpaidAmount = Math.max(0, -signedBalance);

        let status = 'unpaid';
        if (totalDue > 0 && signedBalance < -0.01) {
          status = 'overpaid';
        } else if (totalDue > 0 && Math.abs(signedBalance) <= 0.01) {
          status = 'paid';
        } else if (totalPaid > 0) {
          status = 'partial';
        }

        const lastPaymentDate = confirmations
          .map((confirmation) => String(confirmation.paidOn || ''))
          .filter(Boolean)
          .sort((left, right) => right.localeCompare(left))[0];

        return {
          statementId: String(statement._id),
          propertyId: String(statement.propertyId),
          propertyName:
            propertyById[String(statement.propertyId)]?.name ||
            t('Unknown property'),
          taxYearLabel: String(statement.taxYearLabel || ''),
          totalDue,
          totalPaid,
          totalFees,
          signedBalance,
          balance,
          overpaidAmount,
          status,
          confirmationsCount: confirmations.length,
          lastPaymentDate: lastPaymentDate ? lastPaymentDate.slice(0, 10) : ''
        };
      })
      .sort((left, right) => {
        const byProperty = left.propertyName.localeCompare(right.propertyName);
        if (byProperty !== 0) {
          return byProperty;
        }

        return right.taxYearLabel.localeCompare(left.taxYearLabel);
      });
  }, [propertyById, propertyTaxStatements, t]);

  const filteredTaxReportRows = useMemo(() => {
    return taxReportRows.filter((row) => {
      if (
        taxReportPropertyFilter !== 'all' &&
        row.propertyId !== String(taxReportPropertyFilter)
      ) {
        return false;
      }

      if (
        taxReportYearFilter !== 'all' &&
        row.taxYearLabel !== String(taxReportYearFilter)
      ) {
        return false;
      }

      if (
        taxReportStatusFilter !== 'all' &&
        row.status !== taxReportStatusFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    taxReportPropertyFilter,
    taxReportRows,
    taxReportStatusFilter,
    taxReportYearFilter
  ]);

  const taxReportStatusSummary = useMemo(() => {
    return filteredTaxReportRows.reduce(
      (summary, row) => {
        summary[row.status] += 1;
        return summary;
      },
      { overpaid: 0, paid: 0, partial: 0, unpaid: 0 }
    );
  }, [filteredTaxReportRows]);

  const loading =
    loadingProperties ||
    loadingUtilities ||
    loadingUtilityAccounts ||
    loadingPropertyTaxStatements;

  const accountAllocationTotal = useMemo(() => {
    return sumAllocationPercentages(accountDraft.allocations);
  }, [accountDraft.allocations]);

  const buildingSplitTotal = useMemo(
    () => sumSplitPercentages(taxDraft.buildingUnitSplits),
    [taxDraft.buildingUnitSplits]
  );

  const landSplitTotal = useMemo(
    () => sumSplitPercentages(taxDraft.landUnitSplits),
    [taxDraft.landUnitSplits]
  );

  // Map: normalised account number → most recently saved statement (by taxYearLabel desc)
  const allocationByAccountNumber = useMemo(() => {
    const map = new Map();
    const sorted = [...propertyTaxStatements].sort((a, b) =>
      String(b.taxYearLabel || '').localeCompare(String(a.taxYearLabel || ''))
    );
    for (const stmt of sorted) {
      const key = normalizeAccountKey(stmt.accountNumber);
      if (!key) {
        continue;
      }

      if (!map.has(key)) {
        map.set(key, stmt);
        continue;
      }

      const existing = map.get(key);
      if (!hasSavedTaxSplits(existing) && hasSavedTaxSplits(stmt)) {
        map.set(key, stmt);
      }
    }
    return map;
  }, [propertyTaxStatements]);

  const draftTaxAllocationPreview = useMemo(() => {
    return buildTaxAllocationPreview(taxDraft, propertyById);
  }, [propertyById, taxDraft]);

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

    setExpandedAllocationHistoryAccountId(String(utilityAccount._id));
  };

  const resetAccountDraft = () => {
    setAccountDraft(getInitialAccountDraft());
  };

  const handleSelectExistingUtilityAccount = (accountId) => {
    if (!accountId) {
      resetAccountDraft();
      return;
    }

    const utilityAccount = utilityAccounts.find(
      (item) => String(item._id) === String(accountId)
    );

    if (!utilityAccount) {
      resetAccountDraft();
      return;
    }

    handleEditUtilityAccount(utilityAccount);
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
          if (selectedUtilityAccount?.accountNumber) {
            formData.append('accountNumber', selectedUtilityAccount.accountNumber);
          }
          if (billDraft.billingMonth) {
            formData.append('billingMonth', billDraft.billingMonth);
          }

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
          if (billDraft.accountNumber) {
            formData.append('accountNumber', billDraft.accountNumber);
          }
          if (billDraft.billingMonth) {
            formData.append('billingMonth', billDraft.billingMonth);
          }

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

  const mergeExtractedUtilityBillDraft = (
    draft,
    extracted = {},
    matchedAccount = null
  ) => {
    const mergedDraft = { ...draft };

    if (matchedAccount?._id) {
      mergedDraft.utilityAccountId = String(matchedAccount._id);
      mergedDraft.propertyId = '';
      mergedDraft.type = matchedAccount.type || draft.type;
      mergedDraft.customType = '';
      mergedDraft.provider = matchedAccount.provider || draft.provider;
      mergedDraft.accountNumber =
        matchedAccount.accountNumber ||
        extracted.accountNumber ||
        draft.accountNumber;
    } else {
      if (extracted.type) {
        mergedDraft.type = String(extracted.type);
      }
      if (extracted.provider) {
        mergedDraft.provider = String(extracted.provider);
      }
      if (extracted.accountNumber) {
        mergedDraft.accountNumber = String(extracted.accountNumber);
      }
    }

    if (extracted.billingMonth) {
      mergedDraft.billingMonth = String(extracted.billingMonth);
    }

    const extractedAmount = Number(extracted.amount);
    if (Number.isFinite(extractedAmount) && extractedAmount >= 0) {
      mergedDraft.amount = String(extractedAmount);
    }

    if (extracted.dueDate) {
      mergedDraft.dueDate = String(extracted.dueDate).slice(0, 10);
    }

    return mergedDraft;
  };

  const handleAutoFillFromBillFile = async () => {
    if (!billFile) {
      toast.error(t('Choose a utility bill file first'));
      return;
    }

    setParsingUtilityUpload(true);
    try {
      const formData = new FormData();
      formData.append('file', billFile);

      const response = await apiFetcher().post(
        '/utilities/parse-upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      const extracted = response.data?.extracted || {};
      const matchedAccount = response.data?.matchedAccount || null;

      setBillDraft((previous) =>
        mergeExtractedUtilityBillDraft(previous, extracted, matchedAccount)
      );

      const warnings = response.data?.warnings || [];
      if (warnings.length) {
        toast.warning(warnings.join(' '));
      } else {
        toast.success(t('Utility bill parsed and fields auto-filled'));
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || t('Failed to parse utility bill file')
      );
    } finally {
      setParsingUtilityUpload(false);
    }
  };

  const handleUploadBillPdfToMatchedAccount = async () => {
    if (!billFile) {
      toast.error(t('Choose a utility bill PDF first'));
      return;
    }

    setParsingUtilityUpload(true);
    try {
      const parseFormData = new FormData();
      parseFormData.append('file', billFile);

      const parseResponse = await apiFetcher().post(
        '/utilities/parse-upload',
        parseFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      const extracted = parseResponse.data?.extracted || {};
      const matchedAccount = parseResponse.data?.matchedAccount || null;

      setBillDraft((previous) =>
        mergeExtractedUtilityBillDraft(previous, extracted, matchedAccount)
      );

      if (!matchedAccount?._id) {
        toast.error(
          t('Could not match this PDF to a saved utility account number')
        );
        return;
      }

      const billingMonth = String(extracted.billingMonth || '').trim();
      const amount = Number(extracted.amount);

      if (!billingMonth || !Number.isFinite(amount) || amount < 0) {
        toast.error(
          t('Could not parse billing month and amount from this PDF')
        );
        return;
      }

      const uploadFormData = new FormData();
      uploadFormData.append('file', billFile);
      uploadFormData.append('targetType', 'utility_account');
      uploadFormData.append('targetId', String(matchedAccount._id));
      uploadFormData.append('category', 'utility_bill');
      if (matchedAccount.accountNumber) {
        uploadFormData.append('accountNumber', matchedAccount.accountNumber);
      }
      if (billingMonth) {
        uploadFormData.append('billingMonth', billingMonth);
      }

      const uploadResponse = await apiFetcher().post(
        '/attachments',
        uploadFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      const attachmentId = uploadResponse.data?._id || null;

      await apiFetcher().post(`/utility-accounts/${matchedAccount._id}/bills`, {
        billingMonth,
        amount,
        dueDate: extracted.dueDate || null,
        paidDate: null,
        notes: `${t('Auto-uploaded from PDF')}: ${billFile.name}`,
        attachmentIds: attachmentId ? [attachmentId] : []
      });

      toast.success(
        t('PDF posted to matched utility account and split allocations applied')
      );

      setBillFile(null);
      await utilitiesQuery.refetch();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          t('Failed to upload PDF bill to matched account')
      );
    } finally {
      setParsingUtilityUpload(false);
    }
  };

  const handleBatchUploadUtilityBills = async () => {
    if (!batchBillFiles.length) {
      toast.error(t('Choose one or more utility bill files first'));
      return;
    }

    const toReviewItem = (file, extracted, matchedAccount, warnings) => {
      const billingMonth = String(extracted?.billingMonth || '').trim();
      const amountValue = Number(extracted?.amount);
      const amount =
        Number.isFinite(amountValue) && amountValue >= 0
          ? String(amountValue)
          : '';
      const matchedAccountId = matchedAccount?._id
        ? String(matchedAccount._id)
        : '';
      const isReady =
        Boolean(matchedAccountId) &&
        Boolean(billingMonth) &&
        amount !== '' &&
        Number(amount) >= 0;

      return {
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        fileName: file.name,
        accountId: matchedAccountId,
        billingMonth,
        amount,
        dueDate: extracted?.dueDate
          ? String(extracted.dueDate).slice(0, 10)
          : '',
        provider: String(extracted?.provider || ''),
        type: String(extracted?.type || ''),
        warnings: Array.isArray(warnings) ? warnings : [],
        isReady
      };
    };

    setBatchPreparingReview(true);
    try {
      const reviewItems = [];

      for (const file of batchBillFiles) {
        try {
          const parseFormData = new FormData();
          parseFormData.append('file', file);

          const parseResponse = await apiFetcher().post(
            '/utilities/parse-upload',
            parseFormData,
            {
              headers: { 'Content-Type': 'multipart/form-data' }
            }
          );

          reviewItems.push(
            toReviewItem(
              file,
              parseResponse.data?.extracted || {},
              parseResponse.data?.matchedAccount || null,
              parseResponse.data?.warnings || []
            )
          );
        } catch {
          reviewItems.push({
            id: `${file.name}-${file.size}-${file.lastModified}`,
            file,
            fileName: file.name,
            accountId: '',
            billingMonth: '',
            amount: '',
            dueDate: '',
            provider: '',
            type: '',
            warnings: [t('Could not parse this file')],
            isReady: false
          });
        }
      }

      setBatchReviewItems(reviewItems);
      setBatchWorkflowOpen(true);
    } finally {
      setBatchPreparingReview(false);
    }
  };

  const handleBatchReviewChange = (itemId, key, value) => {
    setBatchReviewItems((previous) =>
      previous.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const nextItem = {
          ...item,
          [key]: value
        };
        const amountValue = Number(nextItem.amount);
        nextItem.isReady =
          Boolean(String(nextItem.accountId || '').trim()) &&
          Boolean(String(nextItem.billingMonth || '').trim()) &&
          Number.isFinite(amountValue) &&
          amountValue >= 0;

        return nextItem;
      })
    );
  };

  const handleConfirmBatchWorkflow = async () => {
    const readyItems = batchReviewItems.filter((item) => item.isReady);
    const skippedCount = batchReviewItems.length - readyItems.length;

    if (!readyItems.length) {
      toast.error(t('No ready files to upload. Complete the required fields.'));
      return;
    }

    setBatchUploadingBills(true);
    try {
      let createdCount = 0;
      const failedFiles = [];

      for (const item of readyItems) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', item.file);
          uploadFormData.append('targetType', 'utility_account');
          uploadFormData.append('targetId', String(item.accountId));
          uploadFormData.append('category', 'utility_bill');
          const batchAccount = utilityAccountById[String(item.accountId)];
          if (batchAccount?.accountNumber) {
            uploadFormData.append('accountNumber', batchAccount.accountNumber);
          }
          if (item.billingMonth) {
            uploadFormData.append('billingMonth', item.billingMonth);
          }

          const uploadResponse = await apiFetcher().post(
            '/attachments',
            uploadFormData,
            {
              headers: { 'Content-Type': 'multipart/form-data' }
            }
          );

          const attachmentId = uploadResponse.data?._id || null;

          await apiFetcher().post(`/utility-accounts/${item.accountId}/bills`, {
            billingMonth: item.billingMonth,
            amount: Number(item.amount),
            dueDate: item.dueDate || null,
            paidDate: null,
            notes: `${t('Batch upload')}: ${item.fileName}`,
            attachmentIds: attachmentId ? [attachmentId] : []
          });

          createdCount += 1;
        } catch {
          failedFiles.push(item.fileName);
        }
      }

      if (createdCount > 0) {
        toast.success(
          `${createdCount} ${t('utility bill(s) uploaded and posted')}`
        );
        await utilitiesQuery.refetch();
      }

      if (skippedCount > 0) {
        toast.warning(`${skippedCount} ${t('file(s) were skipped in review')}`);
      }

      if (failedFiles.length) {
        toast.warning(
          `${failedFiles.length} ${t('file(s) failed while posting')}`
        );
      }

      setBatchWorkflowOpen(false);
      setBatchReviewItems([]);
      setBatchBillFiles([]);
    } finally {
      setBatchUploadingBills(false);
    }
  };

  const handleAttachHardCopies = async () => {
    if (!hardCopyFiles.length) {
      toast.error(t('Choose one or more PDF files first'));
      return;
    }
    setHardCopyAttaching(true);
    setHardCopyResults(null);
    const allResults = [];
    for (const file of hardCopyFiles) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await apiFetcher().post('/utilities/attach-bill-scan', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const { extracted, matchedAccount, results, noMatch } = response.data || {};
        allResults.push({
          fileName: file.name,
          extracted,
          matchedAccount,
          results: results || [],
          noMatch: noMatch || false
        });
      } catch (error) {
        allResults.push({
          fileName: file.name,
          error: error?.response?.data?.message || t('Failed to process file')
        });
      }
    }
    setHardCopyResults(allResults);
    setHardCopyAttaching(false);
    const attached = allResults.reduce((sum, r) => sum + (r.results || []).filter((x) => x.status === 'attached').length, 0);
    const noMatch = allResults.filter((r) => r.noMatch).length;
    if (attached > 0) {
      queryClient.invalidateQueries(['utilities-all']);
      toast.success(t('{{n}} bill(s) attached to existing records', { n: attached }));
    }
    if (noMatch > 0) {
      toast.warning(t('{{n}} file(s) could not be matched to any existing bill', { n: noMatch }));
    }
  };

  const handleTaxSplitChange = (splitField, index, key, value) => {
    setTaxDraft((previous) => ({
      ...previous,
      [splitField]: previous[splitField].map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          [key]: value
        };
      })
    }));
  };

  const handleAddTaxSplitRow = (splitField) => {
    setTaxDraft((previous) => ({
      ...previous,
      [splitField]: [
        ...previous[splitField],
        { subPropertyId: '', percentage: '' }
      ]
    }));
  };

  const handleRemoveTaxSplitRow = (splitField, index) => {
    setTaxDraft((previous) => ({
      ...previous,
      [splitField]:
        previous[splitField].length === 1
          ? [{ subPropertyId: '', percentage: '' }]
          : previous[splitField].filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const resetTaxDraft = () => {
    setTaxDraft(getInitialTaxDraft());
    setTaxFile(null);
    setTaxAllocationCarriedOver(false);
  };

  const applyTaxAllocationCarryOver = (value) => {
    const key = normalizeAccountKey(value);
    if (!key) {
      return;
    }
    const match = allocationByAccountNumber.get(key);
    if (!match) {
      return;
    }
    // Read latest draft from a ref so fast input events don't miss carry-over.
    const currentDraft = taxDraftRef.current;
    const alreadyHasSplits =
      currentDraft.buildingUnitSplits.some((r) => r.subPropertyId) ||
      currentDraft.landUnitSplits.some((r) => r.subPropertyId);
    if (alreadyHasSplits) {
      return;
    }
    setTaxAllocationCarriedOver(true);
    setTaxDraft((previous) => {
      const preserveHistoricalEstimate = isHistoricalTaxYearLabel(
        previous.taxYearLabel
      );

      return {
        ...previous,
        propertyId: previous.propertyId || String(match.propertyId || ''),
        landLeasedPercentage: String(
          match.landLeasedPercentage ?? previous.landLeasedPercentage
        ),
        estimatedIncreasePercentage: String(
          preserveHistoricalEstimate
            ? previous.estimatedIncreasePercentage
            : (match.estimatedIncreasePercentage ??
                previous.estimatedIncreasePercentage)
        ),
        buildingUnitSplits: (match.buildingUnitSplits || []).length
          ? match.buildingUnitSplits.map((item) => ({
              subPropertyId: String(item.subPropertyId),
              percentage: String(item.percentage)
            }))
          : previous.buildingUnitSplits,
        landUnitSplits: (match.landUnitSplits || []).length
          ? match.landUnitSplits.map((item) => ({
              subPropertyId: String(item.subPropertyId),
              percentage: String(item.percentage)
            }))
          : previous.landUnitSplits
      };
    });
  };

  const handleTaxAccountNumberChange = (value) => {
    setTaxAllocationCarriedOver(false);
    setTaxDraft((previous) => ({ ...previous, accountNumber: value }));
    // When using a datalist, onChange fires on selection; apply carry-over here
    // so it works regardless of whether onBlur fires.
    applyTaxAllocationCarryOver(value);
  };

  const handleTaxAccountNumberBlur = (value) => {
    applyTaxAllocationCarryOver(value);
  };

  const handleEditTaxStatement = (statement) => {
    setTaxAllocationCarriedOver(false);
    setTaxDraft({
      id: statement._id,
      propertyId: String(statement.propertyId || ''),
      taxYearLabel: statement.taxYearLabel || '',
      periodStart: statement.periodStart
        ? String(statement.periodStart).slice(0, 10)
        : '',
      periodEnd: statement.periodEnd
        ? String(statement.periodEnd).slice(0, 10)
        : '',
      county: statement.county || '',
      accountNumber: statement.accountNumber || '',
      mapNumber: statement.mapNumber || '',
      rmvLandLastYear: String(statement.rmvLandLastYear ?? ''),
      rmvLandThisYear: String(statement.rmvLandThisYear ?? ''),
      rmvBuildingLastYear: String(statement.rmvBuildingLastYear ?? ''),
      rmvBuildingThisYear: String(statement.rmvBuildingThisYear ?? ''),
      rmvTotalLastYear: String(statement.rmvTotalLastYear ?? ''),
      rmvTotalThisYear: String(statement.rmvTotalThisYear ?? ''),
      assessedValueLastYear: String(statement.assessedValueLastYear ?? ''),
      assessedValueThisYear: String(statement.assessedValueThisYear ?? ''),
      propertyTaxesLastYear: String(statement.propertyTaxesLastYear ?? ''),
      propertyTaxesThisYear: String(statement.propertyTaxesThisYear ?? ''),
      taxBeforeDiscount: String(statement.taxBeforeDiscount ?? ''),
      delinquentTaxes: String(statement.delinquentTaxes ?? ''),
      totalAfterDiscount: String(statement.totalAfterDiscount ?? ''),
      landLeasedPercentage: String(statement.landLeasedPercentage ?? '100'),
      buildingUnitSplits: (statement.buildingUnitSplits || []).length
        ? statement.buildingUnitSplits.map((item) => ({
            subPropertyId: String(item.subPropertyId),
            percentage: String(item.percentage)
          }))
        : [{ subPropertyId: '', percentage: '' }],
      landUnitSplits: (statement.landUnitSplits || []).length
        ? statement.landUnitSplits.map((item) => ({
            subPropertyId: String(item.subPropertyId),
            percentage: String(item.percentage)
          }))
        : [{ subPropertyId: '', percentage: '' }],
      estimatedIncreasePercentage: String(
        statement.estimatedIncreasePercentage ?? '3.5'
      ),
      priorYearEstimatedTotal: String(statement.priorYearEstimatedTotal ?? ''),
      notes: statement.notes || ''
    });
    setTaxFile(null);
    setUtilitiesTab('tax-edit');
  };

  const normalizeTaxSplit = (items, label) => {
    const draftedItems = items.filter(
      (item) => item.subPropertyId || String(item.percentage).trim() !== ''
    );

    if (!draftedItems.length) {
      return { value: [], error: null };
    }

    const missingUnit = draftedItems.some((item) => !item.subPropertyId);
    if (missingUnit) {
      return {
        value: null,
        error: `${label} ${t('split rows must include a sub property')}`
      };
    }

    return {
      value: draftedItems.map((item) => ({
        subPropertyId: String(item.subPropertyId || ''),
        percentage: Number(item.percentage)
      })),
      error: null
    };
  };

  const validateTaxSplit = (items, label) => {
    if (!items.length) {
      return null;
    }

    if (
      new Set(items.map((item) => item.subPropertyId)).size !== items.length
    ) {
      return `${label} ${t('split cannot contain duplicate units')}`;
    }

    if (
      items.some(
        (item) =>
          !Number.isFinite(item.percentage) || Number(item.percentage) < 0
      )
    ) {
      return `${label} ${t('split percentages must be valid numbers')}`;
    }

    if (Math.abs(sumSplitPercentages(items) - 100) > 0.01) {
      return `${label} ${t('split percentages must add up to 100')}`;
    }

    return null;
  };

  const mergeExtractedTaxFields = (payload, extracted = {}) => {
    const merged = { ...payload };
    const numberFields = [
      'rmvLandLastYear',
      'rmvLandThisYear',
      'rmvBuildingLastYear',
      'rmvBuildingThisYear',
      'rmvTotalLastYear',
      'rmvTotalThisYear',
      'assessedValueLastYear',
      'assessedValueThisYear',
      'propertyTaxesLastYear',
      'propertyTaxesThisYear',
      'taxBeforeDiscount',
      'delinquentTaxes',
      'totalAfterDiscount'
    ];

    if (extracted.taxYearLabel && !merged.taxYearLabel) {
      merged.taxYearLabel = String(extracted.taxYearLabel);
    }

    if (extracted.accountNumber && !merged.accountNumber) {
      merged.accountNumber = String(extracted.accountNumber);
    }

    if (extracted.mapNumber && !merged.mapNumber) {
      merged.mapNumber = String(extracted.mapNumber);
    }

    if (extracted.county && !merged.county) {
      merged.county = String(extracted.county);
    }

    if (extracted.periodStart && !merged.periodStart) {
      merged.periodStart = extracted.periodStart;
    }

    if (extracted.periodEnd && !merged.periodEnd) {
      merged.periodEnd = extracted.periodEnd;
    }

    numberFields.forEach((field) => {
      const extractedValue = Number(extracted[field]);
      if (Number.isFinite(extractedValue) && Number(merged[field] || 0) === 0) {
        merged[field] = extractedValue;
      }
    });

    if (isHistoricalTaxYearLabel(merged.taxYearLabel)) {
      if (Number(merged.estimatedIncreasePercentage || 0) === 3.5) {
        // Historical uploads should not project growth by default.
        merged.estimatedIncreasePercentage = 0;
      }

      if (
        merged.priorYearEstimatedTotal === null ||
        merged.priorYearEstimatedTotal === undefined ||
        merged.priorYearEstimatedTotal === ''
      ) {
        const recordedTotal = Number(merged.totalAfterDiscount || 0);
        if (Number.isFinite(recordedTotal) && recordedTotal > 0) {
          merged.priorYearEstimatedTotal = recordedTotal;
        }
      }
    }

    return merged;
  };

  const mergeExtractedTaxDraft = (draft, extracted = {}) => {
    const merged = { ...draft };
    const numberFields = [
      'rmvLandLastYear',
      'rmvLandThisYear',
      'rmvBuildingLastYear',
      'rmvBuildingThisYear',
      'rmvTotalLastYear',
      'rmvTotalThisYear',
      'assessedValueLastYear',
      'assessedValueThisYear',
      'propertyTaxesLastYear',
      'propertyTaxesThisYear',
      'taxBeforeDiscount',
      'delinquentTaxes',
      'totalAfterDiscount'
    ];

    const toDateInputValue = (value) => {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return '';
      }

      return parsed.toISOString().slice(0, 10);
    };

    if (extracted.taxYearLabel && !merged.taxYearLabel) {
      merged.taxYearLabel = String(extracted.taxYearLabel);
    }

    if (extracted.accountNumber && !merged.accountNumber) {
      merged.accountNumber = String(extracted.accountNumber);
    }

    if (extracted.mapNumber && !merged.mapNumber) {
      merged.mapNumber = String(extracted.mapNumber);
    }

    if (extracted.county && !merged.county) {
      merged.county = String(extracted.county);
    }

    if (extracted.periodStart && !merged.periodStart) {
      const formatted = toDateInputValue(extracted.periodStart);
      if (formatted) {
        merged.periodStart = formatted;
      }
    }

    if (extracted.periodEnd && !merged.periodEnd) {
      const formatted = toDateInputValue(extracted.periodEnd);
      if (formatted) {
        merged.periodEnd = formatted;
      }
    }

    numberFields.forEach((field) => {
      const extractedValue = Number(extracted[field]);
      if (Number.isFinite(extractedValue) && Number(merged[field] || 0) === 0) {
        merged[field] = String(extractedValue);
      }
    });

    if (isHistoricalTaxYearLabel(merged.taxYearLabel)) {
      const draftEstimated = String(
        draft.estimatedIncreasePercentage || ''
      ).trim();
      const mergedEstimated = String(
        merged.estimatedIncreasePercentage || ''
      ).trim();
      if (
        draftEstimated === '3.5' &&
        (!mergedEstimated || mergedEstimated === '3.5')
      ) {
        // Historical uploads should default estimate to recorded values.
        merged.estimatedIncreasePercentage = '0';
      }

      if (!String(merged.priorYearEstimatedTotal || '').trim()) {
        const recordedTotal = Number(merged.totalAfterDiscount || 0);
        if (Number.isFinite(recordedTotal) && recordedTotal > 0) {
          merged.priorYearEstimatedTotal = String(recordedTotal);
        }
      }
    }

    return merged;
  };

  const handleAutoFillFromTaxFile = async () => {
    if (!taxFile) {
      toast.error(t('Choose a statement file first'));
      return;
    }

    setParsingTaxUpload(true);
    try {
      const formData = new FormData();
      formData.append('file', taxFile);

      const response = await apiFetcher().post(
        '/property-tax-statements/parse-upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      const extracted = response.data?.extracted || {};
      setTaxDraft((previous) => mergeExtractedTaxDraft(previous, extracted));
      const extractedAccountNumber = String(
        extracted.accountNumber || ''
      ).trim();
      if (extractedAccountNumber) {
        applyTaxAllocationCarryOver(extractedAccountNumber);
      }

      const warnings = response.data?.warnings || [];
      if (warnings.length) {
        toast.warning(warnings.join(' '));
      } else {
        toast.success(t('Statement file parsed and fields auto-filled'));
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          t('Failed to parse statement file for auto-fill')
      );
    } finally {
      setParsingTaxUpload(false);
    }
  };

  const handleSaveTaxStatement = async () => {
    if (!taxDraft.propertyId) {
      toast.error(t('Property is required'));
      return;
    }

    if (!taxDraft.taxYearLabel.trim()) {
      toast.error(t('Tax year label is required'));
      return;
    }

    const normalizedBuildingSplit = normalizeTaxSplit(
      taxDraft.buildingUnitSplits,
      t('Building')
    );
    if (normalizedBuildingSplit.error) {
      toast.error(normalizedBuildingSplit.error);
      return;
    }

    const normalizedLandSplit = normalizeTaxSplit(
      taxDraft.landUnitSplits,
      t('Land')
    );
    if (normalizedLandSplit.error) {
      toast.error(normalizedLandSplit.error);
      return;
    }

    const buildingUnitSplits = normalizedBuildingSplit.value;
    const landUnitSplits = normalizedLandSplit.value;

    const buildingValidationError = validateTaxSplit(
      buildingUnitSplits,
      t('Building')
    );
    if (buildingValidationError) {
      toast.error(buildingValidationError);
      return;
    }

    const landValidationError = validateTaxSplit(landUnitSplits, t('Land'));
    if (landValidationError) {
      toast.error(landValidationError);
      return;
    }

    setSavingTaxStatement(true);
    try {
      const payload = {
        propertyId: taxDraft.propertyId,
        taxYearLabel: taxDraft.taxYearLabel.trim(),
        periodStart: taxDraft.periodStart || null,
        periodEnd: taxDraft.periodEnd || null,
        county: taxDraft.county,
        accountNumber: taxDraft.accountNumber,
        mapNumber: taxDraft.mapNumber,
        rmvLandLastYear: Number(taxDraft.rmvLandLastYear || 0),
        rmvLandThisYear: Number(taxDraft.rmvLandThisYear || 0),
        rmvBuildingLastYear: Number(taxDraft.rmvBuildingLastYear || 0),
        rmvBuildingThisYear: Number(taxDraft.rmvBuildingThisYear || 0),
        rmvTotalLastYear: Number(taxDraft.rmvTotalLastYear || 0),
        rmvTotalThisYear: Number(taxDraft.rmvTotalThisYear || 0),
        assessedValueLastYear: Number(taxDraft.assessedValueLastYear || 0),
        assessedValueThisYear: Number(taxDraft.assessedValueThisYear || 0),
        propertyTaxesLastYear: Number(taxDraft.propertyTaxesLastYear || 0),
        propertyTaxesThisYear: Number(taxDraft.propertyTaxesThisYear || 0),
        taxBeforeDiscount: Number(taxDraft.taxBeforeDiscount || 0),
        delinquentTaxes: Number(taxDraft.delinquentTaxes || 0),
        totalAfterDiscount: Number(taxDraft.totalAfterDiscount || 0),
        landLeasedPercentage: Number(taxDraft.landLeasedPercentage || 0),
        buildingUnitSplits,
        landUnitSplits,
        estimatedIncreasePercentage: Number(
          taxDraft.estimatedIncreasePercentage || 0
        ),
        priorYearEstimatedTotal:
          taxDraft.priorYearEstimatedTotal === ''
            ? null
            : Number(taxDraft.priorYearEstimatedTotal),
        notes: taxDraft.notes,
        attachmentIds: []
      };

      let statement = null;
      if (taxDraft.id) {
        const updateResponse = await apiFetcher().patch(
          `/property-tax-statements/${taxDraft.id}`,
          payload
        );
        statement = updateResponse.data;
      } else {
        const createResponse = await apiFetcher().post(
          '/property-tax-statements',
          payload
        );
        statement = createResponse.data;
      }

      if (taxFile && statement?._id) {
        const formData = new FormData();
        formData.append('file', taxFile);
        formData.append('targetType', 'property_tax_statement');
        formData.append('targetId', statement._id);
        formData.append('category', 'other');

        const uploadResponse = await apiFetcher().post(
          '/attachments',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );

        const uploadedAttachmentId = uploadResponse.data?._id;
        if (uploadedAttachmentId) {
          const attachmentIds = Array.from(
            new Set([...(statement.attachmentIds || []), uploadedAttachmentId])
          );

          let payloadWithExtraction = {
            ...payload,
            attachmentIds
          };

          try {
            const parseResponse = await apiFetcher().get(
              `/property-tax-statements/${statement._id}/attachments/${uploadedAttachmentId}/parse`
            );
            payloadWithExtraction = mergeExtractedTaxFields(
              payloadWithExtraction,
              parseResponse.data?.extracted
            );

            const warnings = parseResponse.data?.warnings || [];
            if (warnings.length) {
              toast.warning(warnings.join(' '));
            } else {
              toast.success(t('Statement fields auto-read from uploaded file'));
            }
          } catch (error) {
            toast.warning(
              error?.response?.data?.message ||
                t('Statement file uploaded but auto-read could not complete')
            );
          }

          await apiFetcher().patch(
            `/property-tax-statements/${statement._id}`,
            payloadWithExtraction
          );
        }
      }

      toast.success(
        taxDraft.id
          ? t('Property tax statement updated')
          : t('Property tax statement added')
      );
      resetTaxDraft();
      await propertyTaxStatementsQuery.refetch();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          t('Failed to save property tax statement')
      );
    } finally {
      setSavingTaxStatement(false);
    }
  };

  const handleDeleteTaxStatement = async (statementId) => {
    try {
      await apiFetcher().delete(`/property-tax-statements/${statementId}`);
      toast.success(t('Property tax statement removed'));
      if (taxDraft.id === statementId) {
        resetTaxDraft();
      }
      if (activeTaxNotesStatementId === statementId) {
        setActiveTaxNotesStatementId('');
      }
      await propertyTaxStatementsQuery.refetch();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          t('Failed to remove property tax statement')
      );
    }
  };

  const handleDownloadTaxAttachment = async (
    statement,
    attachmentId,
    index
  ) => {
    setDownloadingTaxAttachmentId(attachmentId);
    try {
      const response = await apiFetcher().get(
        `/attachments/${attachmentId}/download`,
        {
          responseType: 'blob'
        }
      );

      const fallbackName = `property-tax-${statement.taxYearLabel || 'statement'}-${index + 1}.pdf`;
      const fileName = getFilenameFromDisposition(
        response.headers?.['content-disposition'],
        fallbackName
      );

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || t('Failed to download statement file')
      );
    } finally {
      setDownloadingTaxAttachmentId('');
    }
  };

  const handleAutoReadTaxAttachment = async (statement, attachmentId) => {
    setParsingTaxStatementId(String(statement._id));
    try {
      const response = await apiFetcher().get(
        `/property-tax-statements/${statement._id}/attachments/${attachmentId}/parse`
      );
      const extracted = response.data?.extracted || {};

      const mergedStatement = mergeExtractedTaxFields(statement, extracted);
      handleEditTaxStatement(mergedStatement);

      const warnings = response.data?.warnings || [];
      if (warnings.length) {
        toast.warning(warnings.join(' '));
      } else {
        toast.success(t('Statement fields auto-read successfully'));
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          t('Failed to auto-read statement attachment')
      );
    } finally {
      setParsingTaxStatementId('');
    }
  };

  const handleExportTaxReportCsv = async () => {
    setExportingTaxReportCsv(true);
    try {
      const query = new URLSearchParams();
      if (taxReportPropertyFilter !== 'all') {
        query.set('propertyId', taxReportPropertyFilter);
      }
      if (taxReportYearFilter !== 'all') {
        query.set('taxYearLabel', taxReportYearFilter);
      }
      if (taxReportStatusFilter !== 'all') {
        query.set('status', taxReportStatusFilter);
      }

      const response = await apiFetcher().get(
        `/property-tax-statements/report.csv${query.toString() ? `?${query.toString()}` : ''}`,
        {
          responseType: 'blob'
        }
      );

      const fallbackName = `property-tax-report-${new Date().toISOString().slice(0, 10)}.csv`;
      const fileName = getFilenameFromDisposition(
        response.headers?.['content-disposition'],
        fallbackName
      );

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || t('Failed to export tax report')
      );
    } finally {
      setExportingTaxReportCsv(false);
    }
  };

  const handleStartTaxPaymentLog = (statementId) => {
    setActiveTaxPaymentBatchStatementId('');
    setActiveTaxPaymentStatementId(statementId);
    setActiveTaxPaymentEditIndex(null);
    setTaxPaymentDraft(getInitialTaxPaymentDraft());
    setTaxPaymentFile(null);
    setTaxPaymentBatchFiles([]);
  };

  const handleStartTaxPaymentBatchUpload = (statementId) => {
    setActiveTaxPaymentStatementId('');
    setActiveTaxPaymentEditIndex(null);
    setTaxPaymentDraft(getInitialTaxPaymentDraft());
    setTaxPaymentFile(null);
    setActiveTaxPaymentBatchStatementId(statementId);
    setTaxPaymentBatchFiles([]);
  };

  const handleCancelTaxPaymentBatchUpload = () => {
    setActiveTaxPaymentBatchStatementId('');
    setTaxPaymentBatchFiles([]);
  };

  const handleStartTaxPaymentEdit = (
    statementId,
    confirmation,
    confirmationIndex
  ) => {
    setActiveTaxPaymentBatchStatementId('');
    setActiveTaxPaymentStatementId(statementId);
    setActiveTaxPaymentEditIndex(confirmationIndex);
    setTaxPaymentDraft({
      paidOn: String(confirmation?.paidOn || '').slice(0, 10),
      paidAmount: String(confirmation?.paidAmount ?? ''),
      feeAmount: String(confirmation?.feeAmount ?? ''),
      paymentMethod: String(confirmation?.paymentMethod || ''),
      confirmationNumber: String(confirmation?.confirmationNumber || ''),
      notes: String(confirmation?.notes || '')
    });
    setTaxPaymentFile(null);
    setTaxPaymentBatchFiles([]);
  };

  const handleCancelTaxPaymentLog = () => {
    setActiveTaxPaymentStatementId('');
    setActiveTaxPaymentEditIndex(null);
    setTaxPaymentDraft(getInitialTaxPaymentDraft());
    setTaxPaymentFile(null);
  };

  const mergeExtractedTaxPaymentDraft = (draft, extracted = {}) => {
    const merged = { ...draft };
    const parseDateInput = (value) => {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return '';
      }

      return parsed.toISOString().slice(0, 10);
    };

    const paidOn = parseDateInput(extracted.paidOn);
    const paidAmount = Number(extracted.paidAmount);
    const feeAmount = Number(extracted.feeAmount);

    if (paidOn && !merged.paidOn) {
      merged.paidOn = paidOn;
    }

    if (Number.isFinite(paidAmount) && Number(merged.paidAmount || 0) === 0) {
      merged.paidAmount = String(paidAmount);
    }

    if (Number.isFinite(feeAmount) && Number(merged.feeAmount || 0) === 0) {
      merged.feeAmount = String(feeAmount);
    }

    if (extracted.paymentMethod && !merged.paymentMethod) {
      merged.paymentMethod = String(extracted.paymentMethod);
    }

    if (extracted.confirmationNumber && !merged.confirmationNumber) {
      merged.confirmationNumber = String(extracted.confirmationNumber);
    }

    if (extracted.notes && !merged.notes) {
      merged.notes = String(extracted.notes);
    }

    return merged;
  };

  const handleAutoFillTaxPaymentFromFile = async () => {
    if (!taxPaymentFile) {
      toast.error(t('Choose a confirmation file first'));
      return;
    }

    setParsingTaxPaymentUpload(true);
    try {
      const formData = new FormData();
      formData.append('file', taxPaymentFile);

      const response = await apiFetcher().post(
        '/property-tax-statements/payment-confirmations/parse-upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      const extracted = response.data?.extracted || {};
      setTaxPaymentDraft((previous) =>
        mergeExtractedTaxPaymentDraft(previous, extracted)
      );

      const warnings = response.data?.warnings || [];
      if (warnings.length) {
        toast.warning(warnings.join(' '));
      } else {
        toast.success(t('Confirmation file parsed and fields auto-filled'));
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          t('Failed to parse confirmation file for auto-fill')
      );
    } finally {
      setParsingTaxPaymentUpload(false);
    }
  };

  const handleBatchUploadTaxPaymentConfirmations = async () => {
    if (!taxPaymentBatchFiles.length) {
      toast.error(t('Choose one or more confirmation files first'));
      return;
    }

    setBatchUploadingTaxPayments(true);
    let createdCount = 0;
    const skippedMissingRequired = [];
    const skippedMissingAccount = [];
    const skippedUnmatchedAccount = [];
    const skippedParse = [];

    try {
      for (const file of taxPaymentBatchFiles) {
        let extracted = {};

        try {
          const parseFormData = new FormData();
          parseFormData.append('file', file);
          const parseResponse = await apiFetcher().post(
            '/property-tax-statements/payment-confirmations/parse-upload',
            parseFormData,
            {
              headers: { 'Content-Type': 'multipart/form-data' }
            }
          );
          extracted = parseResponse.data?.extracted || {};
        } catch {
          skippedParse.push(file.name);
          continue;
        }

        const extractedAccountNumber = String(
          extracted.accountNumber || ''
        ).trim();
        const paidOn = String(extracted.paidOn || '').slice(0, 10);
        const paidAmount = Number(extracted.paidAmount || 0);
        const feeAmount = Number(extracted.feeAmount || 0);

        if (!paidOn || !Number.isFinite(paidAmount) || paidAmount <= 0) {
          skippedMissingRequired.push(file.name);
          continue;
        }

        if (!extractedAccountNumber) {
          skippedMissingAccount.push(file.name);
          continue;
        }

        const normalizedExtractedAccount = extractedAccountNumber
          .toLowerCase()
          .replace(/\s+/g, '');

        const matchedStatements = propertyTaxStatements.filter((item) =>
          String(item.accountNumber || '')
            .toLowerCase()
            .replace(/\s+/g, '') === normalizedExtractedAccount
        );

        if (!matchedStatements.length) {
          skippedUnmatchedAccount.push(file.name);
          continue;
        }

        const targetStatement = [...matchedStatements].sort((left, right) => {
          const leftYear = Number(
            String(left.taxYearLabel || '').match(/(20\d{2})/)?.[1] || 0
          );
          const rightYear = Number(
            String(right.taxYearLabel || '').match(/(20\d{2})/)?.[1] || 0
          );
          if (leftYear !== rightYear) {
            return rightYear - leftYear;
          }

          const leftDate = new Date(
            left.updatedAt || left.createdAt || 0
          ).getTime();
          const rightDate = new Date(
            right.updatedAt || right.createdAt || 0
          ).getTime();
          return rightDate - leftDate;
        })[0];

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('targetType', 'property_tax_statement');
        uploadFormData.append('targetId', targetStatement._id);
        uploadFormData.append('category', 'tax_payment_confirmation');

        let attachmentIds = [];
        const uploadResponse = await apiFetcher().post(
          '/attachments',
          uploadFormData,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
        if (uploadResponse.data?._id) {
          attachmentIds = [uploadResponse.data._id];
        }

        await apiFetcher().post(
          `/property-tax-statements/${targetStatement._id}/payment-confirmations`,
          {
            paidOn,
            paidAmount,
            feeAmount: Number.isFinite(feeAmount) && feeAmount >= 0 ? feeAmount : 0,
            paymentMethod: String(extracted.paymentMethod || ''),
            confirmationNumber: String(extracted.confirmationNumber || ''),
            notes: String(extracted.notes || ''),
            attachmentIds
          }
        );

        createdCount += 1;
      }

      if (createdCount > 0) {
        toast.success(
          `${createdCount} ${t('payment confirmation(s) uploaded')}`
        );
      }

      if (skippedMissingRequired.length) {
        toast.warning(
          `${skippedMissingRequired.length} ${t('file(s) skipped due to missing paid date/amount')}`
        );
      }

      if (skippedMissingAccount.length) {
        toast.warning(
          `${skippedMissingAccount.length} ${t('file(s) skipped because account number could not be extracted')}`
        );
      }

      if (skippedUnmatchedAccount.length) {
        toast.warning(
          `${skippedUnmatchedAccount.length} ${t('file(s) skipped because account number did not match any saved statement')}`
        );
      }

      if (skippedParse.length) {
        toast.warning(
          `${skippedParse.length} ${t('file(s) skipped because parsing failed')}`
        );
      }

      setTaxPaymentBatchFiles([]);
      setActiveTaxPaymentBatchStatementId('');
      await propertyTaxStatementsQuery.refetch();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          t('Failed to batch upload payment confirmations')
      );
    } finally {
      setBatchUploadingTaxPayments(false);
    }
  };

  const buildTaxStatementUpdatePayload = (statement, overrides = {}) => ({
    propertyId: statement.propertyId,
    taxYearLabel: statement.taxYearLabel,
    periodStart: statement.periodStart || null,
    periodEnd: statement.periodEnd || null,
    county: statement.county || '',
    accountNumber: statement.accountNumber || '',
    mapNumber: statement.mapNumber || '',
    rmvLandLastYear: Number(statement.rmvLandLastYear || 0),
    rmvLandThisYear: Number(statement.rmvLandThisYear || 0),
    rmvBuildingLastYear: Number(statement.rmvBuildingLastYear || 0),
    rmvBuildingThisYear: Number(statement.rmvBuildingThisYear || 0),
    rmvTotalLastYear: Number(statement.rmvTotalLastYear || 0),
    rmvTotalThisYear: Number(statement.rmvTotalThisYear || 0),
    assessedValueLastYear: Number(statement.assessedValueLastYear || 0),
    assessedValueThisYear: Number(statement.assessedValueThisYear || 0),
    propertyTaxesLastYear: Number(statement.propertyTaxesLastYear || 0),
    propertyTaxesThisYear: Number(statement.propertyTaxesThisYear || 0),
    taxBeforeDiscount: Number(statement.taxBeforeDiscount || 0),
    delinquentTaxes: Number(statement.delinquentTaxes || 0),
    totalAfterDiscount: Number(statement.totalAfterDiscount || 0),
    landLeasedPercentage: Number(statement.landLeasedPercentage || 0),
    buildingUnitSplits: Array.isArray(statement.buildingUnitSplits)
      ? statement.buildingUnitSplits
      : [],
    landUnitSplits: Array.isArray(statement.landUnitSplits)
      ? statement.landUnitSplits
      : [],
    estimatedIncreasePercentage: Number(statement.estimatedIncreasePercentage || 0),
    priorYearEstimatedTotal:
      statement.priorYearEstimatedTotal === null ||
      statement.priorYearEstimatedTotal === undefined
        ? null
        : Number(statement.priorYearEstimatedTotal),
    notes: statement.notes || '',
    attachmentIds: Array.isArray(statement.attachmentIds)
      ? statement.attachmentIds
      : [],
    paymentConfirmations: Array.isArray(statement.paymentConfirmations)
      ? statement.paymentConfirmations
      : [],
    ...overrides
  });

  const handleSaveTaxPaymentConfirmation = async (statement) => {
    const paidAmount = Number(taxPaymentDraft.paidAmount);
    const feeAmount = Number(taxPaymentDraft.feeAmount || 0);
    const isEditing =
      activeTaxPaymentStatementId === statement._id &&
      Number.isInteger(activeTaxPaymentEditIndex) &&
      activeTaxPaymentEditIndex >= 0;
    const paymentConfirmations = Array.isArray(statement.paymentConfirmations)
      ? statement.paymentConfirmations
      : [];
    const editingConfirmation = isEditing
      ? paymentConfirmations[activeTaxPaymentEditIndex]
      : null;

    if (!taxPaymentDraft.paidOn) {
      toast.error(t('Paid date is required'));
      return;
    }

    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      toast.error(t('Paid amount must be a positive number'));
      return;
    }

    if (!Number.isFinite(feeAmount) || feeAmount < 0) {
      toast.error(t('Fee amount must be a non-negative number'));
      return;
    }

    setSavingTaxPaymentConfirmation(true);
    try {
      let attachmentIds = Array.isArray(editingConfirmation?.attachmentIds)
        ? editingConfirmation.attachmentIds
        : [];

      if (taxPaymentFile) {
        const formData = new FormData();
        formData.append('file', taxPaymentFile);
        formData.append('targetType', 'property_tax_statement');
        formData.append('targetId', statement._id);
        formData.append('category', 'tax_payment_confirmation');

        const uploadResponse = await apiFetcher().post(
          '/attachments',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );

        if (uploadResponse.data?._id) {
          attachmentIds = Array.from(
            new Set([...attachmentIds, uploadResponse.data._id])
          );
        }
      }

      if (isEditing) {
        const updatedConfirmations = paymentConfirmations.map(
          (confirmation, index) => {
            if (index !== activeTaxPaymentEditIndex) {
              return confirmation;
            }

            return {
              ...confirmation,
              paidOn: taxPaymentDraft.paidOn,
              paidAmount,
              feeAmount,
              paymentMethod: taxPaymentDraft.paymentMethod,
              confirmationNumber: taxPaymentDraft.confirmationNumber,
              notes: taxPaymentDraft.notes,
              attachmentIds
            };
          }
        );

        await apiFetcher().patch(
          `/property-tax-statements/${statement._id}`,
          buildTaxStatementUpdatePayload(statement, {
            paymentConfirmations: updatedConfirmations
          })
        );

        toast.success(t('Payment confirmation updated'));
      } else {
        await apiFetcher().post(
          `/property-tax-statements/${statement._id}/payment-confirmations`,
          {
            paidOn: taxPaymentDraft.paidOn,
            paidAmount,
            feeAmount,
            paymentMethod: taxPaymentDraft.paymentMethod,
            confirmationNumber: taxPaymentDraft.confirmationNumber,
            notes: taxPaymentDraft.notes,
            attachmentIds
          }
        );

        toast.success(t('Payment confirmation logged'));
      }

      handleCancelTaxPaymentLog();
      await propertyTaxStatementsQuery.refetch();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          (isEditing
            ? t('Failed to update payment confirmation')
            : t('Failed to log payment confirmation'))
      );
    } finally {
      setSavingTaxPaymentConfirmation(false);
    }
  };

  const handleDeleteTaxPaymentConfirmation = async (
    statement,
    confirmationIndex
  ) => {
    const paymentConfirmations = Array.isArray(statement.paymentConfirmations)
      ? statement.paymentConfirmations
      : [];

    if (
      confirmationIndex < 0 ||
      confirmationIndex >= paymentConfirmations.length
    ) {
      return;
    }

    const confirmationKey = `${statement._id}-${confirmationIndex}`;
    setDeletingTaxPaymentConfirmationKey(confirmationKey);
    try {
      const updatedConfirmations = paymentConfirmations.filter(
        (_, index) => index !== confirmationIndex
      );

      await apiFetcher().patch(
        `/property-tax-statements/${statement._id}`,
        buildTaxStatementUpdatePayload(statement, {
          paymentConfirmations: updatedConfirmations
        })
      );

      if (
        activeTaxPaymentStatementId === statement._id &&
        Number.isInteger(activeTaxPaymentEditIndex) &&
        activeTaxPaymentEditIndex === confirmationIndex
      ) {
        handleCancelTaxPaymentLog();
      }

      toast.success(t('Payment confirmation deleted'));
      await propertyTaxStatementsQuery.refetch();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          t('Failed to delete payment confirmation')
      );
    } finally {
      setDeletingTaxPaymentConfirmationKey('');
    }
  };

  const downloadBlobAsFile = (blob, fileName) => {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  };

  const getFirstUtilityAttachmentId = (utility) => {
    const attachmentIds = Array.isArray(utility?.attachmentIds)
      ? utility.attachmentIds
      : [];

    if (!attachmentIds.length) {
      return '';
    }

    return String(attachmentIds[0]);
  };

  const queryClient = useQueryClient();

  const generateInvoicesMutation = useMutation({
    mutationFn: async (utilityId) => {
      const response = await apiFetcher().post('/utility-invoices/generate', {
        utilityId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['utilities-all']);
      queryClient.invalidateQueries(['utility-invoices']);
      toast.success(t('Invoices generated successfully'));
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || t('Failed to generate invoices')
      );
    }
  });

  const handleGenerateInvoices = useCallback(
    (utilityId) => generateInvoicesMutation.mutate(utilityId),
    [generateInvoicesMutation]
  );

  const logQbPostedMutation = useMutation({
    mutationFn: async ({ utilityId, qbReference }) => {
      const response = await apiFetcher().post(`/utilities/${utilityId}/qb-posted`, {
        qbReference
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['utilities-all']);
      toast.success(t('QuickBooks posting logged'));
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || t('Failed to log QB posting')
      );
    }
  });

  const handleLogQbPosted = useCallback(
    (utilityId, qbReference) =>
      logQbPostedMutation.mutate({ utilityId, qbReference }),
    [logQbPostedMutation]
  );

  const [recapturingUtilityId, setRecapturingUtilityId] = useState('');
  const [reuploadUtilityId, setReuploadUtilityId] = useState('');

  const handleRecaptureEmailBill = useCallback(
    async (utilityId) => {
      setRecapturingUtilityId(utilityId);
      try {
        const response = await apiFetcher().post(`/utilities/${utilityId}/recapture-bill-from-email`);
        const msg = response.data?.message || t('Bill restored from email');
        if (response.data?.restored === false) {
          toast.info(msg);
        } else {
          toast.success(msg);
          queryClient.invalidateQueries(['utilities-all']);
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message || t('Failed to recapture bill from email')
        );
      } finally {
        setRecapturingUtilityId('');
      }
    },
    [queryClient, t]
  );

  const handleReuploadBill = useCallback(
    async (utility, file) => {
      if (!file) return;
      setReuploadUtilityId(String(utility._id));
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetType', 'utility');
        formData.append('targetId', String(utility._id));
        formData.append('category', 'utility_bill');
        if (utility.accountNumber) formData.append('accountNumber', utility.accountNumber);
        if (utility.billingMonth) formData.append('billingMonth', utility.billingMonth);

        const uploadRes = await apiFetcher().post('/attachments', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const newAttachmentId = uploadRes.data?._id;
        if (!newAttachmentId) throw new Error('Upload failed');

        // Keep non-PDF attachments (email text) and append the new PDF
        const nonPdfIds = (utility.attachments || [])
          .filter((a) => !a.mimeType?.includes('pdf'))
          .map((a) => String(a._id));

        await apiFetcher().patch(`/utilities/${utility._id}`, {
          attachmentIds: [...nonPdfIds, newAttachmentId]
        });

        toast.success(t('Bill file uploaded'));
        queryClient.invalidateQueries(['utilities-all']);
      } catch (error) {
        toast.error(
          error?.response?.data?.message || t('Failed to upload bill file')
        );
      } finally {
        setReuploadUtilityId('');
      }
    },
    [queryClient, t]
  );

  const handlePreviewAttachment = useCallback(
    async (attachmentId, fallbackName = 'bill', knownMimeType = '') => {
      setWorkingUtilityAttachmentId(attachmentId);
      const usePopup = previewMode === 'popup';

      if (usePopup) {
        // Get a signed token URL and navigate the popup directly to it.
        // Adobe/external viewers will open it; that is the desired behaviour for popup mode.
        const win = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
        if (win) {
          win.document.write('<html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#666;background:#f5f5f5"><div style="text-align:center"><div style="font-size:2rem;margin-bottom:1rem">⏳</div><div>Loading…</div></div></body></html>');
          win.document.close();
        }
        try {
          const { data } = await apiFetcher().get(`/attachments/${attachmentId}/view-token`);
          const baseURL = apiFetcher().defaults.baseURL || '';
          const fileUrl = `${baseURL}/attachments/${attachmentId}/view?token=${encodeURIComponent(data.token)}&raw=1`;
          if (win && !win.closed) win.location.href = fileUrl;
          else window.open(fileUrl, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
        } catch (error) {
          if (win && !win.closed) win.close();
          toast.error(error?.response?.data?.message || t('Failed to open bill preview'));
        } finally {
          setWorkingUtilityAttachmentId('');
        }
      } else {
        // Modal: fetch blob so the iframe can embed it without auth headers
        setModalPreviewUrl('');
        setModalPreviewName(fallbackName);
        setModalPreviewOpen(true);
        try {
          const response = await apiFetcher().get(
            `/attachments/${attachmentId}/download`,
            { responseType: 'blob' }
          );
          const blobUrl = window.URL.createObjectURL(response.data);
          const fileName = getFilenameFromDisposition(
            response.headers?.['content-disposition'],
            fallbackName
          );
          setModalPreviewUrl(blobUrl);
          setModalPreviewName(fileName);
        } catch (error) {
          setModalPreviewOpen(false);
          let message = t('Failed to open bill preview');
          if (error?.response?.data instanceof Blob) {
            try { message = JSON.parse(await error.response.data.text()).message || message; } catch {}
          } else if (error?.response?.data?.message) {
            message = error.response.data.message;
          }
          toast.error(message);
        } finally {
          setWorkingUtilityAttachmentId('');
        }
      }
    },
    [previewMode, t]
  );

  const handleDownloadAttachment = useCallback(
    async (attachmentId, fallbackName = 'bill') => {
      setWorkingUtilityAttachmentId(attachmentId);
      try {
        const response = await apiFetcher().get(
          `/attachments/${attachmentId}/download`,
          { responseType: 'blob' }
        );
        const fileName = getFilenameFromDisposition(
          response.headers?.['content-disposition'],
          fallbackName
        );
        downloadBlobAsFile(response.data, fileName);
      } catch (error) {
        let message = t('Failed to download bill file');
        if (error?.response?.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            message = JSON.parse(text).message || message;
          } catch {}
        } else if (error?.response?.data?.message) {
          message = error.response.data.message;
        }
        toast.error(message);
      } finally {
        setWorkingUtilityAttachmentId('');
      }
    },
    [t]
  );

  const [removingAttachmentId, setRemovingAttachmentId] = useState('');
  const [deletingUtilityId, setDeletingUtilityId] = useState('');
  const [togglingPaidUtilityId, setTogglingPaidUtilityId] = useState('');

  const handleRemoveAttachment = useCallback(
    async (utility, attachmentId) => {
      setRemovingAttachmentId(attachmentId);
      try {
        await apiFetcher().delete(`/attachments/${attachmentId}`);
        const remaining = (utility.attachmentIds || []).filter(
          (id) => String(id) !== String(attachmentId)
        );
        await apiFetcher().patch(`/utilities/${utility._id}`, {
          attachmentIds: remaining
        });
        queryClient.invalidateQueries(['utilities-all']);
      } catch (error) {
        toast.error(error?.response?.data?.message || t('Failed to remove file'));
      } finally {
        setRemovingAttachmentId('');
      }
    },
    [queryClient, t]
  );

  const handleTogglePaidStatus = useCallback(
    async (utility) => {
      setTogglingPaidUtilityId(String(utility._id));
      try {
        const newPaidDate = utility.paidDate
          ? null
          : new Date().toISOString().slice(0, 10);
        await apiFetcher().patch(`/utilities/${utility._id}/paid`, {
          paidDate: newPaidDate
        });
        queryClient.invalidateQueries(['utilities-all']);
      } catch (error) {
        toast.error(error?.response?.data?.message || t('Failed to update paid status'));
      } finally {
        setTogglingPaidUtilityId('');
      }
    },
    [queryClient, t]
  );

  const handleDeleteUtility = useCallback(
    async (utilityId) => {
      setDeletingUtilityId(String(utilityId));
      try {
        await apiFetcher().delete(`/utilities/${utilityId}`);
        queryClient.invalidateQueries(['utilities-all']);
        toast.success(t('Utility record deleted'));
      } catch (error) {
        toast.error(error?.response?.data?.message || t('Failed to delete record'));
      } finally {
        setDeletingUtilityId('');
      }
    },
    [queryClient, t]
  );

  const handleDownloadUtilityBillAttachment = async (utility) => {
    const attachmentId = getFirstUtilityAttachmentId(utility);
    if (!attachmentId) {
      toast.error(t('No source bill attachment found'));
      return;
    }

    setWorkingUtilityAttachmentId(attachmentId);
    try {
      const response = await apiFetcher().get(
        `/attachments/${attachmentId}/download`,
        {
          responseType: 'blob'
        }
      );

      const fallbackName = `utility-bill-${utility.billingMonth || 'record'}.pdf`;
      const fileName = getFilenameFromDisposition(
        response.headers?.['content-disposition'],
        fallbackName
      );

      downloadBlobAsFile(response.data, fileName);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || t('Failed to download bill file')
      );
    } finally {
      setWorkingUtilityAttachmentId('');
    }
  };

  const handlePreviewUtilityBillAttachment = async (utility) => {
    const attachmentId = getFirstUtilityAttachmentId(utility);
    if (!attachmentId) {
      toast.error(t('No source bill attachment found'));
      return;
    }
    const fallbackName = `utility-bill-${utility.billingMonth || 'record'}.pdf`;
    return handlePreviewAttachment(attachmentId, fallbackName, '');
  };

  const handlePreviewBatchReviewFile = (item) => {
    if (!item?.file) {
      toast.error(t('No PDF file available for preview'));
      return;
    }
    const blobUrl = window.URL.createObjectURL(item.file);
    window.open(blobUrl, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
  };

  const handleDownloadBatchReviewFile = (item) => {
    if (!item?.file) {
      toast.error(t('No PDF file available for download'));
      return;
    }

    setWorkingBatchReviewItemId(String(item.id || ''));
    downloadBlobAsFile(item.file, item.fileName || 'utility-bill.pdf');
    setWorkingBatchReviewItemId('');
  };

  const handleOpenEmailConnectionSettings = () => {
    router.push(`/${organizationSlug}/settings/utilities-email-connection`);
  };

  const handleDeduplicateUtilities = async () => {
    setDeduplicating(true);
    try {
      const response = await apiFetcher().post('/utilities/deduplicate');
      const { deleted = 0, groups = 0 } = response.data || {};
      if (deleted > 0) {
        queryClient.invalidateQueries(['utilities-all']);
        toast.success(
          t('Removed {{n}} duplicate email-imported record(s) across {{g}} bill(s)', {
            n: deleted,
            g: groups
          })
        );
      } else {
        toast.info(
          t('No duplicates found — email records without a matching manual entry are kept')
        );
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || t('Failed to deduplicate bills')
      );
    } finally {
      setDeduplicating(false);
    }
  };

  const handleBackfillAmounts = async () => {
    setBackfillingAmounts(true);
    try {
      const response = await apiFetcher().post('/utilities/backfill-original-amount');
      const { updated = 0 } = response.data || {};
      if (updated > 0) {
        queryClient.invalidateQueries(['utilities-all']);
        toast.success(t('Updated {{n}} bill record(s) with full bill total', { n: updated }));
      } else {
        toast.info(t('All email-imported bills already have correct totals'));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || t('Failed to update bill totals'));
    } finally {
      setBackfillingAmounts(false);
    }
  };

  const handleImportEmailConfirmations = async () => {
    setCheckingEmailInbox(true);
    try {
      const response = await apiFetcher().post('/utilities/import-email-confirmations', {
        limit: 50
      });
      const summary = response.data || {};
      toast.success(
        t('Email import complete: {{created}} created, {{duplicates}} duplicate(s), {{failed}} failed', {
          created: Number(summary.created || 0),
          duplicates: Number(summary.duplicates || 0),
          failed: Number(summary.failed || 0)
        })
      );
      await utilitiesQuery.refetch();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || t('Failed to import email confirmations')
      );
    } finally {
      setCheckingEmailInbox(false);
    }
  };

  const handleApprovePendingUtility = async (utilityId) => {
    setWorkingPendingActionId(String(utilityId || ''));
    try {
      await apiFetcher().post(`/utilities/${utilityId}/approve-pending`);
      toast.success(t('Pending confirmation approved'));
      await utilitiesQuery.refetch();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          t('Failed to approve pending confirmation')
      );
    } finally {
      setWorkingPendingActionId('');
    }
  };

  const handleRejectPendingUtility = async (utilityId) => {
    setWorkingPendingActionId(String(utilityId || ''));
    try {
      await apiFetcher().delete(`/utilities/${utilityId}/reject-pending`);
      toast.success(t('Pending confirmation rejected'));
      await utilitiesQuery.refetch();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          t('Failed to reject pending confirmation')
      );
    } finally {
      setWorkingPendingActionId('');
    }
  };

  return (
    <Page loading={loading} dataCy="utilitiesPage">
      <Card className="p-6 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <UtilitiesHeaderIcon isTaxOnly={isTaxOnly} />
            <h1 className="text-2xl font-bold">
              {isTaxOnly ? t('Property taxes') : t('Utilities')}
            </h1>
          </div>
          <div className="text-sm text-muted-foreground">
            {isTaxOnly
              ? `${propertyTaxStatements.length} ${t('tax statement(s)')}`
              : `${filteredUtilities.length} ${t('entry(ies)')} • ${utilityAccounts.length} ${t('saved account(s)')}${isUtilitiesOnly ? '' : ` • ${propertyTaxStatements.length} ${t('tax statement(s)')}`} • ${toCurrency(totalAmount)}`}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isTaxOnly ? (
            <>
              <Button
                variant={utilitiesTab === 'list' ? 'default' : 'outline'}
                onClick={() => setUtilitiesTab('list')}
              >
                {t('Saved utility bills')}
              </Button>
              <Button
                variant={
                  utilitiesTab === 'pending-email' ? 'default' : 'outline'
                }
                onClick={() => setUtilitiesTab('pending-email')}
              >
                {t('Pending confirmations')}
              </Button>
              <Button
                variant={utilitiesTab === 'bills' ? 'default' : 'outline'}
                onClick={() => setUtilitiesTab('bills')}
              >
                {t('Add utility bill')}
              </Button>
              <Button
                variant={utilitiesTab === 'accounts' ? 'default' : 'outline'}
                onClick={() => setUtilitiesTab('accounts')}
              >
                {t('Utility account setup')}
              </Button>
              <Button
                variant="outline"
                onClick={handleImportEmailConfirmations}
                disabled={checkingEmailInbox}
              >
                <LuRefreshCw className="size-4 mr-2" />
                {checkingEmailInbox
                  ? t('Checking inbox...')
                  : t('Check email inbox now')}
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenEmailConnectionSettings}
              >
                <LuSettings2 className="size-4 mr-2" />
                {t('Email connection settings')}
              </Button>
              <Button
                variant="outline"
                onClick={handleDeduplicateUtilities}
                disabled={deduplicating}
                title={t('Remove pending email-imported records that duplicate a confirmed bill')}
              >
                <LuRefreshCw className={`size-4 mr-2 ${deduplicating ? 'animate-spin' : ''}`} />
                {deduplicating ? t('Deduplicating...') : t('Resolve duplicates')}
              </Button>
              <Button
                variant="outline"
                onClick={handleBackfillAmounts}
                disabled={backfillingAmounts}
                title={t('Set the full bill total on email-imported records that are missing it')}
              >
                <LuRefreshCw className={`size-4 mr-2 ${backfillingAmounts ? 'animate-spin' : ''}`} />
                {backfillingAmounts ? t('Fixing...') : t('Fix bill totals')}
              </Button>
            </>
          ) : null}
          {!isUtilitiesOnly ? (
            <>
              <Button
                variant={utilitiesTab === 'tax-new' ? 'default' : 'outline'}
                onClick={() => {
                  resetTaxDraft();
                  setUtilitiesTab('tax-new');
                }}
              >
                <LuLandmark className="size-4 mr-2" />
                {t('New tax entry')}
              </Button>
              <Button
                variant={utilitiesTab === 'tax-edit' ? 'default' : 'outline'}
                onClick={() => setUtilitiesTab('tax-edit')}
                disabled={!taxDraft.id}
                title={
                  !taxDraft.id
                    ? t('Open an entry from Saved statements to edit')
                    : undefined
                }
              >
                <LuLandmark className="size-4 mr-2" />
                {t('Edit entry')}
              </Button>
              <Button
                variant={utilitiesTab === 'tax-view' ? 'default' : 'outline'}
                onClick={() => setUtilitiesTab('tax-view')}
                disabled={!taxDraft.id}
                title={
                  !taxDraft.id
                    ? t(
                        'Open an entry from Saved statements to view its cost split'
                      )
                    : undefined
                }
              >
                <LuFileSearch className="size-4 mr-2" />
                {t('Cost split')}
              </Button>
              <Button
                variant={utilitiesTab === 'tax-saved' ? 'default' : 'outline'}
                onClick={() => setUtilitiesTab('tax-saved')}
              >
                <LuFileSearch className="size-4 mr-2" />
                {t('Saved statements')}
              </Button>
              <Button
                variant={utilitiesTab === 'tax-report' ? 'default' : 'outline'}
                onClick={() => setUtilitiesTab('tax-report')}
              >
                <LuFileSpreadsheet className="size-4 mr-2" />
                {t('Tax payment report')}
              </Button>
            </>
          ) : null}
        </div>

        {!isTaxOnly && utilitiesTab === 'accounts' ? (
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
              <div className="flex items-center gap-2">
                {accountDraft.id ? (
                  <div className="text-xs text-muted-foreground">
                    {t('Editing')}: {accountDraft.accountNumber}
                  </div>
                ) : null}
                {accountDraft.id ? (
                  <Button variant="outline" onClick={resetAccountDraft}>
                    {t('Clear')}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">
                  {t('Edit existing account')}
                </label>
                <select
                  value={accountDraft.id || ''}
                  onChange={(event) =>
                    handleSelectExistingUtilityAccount(event.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                >
                  <option value="">{t('Create new account')}</option>
                  {utilityAccounts.map((utilityAccount) => (
                    <option key={utilityAccount._id} value={utilityAccount._id}>
                      {utilityAccount.accountNumber} •{' '}
                      {formatCategoryLabel(utilityAccount.type)}
                    </option>
                  ))}
                </select>
              </div>
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
                      {type === 'custom'
                        ? t('Custom category')
                        : formatCategoryLabel(type)}
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
                          {utilityAccount.accountNumber} •{' '}
                          {formatCategoryLabel(utilityAccount.type)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {utilityAccount.provider || t('No provider')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatAllocationSummary(
                            utilityAccount.allocations,
                            propertyById
                          )}
                        </div>
                        {(utilityAccount.allocationHistory || []).length ? (
                          <div className="text-xs text-muted-foreground pt-1">
                            <Button
                              variant="outline"
                              className="h-7 px-2"
                              onClick={() =>
                                setExpandedAllocationHistoryAccountId(
                                  expandedAllocationHistoryAccountId ===
                                    String(utilityAccount._id)
                                    ? ''
                                    : String(utilityAccount._id)
                                )
                              }
                            >
                              {expandedAllocationHistoryAccountId ===
                              String(utilityAccount._id)
                                ? t('Hide split history')
                                : t('Show split history')}{' '}
                              ({(utilityAccount.allocationHistory || []).length}
                              )
                            </Button>
                          </div>
                        ) : null}
                        {expandedAllocationHistoryAccountId ===
                        String(utilityAccount._id) ? (
                          <div className="mt-2 space-y-2">
                            {(utilityAccount.allocationHistory || []).map(
                              (entry, entryIndex) => (
                                <div
                                  key={`${utilityAccount._id}-history-${entryIndex}`}
                                  className="rounded border p-2"
                                >
                                  <div className="text-xs text-muted-foreground">
                                    {entry.changedAt
                                      ? new Date(
                                          entry.changedAt
                                        ).toLocaleString()
                                      : t('Unknown time')}
                                    {entry.changedBy
                                      ? ` • ${entry.changedBy}`
                                      : ''}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {t('Was')}:{' '}
                                    {formatAllocationSummary(
                                      entry.previousAllocations,
                                      propertyById
                                    ) || t('None')}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {t('Now')}:{' '}
                                    {formatAllocationSummary(
                                      entry.nextAllocations,
                                      propertyById
                                    ) || t('None')}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : null}
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

        {!isTaxOnly && utilitiesTab === 'bills' ? (
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

            <div className="rounded-md border bg-muted/20 p-3 space-y-3">
              <div className="text-sm font-medium">{t('Upload bill PDF')}</div>
              <p className="text-xs text-muted-foreground">
                {t(
                  'Upload a bill PDF first to auto-fill fields or auto-post to the matched account and split.'
                )}
              </p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) =>
                    setBillFile(event.target.files?.[0] || null)
                  }
                />
                <Button
                  variant="outline"
                  onClick={handleAutoFillFromBillFile}
                  disabled={!billFile || parsingUtilityUpload}
                >
                  {parsingUtilityUpload
                    ? t('Reading bill...')
                    : t('Auto-fill from bill file')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUploadBillPdfToMatchedAccount}
                  disabled={!billFile || parsingUtilityUpload}
                >
                  {parsingUtilityUpload
                    ? t('Uploading PDF...')
                    : t('Upload PDF to matched account')}
                </Button>
              </div>
            </div>

            <div className="rounded-md border bg-muted/20 p-3 space-y-2">
              <div className="text-sm font-medium">
                {t('Attach hard copies to existing bills')}
              </div>
              <p className="text-xs text-muted-foreground">
                {t(
                  'Upload scanned PDFs of physical bills. Each file is matched to an existing bill record by account number and billing month. Bills that already have a file attached are skipped.'
                )}
              </p>
              <Input
                type="file"
                accept="application/pdf,image/*"
                multiple
                onChange={(event) =>
                  setHardCopyFiles(Array.from(event.target.files || []))
                }
              />
              <div className="text-xs text-muted-foreground">
                {hardCopyFiles.length
                  ? t('{{count}} file(s) selected', { count: hardCopyFiles.length })
                  : t('No files selected')}
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleAttachHardCopies}
                  disabled={!hardCopyFiles.length || hardCopyAttaching}
                >
                  {hardCopyAttaching ? t('Attaching...') : t('Attach to existing bills')}
                </Button>
              </div>
              {hardCopyResults ? (
                <div className="mt-2 border rounded text-xs overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground">
                        <th className="px-2 py-1">{t('File')}</th>
                        <th className="px-2 py-1">{t('Matched account')}</th>
                        <th className="px-2 py-1">{t('Billing month')}</th>
                        <th className="px-2 py-1">{t('Result')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hardCopyResults.map((r, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-2 py-1 max-w-[160px] truncate" title={r.fileName}>{r.fileName}</td>
                          <td className="px-2 py-1">{r.matchedAccount?.accountNumber || (r.extracted?.accountNumber ? `${r.extracted.accountNumber} (unmatched)` : '—')}</td>
                          <td className="px-2 py-1">{r.extracted?.billingMonth || '—'}</td>
                          <td className="px-2 py-1">
                            {r.error ? (
                              <span className="text-red-600">{r.error}</span>
                            ) : r.noMatch ? (
                              <span className="text-amber-600">{t('No matching bill found')}</span>
                            ) : (
                              (r.results || []).map((res, j) => (
                                <div key={j}>
                                  {res.status === 'attached' ? (
                                    <span className="text-green-700">{t('Attached')}</span>
                                  ) : res.status === 'skipped_has_file' ? (
                                    <span className="text-muted-foreground">{t('Already has file')}</span>
                                  ) : res.status}
                                </div>
                              ))
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>

            <div className="rounded-md border bg-muted/20 p-3 space-y-2">
              <div className="text-sm font-medium">
                {t('Batch upload bills')}
              </div>
              <p className="text-xs text-muted-foreground">
                {t(
                  'Upload multiple bill files at once. Each file is auto-read, matched to a saved account number, then posted through that account allocation split.'
                )}
              </p>
              <Input
                type="file"
                accept="application/pdf"
                multiple
                onChange={(event) =>
                  setBatchBillFiles(Array.from(event.target.files || []))
                }
              />
              <div className="text-xs text-muted-foreground">
                {batchBillFiles.length
                  ? t('{{count}} file(s) selected', {
                      count: batchBillFiles.length
                    })
                  : t('No files selected')}
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleBatchUploadUtilityBills}
                  disabled={
                    !batchBillFiles.length ||
                    batchUploadingBills ||
                    batchPreparingReview
                  }
                >
                  {batchPreparingReview
                    ? t('Preparing review...')
                    : t('Review in popup')}
                </Button>
              </div>
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
                      {utilityAccount.accountNumber} •{' '}
                      {formatCategoryLabel(utilityAccount.type)}
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
                    {billDraft.accountNumber} •{' '}
                    {formatCategoryLabel(billDraft.type)}
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
                          {type === 'custom'
                            ? t('Custom category')
                            : formatCategoryLabel(type)}
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

        {!isUtilitiesOnly &&
        (utilitiesTab === 'tax-new' ||
          utilitiesTab === 'tax-edit' ||
          utilitiesTab === 'tax-view' ||
          utilitiesTab === 'tax-saved') ? (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  {utilitiesTab === 'tax-saved'
                    ? t('Saved property tax statements')
                    : utilitiesTab === 'tax-edit'
                      ? t('Edit tax entry')
                      : utilitiesTab === 'tax-view'
                        ? t('Cost split analysis')
                        : t('New tax entry')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {utilitiesTab === 'tax-saved'
                    ? t(
                        'Review saved tax statements, attachments, payment confirmations, and notes.'
                      )
                    : utilitiesTab === 'tax-edit'
                      ? t(
                          'Update an existing tax statement. Changes are saved when you click Update statement.'
                        )
                      : utilitiesTab === 'tax-view'
                        ? t(
                            'Read-only view of how taxes are distributed across units. Click Edit entry to make changes.'
                          )
                        : t(
                            'Capture a new annual tax statement. Upload a PDF to auto-fill fields, split building and land by unit, and track next-year estimates.'
                          )}
                </p>
              </div>
              {utilitiesTab === 'tax-new' && taxDraft.id ? (
                <Button variant="outline" onClick={resetTaxDraft}>
                  {t('Clear')}
                </Button>
              ) : null}
              {(utilitiesTab === 'tax-edit' || utilitiesTab === 'tax-view') &&
              taxDraft.id ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    setActiveTaxNotesStatementId((previous) =>
                      previous === taxDraft.id ? '' : taxDraft.id
                    )
                  }
                >
                  {activeTaxNotesStatementId === taxDraft.id
                    ? t('Hide notes')
                    : t('Notes')}
                </Button>
              ) : null}
              {utilitiesTab === 'tax-edit' && taxDraft.id ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    resetTaxDraft();
                    setUtilitiesTab('tax-saved');
                  }}
                >
                  {t('Stop editing')}
                </Button>
              ) : null}
              {utilitiesTab === 'tax-view' && taxDraft.id ? (
                <Button onClick={() => setUtilitiesTab('tax-edit')}>
                  {t('Edit entry')}
                </Button>
              ) : null}
            </div>

            {utilitiesTab === 'tax-new' || utilitiesTab === 'tax-edit' ? (
              <>
                <div className="rounded-md border bg-muted/20 p-3 space-y-2">
                  <div className="text-sm font-medium">
                    {t('Upload statement PDF')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'Upload a tax statement PDF and we will try to auto-fill matching fields. Always review the values before saving.'
                    )}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(event) =>
                        setTaxFile(event.target.files?.[0] || null)
                      }
                    />
                    <Button
                      variant="outline"
                      onClick={handleAutoFillFromTaxFile}
                      disabled={parsingTaxUpload || !taxFile}
                    >
                      <LuFileSearch className="size-4 mr-2" />
                      {parsingTaxUpload
                        ? t('Reading PDF...')
                        : t('Upload PDF and auto-fill')}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Property')}
                    </label>
                    <select
                      value={taxDraft.propertyId}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          propertyId: event.target.value,
                          buildingUnitSplits: [
                            { subPropertyId: '', percentage: '' }
                          ],
                          landUnitSplits: [
                            { subPropertyId: '', percentage: '' }
                          ]
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                    >
                      <option value="">{t('Select property')}</option>
                      {topLevelPropertyOptions.map((property) => (
                        <option key={property._id} value={property._id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Tax year')}
                    </label>
                    <Input
                      type="text"
                      placeholder={t('e.g. 2024-2025')}
                      value={taxDraft.taxYearLabel}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          taxYearLabel: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Period start')}
                    </label>
                    <Input
                      type="date"
                      value={taxDraft.periodStart}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          periodStart: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Period end')}
                    </label>
                    <Input
                      type="date"
                      value={taxDraft.periodEnd}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          periodEnd: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Map number')}
                    </label>
                    <Input
                      type="text"
                      value={taxDraft.mapNumber}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          mapNumber: event.target.value
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('County')}
                    </label>
                    <Input
                      type="text"
                      value={taxDraft.county}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          county: event.target.value
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Account number')}
                    </label>
                    <Input
                      type="text"
                      list="tax-account-number-suggestions"
                      value={taxDraft.accountNumber}
                      onChange={(event) =>
                        handleTaxAccountNumberChange(event.target.value)
                      }
                      onBlur={(event) =>
                        handleTaxAccountNumberBlur(event.target.value)
                      }
                    />
                    <datalist id="tax-account-number-suggestions">
                      {Array.from(allocationByAccountNumber.keys()).map(
                        (key) => (
                          <option
                            key={key}
                            value={
                              allocationByAccountNumber.get(key)
                                ?.accountNumber || key
                            }
                          />
                        )
                      )}
                    </datalist>
                    {taxAllocationCarriedOver ? (
                      <p className="text-xs text-blue-600 mt-1">
                        {t(
                          'Allocation splits carried over from previous entry with the same account number. Review and adjust as needed.'
                        )}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Tax before discount')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.taxBeforeDiscount}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          taxBeforeDiscount: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Delinquent taxes')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.delinquentTaxes}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          delinquentTaxes: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Total after discount')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.totalAfterDiscount}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          totalAfterDiscount: event.target.value
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('RMV land (last year)')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.rmvLandLastYear}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          rmvLandLastYear: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('RMV land (this year)')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.rmvLandThisYear}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          rmvLandThisYear: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('RMV building (last year)')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.rmvBuildingLastYear}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          rmvBuildingLastYear: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('RMV building (this year)')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.rmvBuildingThisYear}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          rmvBuildingThisYear: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('RMV total (last year)')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.rmvTotalLastYear}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          rmvTotalLastYear: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('RMV total (this year)')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.rmvTotalThisYear}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          rmvTotalThisYear: event.target.value
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Assessed value (last year)')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.assessedValueLastYear}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          assessedValueLastYear: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Assessed value (this year)')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.assessedValueThisYear}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          assessedValueThisYear: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Property taxes (last year)')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.propertyTaxesLastYear}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          propertyTaxesLastYear: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Property taxes (this year)')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.propertyTaxesThisYear}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          propertyTaxesThisYear: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Land leased %')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxDraft.landLeasedPercentage}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          landLeasedPercentage: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Estimated increase %')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.estimatedIncreasePercentage}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          estimatedIncreasePercentage: event.target.value
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">
                      {t('Prior estimated total')}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={taxDraft.priorYearEstimatedTotal}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          priorYearEstimatedTotal: event.target.value
                        }))
                      }
                    />
                  </div>

                  {isHistoricalDefaultEstimateActive(taxDraft) ? (
                    <div className="md:col-span-2 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      {t(
                        'Historical tax year detected. Estimate defaults use recorded values (0% increase and prior estimate equal to total after discount). You can adjust either field anytime.'
                      )}
                    </div>
                  ) : null}

                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">
                      {t('Notes')}
                    </label>
                    <Input
                      type="text"
                      value={taxDraft.notes}
                      onChange={(event) =>
                        setTaxDraft((previous) => ({
                          ...previous,
                          notes: event.target.value
                        }))
                      }
                    />
                  </div>
                </div>
              </>
            ) : null}

            {utilitiesTab === 'tax-new' ||
            utilitiesTab === 'tax-edit' ||
            utilitiesTab === 'tax-view' ? (
              <>
                {utilitiesTab !== 'tax-view' ? (
                  <div className="text-sm text-muted-foreground">
                    {t(
                      'Use land leased % and split percentages to preview how taxes are distributed. Building share uses (100 - land leased %).'
                    )}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {t('Building split by unit')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t(
                            'Use when splitting building taxes across sub properties'
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleAddTaxSplitRow('buildingUnitSplits')
                        }
                      >
                        <LuPlus className="size-4 mr-2" />
                        {t('Add row')}
                      </Button>
                    </div>
                    {taxDraft.buildingUnitSplits.map((item, index) => (
                      <div
                        key={`building-${index}-${item.subPropertyId}`}
                        className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,2fr)_140px_80px]"
                      >
                        <select
                          value={item.subPropertyId}
                          onChange={(event) =>
                            handleTaxSplitChange(
                              'buildingUnitSplits',
                              index,
                              'subPropertyId',
                              event.target.value
                            )
                          }
                          className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                        >
                          <option value="">{t('Select sub property')}</option>
                          {unitOptionsForTaxDraft.map((property) => (
                            <option key={property._id} value={property._id}>
                              {property.name}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.percentage}
                          onChange={(event) =>
                            handleTaxSplitChange(
                              'buildingUnitSplits',
                              index,
                              'percentage',
                              event.target.value
                            )
                          }
                        />
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleRemoveTaxSplitRow('buildingUnitSplits', index)
                          }
                        >
                          <LuTrash2 className="size-4 mr-2" />
                          {t('Remove')}
                        </Button>
                      </div>
                    ))}
                    <div
                      className={`text-xs ${
                        Math.abs(buildingSplitTotal - 100) <= 0.01
                          ? 'text-muted-foreground'
                          : 'text-red-600'
                      }`}
                    >
                      {t('Building split total')}:{' '}
                      {formatPercentage(buildingSplitTotal)}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {t('Land split by unit')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t(
                            'Use when splitting land taxes across sub properties'
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleAddTaxSplitRow('landUnitSplits')}
                      >
                        <LuPlus className="size-4 mr-2" />
                        {t('Add row')}
                      </Button>
                    </div>
                    {taxDraft.landUnitSplits.map((item, index) => (
                      <div
                        key={`land-${index}-${item.subPropertyId}`}
                        className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,2fr)_140px_80px]"
                      >
                        <select
                          value={item.subPropertyId}
                          onChange={(event) =>
                            handleTaxSplitChange(
                              'landUnitSplits',
                              index,
                              'subPropertyId',
                              event.target.value
                            )
                          }
                          className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                        >
                          <option value="">{t('Select sub property')}</option>
                          {unitOptionsForTaxDraft.map((property) => (
                            <option key={property._id} value={property._id}>
                              {property.name}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.percentage}
                          onChange={(event) =>
                            handleTaxSplitChange(
                              'landUnitSplits',
                              index,
                              'percentage',
                              event.target.value
                            )
                          }
                        />
                        <Button
                          variant="outline"
                          onClick={() =>
                            handleRemoveTaxSplitRow('landUnitSplits', index)
                          }
                        >
                          <LuTrash2 className="size-4 mr-2" />
                          {t('Remove')}
                        </Button>
                      </div>
                    ))}
                    <div
                      className={`text-xs ${
                        Math.abs(landSplitTotal - 100) <= 0.01
                          ? 'text-muted-foreground'
                          : 'text-red-600'
                      }`}
                    >
                      {t('Land split total')}:{' '}
                      {formatPercentage(landSplitTotal)}
                    </div>
                  </div>
                </div>

                {(() => {
                  // Derive a "next year" label from taxYearLabel if it looks like YYYY-YYYY
                  const rawLabel = taxDraft.taxYearLabel || '';
                  const yearMatch = rawLabel.match(
                    /^(\d{4})\s*[-–]\s*(\d{4})$/
                  );
                  const currentYearLabel = rawLabel || t('Current year');
                  const nextYearLabel = yearMatch
                    ? `${Number(yearMatch[1]) + 1}-${Number(yearMatch[2]) + 1}`
                    : t('Next year estimate');

                  return (
                    <div className="rounded-lg border p-4 space-y-4">
                      {/* ── Prominent period header ── */}
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {t('Per-unit tax allocation preview')}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {rawLabel ? (
                              <span className="text-xl font-bold tracking-tight">
                                {rawLabel}
                              </span>
                            ) : null}
                            {taxDraft.periodStart || taxDraft.periodEnd ? (
                              <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                {taxDraft.periodStart || '?'}
                                {taxDraft.periodEnd
                                  ? ` → ${taxDraft.periodEnd}`
                                  : ''}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {draftTaxAllocationPreview.estimatedIncreasePercentage ? (
                          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm dark:border-amber-800 dark:bg-amber-950">
                            <span className="text-muted-foreground">
                              {t('Est. increase')}
                            </span>{' '}
                            <span className="font-bold text-amber-700 dark:text-amber-400">
                              {formatPercentage(
                                draftTaxAllocationPreview.estimatedIncreasePercentage
                              )}
                            </span>
                            <span className="ml-1 text-xs text-muted-foreground">
                              → {nextYearLabel}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* ── Table ── */}
                      {!draftTaxAllocationPreview.combinedRows.length ? (
                        <div className="text-sm text-muted-foreground">
                          {t(
                            'Select a property and add split rows to see per-unit cost distribution.'
                          )}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              {/* Column group labels */}
                              <tr>
                                <th className="pb-0 pr-3" />
                                <th className="pb-0 px-2" />
                                <th
                                  colSpan={2}
                                  className="pb-1 px-2 text-center text-xs font-semibold text-foreground border-b-2 border-foreground/20 whitespace-nowrap"
                                >
                                  {currentYearLabel}
                                </th>
                                <th
                                  colSpan={2}
                                  className="pb-1 px-2 text-center text-xs font-bold text-amber-700 dark:text-amber-400 border-b-2 border-amber-400 whitespace-nowrap bg-amber-50/60 dark:bg-amber-950/40 rounded-t"
                                >
                                  ★ {t('Est.')} {nextYearLabel}
                                </th>
                              </tr>
                              {/* Column headers */}
                              <tr className="border-b">
                                <th className="text-left py-1.5 pr-3 font-semibold text-foreground">
                                  {t('Unit')}
                                </th>
                                <th className="text-right py-1.5 px-2 font-semibold text-foreground whitespace-nowrap">
                                  %
                                </th>
                                <th className="text-right py-1.5 px-2 font-semibold text-foreground whitespace-nowrap">
                                  {t('Annual')}
                                </th>
                                <th className="text-right py-1.5 px-2 font-semibold text-foreground whitespace-nowrap">
                                  / {t('Month')}
                                </th>
                                <th className="text-right py-1.5 px-2 font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap bg-amber-50/60 dark:bg-amber-950/40">
                                  {t('Annual')}
                                </th>
                                <th className="text-right py-1.5 pl-2 font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap bg-amber-50/60 dark:bg-amber-950/40">
                                  / {t('Month')}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {draftTaxAllocationPreview.combinedRows.map(
                                (row) => (
                                  <>
                                    {/* Unit name header row — spans all columns */}
                                    <tr
                                      key={`unit-header-${row.unitId}`}
                                      className="bg-muted/50"
                                    >
                                      <td
                                        colSpan={6}
                                        className="py-1.5 px-2 font-semibold text-foreground text-xs uppercase tracking-wide"
                                      >
                                        {row.unitName}
                                      </td>
                                    </tr>
                                    {/* Building sub-row */}
                                    {row.buildingAmount > 0 ? (
                                      <tr
                                        key={`unit-building-${row.unitId}`}
                                        className="text-muted-foreground border-b border-muted/30"
                                      >
                                        <td className="py-1 pr-3 pl-4">
                                          {t('Building')}
                                        </td>
                                        <td className="text-right py-1 px-2 tabular-nums">
                                          {formatPercentage(
                                            row.buildingPercentage
                                          )}
                                        </td>
                                        <td className="text-right py-1 px-2 tabular-nums">
                                          {toCurrency(row.buildingAmount)}
                                        </td>
                                        <td className="text-right py-1 px-2 tabular-nums">
                                          {toCurrency(row.buildingAmount / 12)}
                                        </td>
                                        <td className="text-right py-1 px-2 tabular-nums bg-amber-50/60 dark:bg-amber-950/40">
                                          {toCurrency(
                                            row.nextYearBuildingAmount
                                          )}
                                        </td>
                                        <td className="text-right py-1 pl-2 tabular-nums bg-amber-50/60 dark:bg-amber-950/40">
                                          {toCurrency(
                                            row.nextYearBuildingAmount / 12
                                          )}
                                        </td>
                                      </tr>
                                    ) : null}
                                    {/* Land sub-row */}
                                    {row.landAmount > 0 ? (
                                      <tr
                                        key={`unit-land-${row.unitId}`}
                                        className="text-muted-foreground border-b border-muted/30"
                                      >
                                        <td className="py-1 pr-3 pl-4">
                                          {t('Land')}
                                        </td>
                                        <td className="text-right py-1 px-2 tabular-nums">
                                          {formatPercentage(row.landPercentage)}
                                        </td>
                                        <td className="text-right py-1 px-2 tabular-nums">
                                          {toCurrency(row.landAmount)}
                                        </td>
                                        <td className="text-right py-1 px-2 tabular-nums">
                                          {toCurrency(row.landAmount / 12)}
                                        </td>
                                        <td className="text-right py-1 px-2 tabular-nums bg-amber-50/60 dark:bg-amber-950/40">
                                          {toCurrency(row.nextYearLandAmount)}
                                        </td>
                                        <td className="text-right py-1 pl-2 tabular-nums bg-amber-50/60 dark:bg-amber-950/40">
                                          {toCurrency(
                                            row.nextYearLandAmount / 12
                                          )}
                                        </td>
                                      </tr>
                                    ) : null}
                                    {/* Unit total row */}
                                    <tr
                                      key={`unit-${row.unitId}`}
                                      className="border-b-2 border-muted/60"
                                    >
                                      <td className="py-1.5 pr-3 pl-4 font-semibold">
                                        {t('Unit total')}
                                      </td>
                                      <td className="text-right py-1.5 px-2 tabular-nums font-semibold text-muted-foreground">
                                        {formatPercentage(
                                          row.totalSharePercentage
                                        )}
                                      </td>
                                      <td className="text-right py-1.5 px-2 tabular-nums font-semibold">
                                        {toCurrency(row.totalAmount)}
                                      </td>
                                      <td className="text-right py-1.5 px-2 tabular-nums font-semibold">
                                        {toCurrency(
                                          row.currentYearMonthlyAmount
                                        )}
                                      </td>
                                      <td className="text-right py-1.5 px-2 tabular-nums font-semibold text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40">
                                        {toCurrency(row.nextYearAnnualAmount)}
                                      </td>
                                      <td className="text-right py-1.5 pl-2 tabular-nums font-semibold text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40">
                                        {toCurrency(row.nextYearMonthlyAmount)}
                                      </td>
                                    </tr>
                                  </>
                                )
                              )}
                              {/* Totals row */}
                              <tr className="border-t-2 font-bold">
                                <td className="py-2 pr-3">{t('Total')}</td>
                                <td className="text-right py-2 px-2 tabular-nums text-muted-foreground">
                                  100%
                                </td>
                                <td className="text-right py-2 px-2 tabular-nums">
                                  {toCurrency(
                                    draftTaxAllocationPreview.totalTax
                                  )}
                                </td>
                                <td className="text-right py-2 px-2 tabular-nums">
                                  {toCurrency(
                                    draftTaxAllocationPreview.currentYearMonthlyTotal
                                  )}
                                </td>
                                <td className="text-right py-2 px-2 tabular-nums text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40">
                                  {toCurrency(
                                    draftTaxAllocationPreview.nextYearTotal
                                  )}
                                </td>
                                <td className="text-right py-2 pl-2 tabular-nums text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40">
                                  {toCurrency(
                                    draftTaxAllocationPreview.nextYearMonthlyTotal
                                  )}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            ) : null}

            {utilitiesTab === 'tax-new' || utilitiesTab === 'tax-edit' ? (
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveTaxStatement}
                  disabled={savingTaxStatement}
                >
                  {savingTaxStatement
                    ? t('Saving...')
                    : taxDraft.id
                      ? t('Update statement')
                      : t('Save statement')}
                </Button>
              </div>
            ) : null}

            {(utilitiesTab === 'tax-edit' || utilitiesTab === 'tax-view') &&
            taxDraft.id &&
            activeTaxNotesStatementId === taxDraft.id ? (
              <div className="border-t pt-3">
                <NotesPanel
                  entityType="property_tax_statement"
                  entityId={String(taxDraft.id)}
                />
              </div>
            ) : null}

            {utilitiesTab === 'tax-saved' ? (
              <div className="space-y-2 border-t pt-4">
                <div className="text-sm font-medium">
                  {t('Saved property tax statements')}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="relative md:col-span-1">
                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t(
                        'Search by property, year, map, account, notes...'
                      )}
                      value={taxSearchText}
                      onChange={(event) => setTaxSearchText(event.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div>
                    <select
                      value={taxPropertyFilter}
                      onChange={(event) =>
                        setTaxPropertyFilter(event.target.value)
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                    >
                      <option value="all">{t('All properties')}</option>
                      {topLevelPropertyOptions.map((property) => (
                        <option key={property._id} value={property._id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={taxYearFilter}
                      onChange={(event) => setTaxYearFilter(event.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                    >
                      <option value="all">{t('All tax years')}</option>
                      {taxYearOptions.map((taxYearLabel) => (
                        <option key={taxYearLabel} value={taxYearLabel}>
                          {taxYearLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-md border p-3 space-y-2">
                  <div className="text-xs font-semibold">
                    {t('Batch upload payment confirmations')}
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                    <div>
                      <label className="text-xs text-muted-foreground">
                        {t('Auto-match rule')}
                      </label>
                      <div className="w-full px-3 py-2 border rounded-md text-sm bg-muted/20 text-muted-foreground">
                        {t(
                          'Each file is matched by parsed account number to saved tax statement account number.'
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        {t('Confirmation files')}
                      </label>
                      <Input
                        type="file"
                        multiple
                        onChange={(event) =>
                          setTaxPaymentBatchFiles(
                            Array.from(event.target.files || [])
                          )
                        }
                      />
                    </div>
                    <div className="flex gap-2 justify-end md:justify-start">
                      <Button
                        variant="outline"
                        onClick={handleCancelTaxPaymentBatchUpload}
                      >
                        {t('Clear')}
                      </Button>
                      <Button
                        onClick={handleBatchUploadTaxPaymentConfirmations}
                        disabled={
                          batchUploadingTaxPayments ||
                          !taxPaymentBatchFiles.length
                        }
                      >
                        {batchUploadingTaxPayments
                          ? t('Uploading batch...')
                          : t('Batch upload & auto-fill')}
                      </Button>
                    </div>
                  </div>
                </div>

                {!propertyTaxStatements.length ? (
                  <div className="text-sm text-muted-foreground">
                    {t('No property tax statements saved yet')}
                  </div>
                ) : !filteredTaxStatements.length ? (
                  <div className="text-sm text-muted-foreground">
                    {t('No tax statements found for current filters')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTaxStatements.map((statement) => {
                      const property =
                        propertyById[String(statement.propertyId)];
                      const paymentConfirmations = Array.isArray(
                        statement.paymentConfirmations
                      )
                        ? statement.paymentConfirmations
                        : [];
                      const totalPaid = paymentConfirmations.reduce(
                        (sum, c) => sum + Number(c.paidAmount || 0),
                        0
                      );
                      const totalFees = paymentConfirmations.reduce(
                        (sum, c) => sum + Number(c.feeAmount || 0),
                        0
                      );
                      const total = Number(statement.totalAfterDiscount || 0);
                      const signedBalance = Number(
                        (total - totalPaid).toFixed(2)
                      );
                      const balance = Math.max(0, signedBalance);
                      const overpaidAmount = Math.max(0, -signedBalance);
                      const isPaid = balance === 0 && total > 0;
                      const isOverpaid = overpaidAmount > 0;
                      const paidPct =
                        total > 0
                          ? Math.min(100, (totalPaid / total) * 100)
                          : 0;
                      const notesOpen =
                        activeTaxNotesStatementId === statement._id;

                      return (
                        <div
                          key={statement._id}
                          className="rounded-lg border overflow-hidden"
                        >
                          {/* ── Header bar ── */}
                          <div className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 bg-muted/30 border-b">
                            <div className="space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base font-bold">
                                  {statement.taxYearLabel || t('Unknown year')}
                                </span>
                                <span className="text-base text-muted-foreground">
                                  • {property?.name || t('Unknown property')}
                                </span>
                                {isOverpaid ? (
                                  <span className="rounded-full bg-cyan-100 text-cyan-700 text-xs font-semibold px-2 py-0.5">
                                    {t('Overpaid')}
                                  </span>
                                ) : isPaid ? (
                                  <span className="rounded-full bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5">
                                    {t('Paid')}
                                  </span>
                                ) : totalPaid > 0 ? (
                                  <span className="rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5">
                                    {t('Partial')}
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5">
                                    {t('Unpaid')}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {statement.periodStart
                                  ? `${String(statement.periodStart).slice(0, 10)} → ${String(statement.periodEnd || '').slice(0, 10)}`
                                  : t('Period not set')}
                                {statement.accountNumber
                                  ? ` • ${t('Account')}: ${statement.accountNumber}`
                                  : ''}
                                {statement.county
                                  ? ` • ${t('County')}: ${statement.county}`
                                  : ''}
                                {statement.mapNumber
                                  ? ` • ${t('Map')}: ${statement.mapNumber}`
                                  : ''}
                                {statement.lastUpdatedBy
                                  ? ` • ${t('Updated by')}: ${statement.lastUpdatedBy}`
                                  : ''}
                              </div>
                            </div>
                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setActiveTaxNotesStatementId((prev) =>
                                    prev === statement._id ? '' : statement._id
                                  )
                                }
                              >
                                {notesOpen ? t('Hide notes') : t('Notes')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleEditTaxStatement(statement)
                                }
                              >
                                {t('Edit')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  handleEditTaxStatement(statement);
                                  setUtilitiesTab('tax-view');
                                }}
                              >
                                {t('View cost split')}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() =>
                                  handleDeleteTaxStatement(statement._id)
                                }
                              >
                                {t('Delete')}
                              </Button>
                            </div>
                          </div>

                          {/* ── Key metrics ── */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 border-b">
                            <div className="px-4 py-3">
                              <div className="text-xs text-muted-foreground mb-0.5">
                                {statement.taxYearLabel || t('This year')}{' '}
                                {t('total')}
                              </div>
                              <div className="text-lg font-bold tabular-nums">
                                {toCurrency(statement.totalAfterDiscount)}
                              </div>
                              <div className="text-xs text-muted-foreground tabular-nums">
                                {toCurrency(
                                  Number(statement.totalAfterDiscount || 0) / 12
                                )}{' '}
                                / {t('mo')}
                              </div>
                            </div>
                            <div className="px-4 py-3 bg-amber-50/60 dark:bg-amber-950/30">
                              <div className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">
                                ★{' '}
                                {(() => {
                                  const m = String(
                                    statement.taxYearLabel || ''
                                  ).match(/^(\d{4})\s*[-–]\s*(\d{4})$/);
                                  return m
                                    ? `${t('Est.')} ${Number(m[1]) + 1}-${Number(m[2]) + 1}`
                                    : t('Next year est.');
                                })()}
                              </div>
                              <div className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-400">
                                {toCurrency(statement.estimatedNextYearTotal)}
                              </div>
                              <div className="text-xs text-amber-600 dark:text-amber-500 tabular-nums">
                                {toCurrency(statement.estimatedMonthlyCost)} /{' '}
                                {t('mo')}
                              </div>
                            </div>
                            <div className="px-4 py-3">
                              <div className="text-xs text-muted-foreground mb-0.5">
                                {t('Paid')}
                              </div>
                              <div className="text-lg font-bold tabular-nums">
                                {toCurrency(totalPaid)}
                              </div>
                              <div className="text-xs text-muted-foreground tabular-nums">
                                {totalFees > 0
                                  ? `${t('Fees')}: ${toCurrency(totalFees)}`
                                  : t('No fees')}
                              </div>
                            </div>
                            <div className="px-4 py-3">
                              <div className="text-xs text-muted-foreground mb-0.5">
                                {isOverpaid ? t('Overpaid') : t('Remaining')}
                              </div>
                              <div
                                className={`text-lg font-bold tabular-nums ${isOverpaid ? 'text-cyan-600' : balance > 0 ? 'text-destructive' : 'text-green-600'}`}
                              >
                                {toCurrency(
                                  isOverpaid ? overpaidAmount : balance
                                )}
                              </div>
                              {total > 0 ? (
                                <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${isOverpaid ? 'bg-cyan-500' : isPaid ? 'bg-green-500' : 'bg-amber-500'}`}
                                    style={{ width: `${paidPct}%` }}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {/* ── Body ── */}
                          <div className="px-4 py-3 space-y-4">
                            {/* Variance */}
                            {statement.priorYearVariance !== undefined &&
                            statement.priorYearVariance !== null ? (
                              <div className="text-xs text-muted-foreground">
                                {t('Variance vs prior estimate')}:{' '}
                                <span
                                  className={
                                    Number(statement.priorYearVariance) > 0
                                      ? 'text-destructive font-medium'
                                      : Number(statement.priorYearVariance) < 0
                                        ? 'text-green-600 font-medium'
                                        : ''
                                  }
                                >
                                  {toCurrency(statement.priorYearVariance)}
                                </span>
                              </div>
                            ) : null}

                            {/* ── Statement files ── */}
                            <div className="space-y-1.5">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {t('Source documents')}
                              </div>
                              {(statement.attachmentIds || []).length ? (
                                <div className="flex flex-wrap gap-2">
                                  {(statement.attachmentIds || []).map(
                                    (attachmentId, index) => (
                                      <Button
                                        key={attachmentId}
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleDownloadTaxAttachment(
                                            statement,
                                            attachmentId,
                                            index
                                          )
                                        }
                                        disabled={
                                          downloadingTaxAttachmentId ===
                                          attachmentId
                                        }
                                      >
                                        <LuDownload className="size-3.5 mr-1.5" />
                                        {downloadingTaxAttachmentId ===
                                        attachmentId
                                          ? t('Downloading...')
                                          : (statement.attachmentIds || [])
                                                .length === 1
                                            ? t('Original statement PDF')
                                            : `${t('Statement PDF')} ${index + 1}`}
                                      </Button>
                                    )
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground"
                                    onClick={() =>
                                      handleAutoReadTaxAttachment(
                                        statement,
                                        String(
                                          (statement.attachmentIds || []).slice(
                                            -1
                                          )[0]
                                        )
                                      )
                                    }
                                    disabled={
                                      parsingTaxStatementId ===
                                      String(statement._id)
                                    }
                                  >
                                    <LuFileSearch className="size-3.5 mr-1.5" />
                                    {parsingTaxStatementId ===
                                    String(statement._id)
                                      ? t('Re-reading PDF...')
                                      : t('Re-read & auto-fill from PDF')}
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  {t('No statement PDF uploaded')}
                                  {' — '}
                                  {t(
                                    'use Edit to upload one for record keeping and auto-fill'
                                  )}
                                </div>
                              )}
                            </div>

                            {/* ── Payment confirmations ── */}
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {t('Payment confirmations')}
                              </div>
                              {!paymentConfirmations.length ? (
                                <div className="text-xs text-muted-foreground">
                                  {t('No payment confirmations logged yet')}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {paymentConfirmations.map(
                                    (confirmation, confirmationIndex) => (
                                      <div
                                        key={`${statement._id}-confirmation-${confirmationIndex}`}
                                        className="rounded-md border bg-muted/20 p-2.5 text-xs space-y-1"
                                      >
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                          <span className="font-semibold">
                                            {String(
                                              confirmation.paidOn || ''
                                            ).slice(0, 10)}
                                          </span>
                                          <span className="font-semibold tabular-nums">
                                            {toCurrency(
                                              confirmation.paidAmount
                                            )}
                                          </span>
                                          {Number(confirmation.feeAmount || 0) >
                                          0 ? (
                                            <span className="text-muted-foreground">
                                              {t('Fee')}:{' '}
                                              {toCurrency(
                                                confirmation.feeAmount
                                              )}
                                            </span>
                                          ) : null}
                                          {confirmation.paymentMethod ? (
                                            <span className="text-muted-foreground">
                                              {confirmation.paymentMethod}
                                            </span>
                                          ) : null}
                                          {confirmation.confirmationNumber ? (
                                            <span className="text-muted-foreground">
                                              #{confirmation.confirmationNumber}
                                            </span>
                                          ) : null}
                                          {confirmation.createdBy ? (
                                            <span className="text-muted-foreground">
                                              {t('by')} {confirmation.createdBy}
                                            </span>
                                          ) : null}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2"
                                            onClick={() =>
                                              handleStartTaxPaymentEdit(
                                                statement._id,
                                                confirmation,
                                                confirmationIndex
                                              )
                                            }
                                          >
                                            {t('Edit')}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-destructive hover:text-destructive"
                                            onClick={() =>
                                              handleDeleteTaxPaymentConfirmation(
                                                statement,
                                                confirmationIndex
                                              )
                                            }
                                            disabled={
                                              deletingTaxPaymentConfirmationKey ===
                                              `${statement._id}-${confirmationIndex}`
                                            }
                                          >
                                            {deletingTaxPaymentConfirmationKey ===
                                            `${statement._id}-${confirmationIndex}`
                                              ? t('Deleting...')
                                              : t('Delete')}
                                          </Button>
                                        </div>
                                        {confirmation.notes ? (
                                          <div className="text-muted-foreground italic">
                                            {confirmation.notes}
                                          </div>
                                        ) : null}
                                        {(confirmation.attachmentIds || [])
                                          .length ? (
                                          <div className="flex flex-wrap gap-2 pt-1">
                                            {(
                                              confirmation.attachmentIds || []
                                            ).map(
                                              (
                                                attachmentId,
                                                attachmentIndex
                                              ) => (
                                                <Button
                                                  key={attachmentId}
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-7 px-2"
                                                  onClick={() =>
                                                    handleDownloadTaxAttachment(
                                                      statement,
                                                      attachmentId,
                                                      attachmentIndex
                                                    )
                                                  }
                                                  disabled={
                                                    downloadingTaxAttachmentId ===
                                                    attachmentId
                                                  }
                                                >
                                                  <LuDownload className="size-3 mr-1" />
                                                  {downloadingTaxAttachmentId ===
                                                  attachmentId
                                                    ? t('Downloading...')
                                                    : t('Receipt')}
                                                </Button>
                                              )
                                            )}
                                          </div>
                                        ) : null}
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                              {activeTaxPaymentStatementId === statement._id ? (
                                <div className="rounded-md border p-3 space-y-2">
                                  <div className="text-xs font-semibold">
                                    {Number.isInteger(activeTaxPaymentEditIndex)
                                      ? t('Edit payment confirmation')
                                      : t('Log payment confirmation')}
                                  </div>
                                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                    <div>
                                      <label className="text-xs text-muted-foreground">
                                        {t('Paid date')}
                                      </label>
                                      <Input
                                        type="date"
                                        value={taxPaymentDraft.paidOn}
                                        onChange={(event) =>
                                          setTaxPaymentDraft((previous) => ({
                                            ...previous,
                                            paidOn: event.target.value
                                          }))
                                        }
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground">
                                        {t('Paid amount')}
                                      </label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={taxPaymentDraft.paidAmount}
                                        onChange={(event) =>
                                          setTaxPaymentDraft((previous) => ({
                                            ...previous,
                                            paidAmount: event.target.value
                                          }))
                                        }
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground">
                                        {t('Fee amount')}
                                      </label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={taxPaymentDraft.feeAmount}
                                        onChange={(event) =>
                                          setTaxPaymentDraft((previous) => ({
                                            ...previous,
                                            feeAmount: event.target.value
                                          }))
                                        }
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground">
                                        {t('Payment method')}
                                      </label>
                                      <Input
                                        type="text"
                                        value={taxPaymentDraft.paymentMethod}
                                        onChange={(event) =>
                                          setTaxPaymentDraft((previous) => ({
                                            ...previous,
                                            paymentMethod: event.target.value
                                          }))
                                        }
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground">
                                        {t('Confirmation number')}
                                      </label>
                                      <Input
                                        type="text"
                                        value={
                                          taxPaymentDraft.confirmationNumber
                                        }
                                        onChange={(event) =>
                                          setTaxPaymentDraft((previous) => ({
                                            ...previous,
                                            confirmationNumber:
                                              event.target.value
                                          }))
                                        }
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-muted-foreground">
                                        {Number.isInteger(activeTaxPaymentEditIndex)
                                          ? t('Add confirmation file')
                                          : t('Confirmation file')}
                                      </label>
                                      <Input
                                        type="file"
                                        onChange={(event) =>
                                          setTaxPaymentFile(
                                            event.target.files?.[0] || null
                                          )
                                        }
                                      />
                                      <div className="pt-1">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2"
                                          onClick={handleAutoFillTaxPaymentFromFile}
                                          disabled={
                                            parsingTaxPaymentUpload ||
                                            !taxPaymentFile
                                          }
                                        >
                                          {parsingTaxPaymentUpload
                                            ? t('Auto-filling...')
                                            : t('Auto-fill from file')}
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="md:col-span-3">
                                      <label className="text-xs text-muted-foreground">
                                        {t('Notes')}
                                      </label>
                                      <Input
                                        type="text"
                                        value={taxPaymentDraft.notes}
                                        onChange={(event) =>
                                          setTaxPaymentDraft((previous) => ({
                                            ...previous,
                                            notes: event.target.value
                                          }))
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      onClick={handleCancelTaxPaymentLog}
                                    >
                                      {t('Cancel')}
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleSaveTaxPaymentConfirmation(
                                          statement
                                        )
                                      }
                                      disabled={savingTaxPaymentConfirmation}
                                    >
                                      {savingTaxPaymentConfirmation
                                        ? t('Saving...')
                                        : Number.isInteger(
                                              activeTaxPaymentEditIndex
                                            )
                                          ? t('Update confirmation')
                                          : t('Save confirmation')}
                                    </Button>
                                  </div>
                                </div>
                              ) : null}
                              {activeTaxPaymentStatementId !== statement._id ? (
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleStartTaxPaymentLog(statement._id)
                                    }
                                  >
                                    {t('Log payment confirmation')}
                                  </Button>
                                </div>
                              ) : null}
                            </div>

                            {/* ── Inline notes panel ── */}
                            {notesOpen ? (
                              <div className="border-t pt-3">
                                <NotesPanel
                                  entityType="property_tax_statement"
                                  entityId={String(statement._id)}
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {!isUtilitiesOnly && utilitiesTab === 'tax-report' ? (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  {t('Tax payment report')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t(
                    'Track paid, partial, unpaid, and overpaid tax statements by property and year, including fees and remaining balances.'
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleExportTaxReportCsv}
                disabled={exportingTaxReportCsv}
              >
                <LuFileSpreadsheet className="size-4 mr-2" />
                {exportingTaxReportCsv ? t('Exporting...') : t('Export CSV')}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <select
                  value={taxReportPropertyFilter}
                  onChange={(event) =>
                    setTaxReportPropertyFilter(event.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                >
                  <option value="all">{t('All properties')}</option>
                  {topLevelPropertyOptions.map((property) => (
                    <option key={property._id} value={property._id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={taxReportYearFilter}
                  onChange={(event) =>
                    setTaxReportYearFilter(event.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                >
                  <option value="all">{t('All tax years')}</option>
                  {taxYearOptions.map((taxYearLabel) => (
                    <option key={taxYearLabel} value={taxYearLabel}>
                      {taxYearLabel}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={taxReportStatusFilter}
                  onChange={(event) =>
                    setTaxReportStatusFilter(event.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                >
                  <option value="all">{t('All statuses')}</option>
                  <option value="overpaid">{t('Overpaid')}</option>
                  <option value="paid">{t('Paid')}</option>
                  <option value="partial">{t('Partial')}</option>
                  <option value="unpaid">{t('Unpaid')}</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {t('Overpaid')}: {taxReportStatusSummary.overpaid} • {t('Paid')}:{' '}
              {taxReportStatusSummary.paid} • {t('Partial')}:{' '}
              {taxReportStatusSummary.partial} • {t('Unpaid')}:{' '}
              {taxReportStatusSummary.unpaid}
            </div>

            {!filteredTaxReportRows.length ? (
              <div className="text-sm text-muted-foreground">
                {t('No tax report rows found for current filters')}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTaxReportRows.map((row) => {
                  const statusMeta = getTaxStatusMeta(row.status);
                  return (
                    <div
                      key={`${row.statementId}-report`}
                      className="rounded-lg border p-3 flex flex-col gap-2"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm font-semibold">
                          {row.propertyName} • {row.taxYearLabel}
                        </div>
                        <div
                          className={`text-xs font-medium px-2 py-1 rounded w-fit ${statusMeta.className}`}
                        >
                          {t(statusMeta.label)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('Total due')}: {toCurrency(row.totalDue)} •{' '}
                        {t('Paid')}: {toCurrency(row.totalPaid)} • {t('Fees')}:{' '}
                        {toCurrency(row.totalFees)} • {t('Balance')}:{' '}
                        {toCurrency(row.balance)}
                        {row.overpaidAmount > 0
                          ? ` • ${t('Overpaid')}: ${toCurrency(row.overpaidAmount)}`
                          : ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('Confirmations')}: {row.confirmationsCount}
                        {row.lastPaymentDate
                          ? ` • ${t('Last payment')}: ${row.lastPaymentDate}`
                          : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {!isTaxOnly && utilitiesTab === 'list' ? (
          <SavedBills
            t={t}
            filteredUtilities={filteredUtilities}
            totalAmount={totalAmount}
            loading={loading}
            searchText={searchText}
            setSearchText={setSearchText}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            availableCategories={availableCategories}
            billingMonths={billingMonths}
            propertyById={propertyById}
            normalizeCategory={normalizeCategory}
            formatCategoryLabel={formatCategoryLabel}
            toCurrency={toCurrency}
            router={router}
            isError={isError}
            workingUtilityAttachmentId={workingUtilityAttachmentId}
            handlePreviewUtilityBillAttachment={
              handlePreviewUtilityBillAttachment
            }
            handleDownloadUtilityBillAttachment={
              handleDownloadUtilityBillAttachment
            }
            propertyFilter={propertyFilter}
            setPropertyFilter={setPropertyFilter}
            propertyOptions={propertyOptions}
            onGenerateInvoices={handleGenerateInvoices}
            onLogQbPosted={handleLogQbPosted}
            onRecaptureEmailBill={handleRecaptureEmailBill}
            onReuploadBill={handleReuploadBill}
            onPreviewAttachment={handlePreviewAttachment}
            onDownloadAttachment={handleDownloadAttachment}
            onRemoveAttachment={handleRemoveAttachment}
            onTogglePaid={handleTogglePaidStatus}
            onDeleteUtility={handleDeleteUtility}
            previewMode={previewMode}
            onTogglePreviewMode={() =>
              setPreviewMode(previewMode === 'popup' ? 'modal' : 'popup')
            }
            recapturingUtilityId={recapturingUtilityId}
            reuploadUtilityId={reuploadUtilityId}
            removingAttachmentId={removingAttachmentId}
            togglingPaidUtilityId={togglingPaidUtilityId}
            deletingUtilityId={deletingUtilityId}
          />
        ) : null}

        {!isTaxOnly && utilitiesTab === 'pending-email' ? (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {t('Pending email confirmations')}
              </div>
              <div className="text-xs text-muted-foreground">
                {pendingEmailUtilities.length} {t('item(s)')}
              </div>
            </div>

            {!pendingEmailUtilities.length ? (
              <div className="text-sm text-muted-foreground">
                {t('No pending email confirmations')}
              </div>
            ) : (
              <div className="space-y-2">
                {pendingEmailUtilities.map((utility) => {
                  const property = propertyById[String(utility.propertyId)];
                  const utilityId = String(utility._id || '');
                  const isWorking = workingPendingActionId === utilityId;

                  return (
                    <div
                      key={utilityId}
                      className="rounded-lg border p-3 flex flex-col gap-2"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm font-semibold">
                          {formatCategoryLabel(utility.type)} •{' '}
                          {utility.billingMonth}
                        </div>
                        <div className="text-sm font-semibold">
                          {toCurrency(utility.amount)}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {(property?.name || t('Unknown property'))}
                        {utility.provider ? ` • ${utility.provider}` : ''}
                        {utility.accountNumber ? ` • ${utility.accountNumber}` : ''}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {utility.confirmationNumber
                          ? `${t('Confirmation')}: ${utility.confirmationNumber}`
                          : t('No confirmation number found')}
                      </div>

                      {(utility.importIssues || []).length ? (
                        <div className="flex flex-wrap gap-1">
                          {(utility.importIssues || []).map((issue) => (
                            <span
                              key={`${utilityId}-${issue}`}
                              className="text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-700"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-2 justify-end">
                        {(utility.attachmentIds || []).length ? (
                          <Button
                            variant="outline"
                            onClick={() =>
                              handlePreviewUtilityBillAttachment(utility)
                            }
                            disabled={
                              workingUtilityAttachmentId ===
                                String(utility.attachmentIds?.[0] || '') ||
                              isWorking
                            }
                          >
                            {t('View source')}
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          onClick={() => handleRejectPendingUtility(utilityId)}
                          disabled={isWorking}
                        >
                          {isWorking ? t('Working...') : t('Reject')}
                        </Button>
                        <Button
                          onClick={() => handleApprovePendingUtility(utilityId)}
                          disabled={isWorking}
                        >
                          {isWorking ? t('Working...') : t('Approve')}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ) : null}

        <Dialog open={batchWorkflowOpen} onOpenChange={setBatchWorkflowOpen}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{t('Batch utility upload review')}</DialogTitle>
              <DialogDescription>
                {t(
                  'Review each parsed file, adjust account or values where needed, then confirm to post all ready items.'
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
              {batchReviewItems.map((item) => {
                const account =
                  utilityAccountById[String(item.accountId)] || null;
                const allocationPreview = (account?.allocations || [])
                  .map((allocation) => {
                    const property =
                      propertyById[String(allocation.propertyId)];
                    return `${getPropertyLabel(property, propertyById)} (${formatPercentage(allocation.percentage)})`;
                  })
                  .join(' • ');

                return (
                  <div
                    key={item.id}
                    className="rounded-md border p-3 space-y-2"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-medium">{item.fileName}</div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => handlePreviewBatchReviewFile(item)}
                          disabled={
                            workingBatchReviewItemId === String(item.id)
                          }
                        >
                          <LuFileSearch className="size-4" />
                          {t('View file')}
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleDownloadBatchReviewFile(item)}
                          disabled={
                            workingBatchReviewItemId === String(item.id)
                          }
                        >
                          <LuDownload className="size-4" />
                          {t('Download file')}
                        </Button>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            item.isReady
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.isReady ? t('Ready') : t('Needs attention')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                      <div className="md:col-span-2">
                        <label className="text-xs text-muted-foreground">
                          {t('Account')}
                        </label>
                        <select
                          value={item.accountId}
                          onChange={(event) =>
                            handleBatchReviewChange(
                              item.id,
                              'accountId',
                              event.target.value
                            )
                          }
                          className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                        >
                          <option value="">{t('Select account')}</option>
                          {utilityAccounts.map((utilityAccount) => (
                            <option
                              key={utilityAccount._id}
                              value={utilityAccount._id}
                            >
                              {utilityAccount.accountNumber} •{' '}
                              {formatCategoryLabel(utilityAccount.type)}
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
                          value={item.billingMonth}
                          onChange={(event) =>
                            handleBatchReviewChange(
                              item.id,
                              'billingMonth',
                              event.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          {t('Amount')}
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.amount}
                          onChange={(event) =>
                            handleBatchReviewChange(
                              item.id,
                              'amount',
                              event.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <div>
                        <label className="text-xs text-muted-foreground">
                          {t('Due date')}
                        </label>
                        <Input
                          type="date"
                          value={item.dueDate}
                          onChange={(event) =>
                            handleBatchReviewChange(
                              item.id,
                              'dueDate',
                              event.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          {t('Provider')}
                        </label>
                        <Input
                          type="text"
                          value={item.provider}
                          readOnly
                          className="bg-muted/30"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">
                          {t('Category')}
                        </label>
                        <Input
                          type="text"
                          value={formatCategoryLabel(item.type)}
                          readOnly
                          className="bg-muted/30"
                        />
                      </div>
                    </div>

                    {allocationPreview ? (
                      <div className="text-xs text-muted-foreground">
                        {allocationPreview}
                      </div>
                    ) : null}

                    {item.warnings.length ? (
                      <div className="text-xs text-amber-700">
                        {item.warnings.join(' ')}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBatchWorkflowOpen(false)}
                disabled={batchUploadingBills}
              >
                {t('Cancel')}
              </Button>
              <Button
                onClick={handleConfirmBatchWorkflow}
                disabled={batchUploadingBills}
              >
                {batchUploadingBills
                  ? t('Posting batch...')
                  : t('Confirm and post ready items')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={modalPreviewOpen} onOpenChange={(open) => { if (!open) closeModalPreview(); }}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>{t('Bill preview')}</DialogTitle>
              <DialogDescription>{modalPreviewName}</DialogDescription>
            </DialogHeader>
            <div className="rounded-md border overflow-hidden h-[70vh] bg-muted/20">
              {modalPreviewUrl ? (
                modalPreviewName?.endsWith('.txt') ? (
                  <iframe
                    src={modalPreviewUrl}
                    title={modalPreviewName}
                    className="w-full h-full bg-white font-mono text-xs"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <iframe
                    src={modalPreviewUrl}
                    type="application/pdf"
                    className="w-full h-full"
                    title={modalPreviewName}
                  />
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground text-sm">
                  <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <div>{t('Loading')}…</div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeModalPreview}>
                {t('Close')}
              </Button>
              <Button
                disabled={!modalPreviewUrl}
                onClick={() => {
                  fetch(modalPreviewUrl)
                    .then((r) => r.blob())
                    .then((blob) => downloadBlobAsFile(blob, modalPreviewName));
                }}
              >
                <LuDownload className="size-4 mr-2" />
                {t('Download')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </Page>
  );
}

function UtilitiesRoutePage() {
  return <UtilitiesPage view="utilities" />;
}

export default withAuthentication(UtilitiesRoutePage);
