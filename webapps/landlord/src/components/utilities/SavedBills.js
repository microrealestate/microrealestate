import {
  LuArrowDown,
  LuArrowUp,
  LuBookmark,
  LuDownload,
  LuExternalLink,
  LuFileSearch,
  LuFileText,
  LuLock,
  LuSearch,
  LuSend
} from 'react-icons/lu';
import { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';

function SavedBills({
  t,
  filteredUtilities,
  totalAmount,
  loading,
  searchText,
  setSearchText,
  typeFilter,
  setTypeFilter,
  monthFilter,
  setMonthFilter,
  availableCategories,
  billingMonths,
  propertyById,
  normalizeCategory,
  formatCategoryLabel,
  toCurrency,
  router,
  isError,
  workingUtilityAttachmentId,
  handlePreviewUtilityBillAttachment,
  handleDownloadUtilityBillAttachment,
  onGenerateInvoices,
  onLogQbPosted
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('billingMonth');
  const [sortOrder, setSortOrder] = useState('desc');
  const [qbUtilityId, setQbUtilityId] = useState(null);
  const [qbRef, setQbRef] = useState('');

  const sortedUtilities = useMemo(() => {
    return [...filteredUtilities].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'amount') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredUtilities, sortBy, sortOrder]);

  const utilitiesByTab = useMemo(() => {
    if (activeTab === 'all') {
      return sortedUtilities;
    }
    return sortedUtilities.filter(
      (utility) => normalizeCategory(utility.type) === activeTab
    );
  }, [activeTab, sortedUtilities, normalizeCategory]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const renderSortArrow = (field) => {
    if (sortBy === field) {
      return sortOrder === 'asc' ? <LuArrowUp /> : <LuArrowDown />;
    }
    return null;
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveTab('all')}
        >
          {t('All')}
        </Button>
        {availableCategories.map((category) => (
          <Button
            key={category}
            variant={activeTab === category ? 'default' : 'outline'}
            onClick={() => setActiveTab(category)}
          >
            {formatCategoryLabel(category)}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4 mb-4">
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
                {formatCategoryLabel(type)}
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
      <div className="flex justify-end items-center gap-4 mb-4">
        <div className="text-sm text-muted-foreground">{t('Sort by')}:</div>
        <Button variant="ghost" onClick={() => handleSort('billingMonth')}>
          {t('Billing Month')} {renderSortArrow('billingMonth')}
        </Button>
        <Button variant="ghost" onClick={() => handleSort('amount')}>
          {t('Amount')} {renderSortArrow('amount')}
        </Button>
        <Button variant="ghost" onClick={() => handleSort('paidDate')}>
          {t('Paid Date')} {renderSortArrow('paidDate')}
        </Button>
      </div>

      {isError ? (
        <div className="text-sm text-red-600">
          {t('Failed to load utilities')}
        </div>
      ) : utilitiesByTab.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          {t('No utilities found for current filters')}
        </div>
      ) : (
        <div className="space-y-3">
          {utilitiesByTab.map((utility) => {
            const property = propertyById[String(utility.propertyId)];
            const propertyName = property?.name || t('Unknown property');

            return (
              <div
                key={utility._id}
                className="rounded-lg border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="text-sm font-semibold">
                    {formatCategoryLabel(utility.type)} • {utility.billingMonth}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {propertyName}
                    {utility.provider ? ` • ${utility.provider}` : ''}
                    {utility.accountNumber ? ` • ${utility.accountNumber}` : ''}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {utility.paidDate
                      ? `${t('Paid')} ${String(utility.paidDate).slice(0, 10)}`
                      : t('Not paid yet')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(utility.attachmentIds || []).length
                      ? t('Source bill on file')
                      : t('No source bill attached')}
                  </div>
                  {utility.lastUpdatedBy ? (
                    <div className="text-xs text-muted-foreground">
                      {t('Updated by')}:{' '}
                      <span className="font-medium">
                        {utility.lastUpdatedBy}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end">
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {toCurrency(utility.amount)}
                    </div>
                    {utility.originalAmount != null &&
                    utility.originalAmount !== utility.amount ? (
                      <div className="text-xs text-muted-foreground">
                        {t('Full bill')}: {toCurrency(utility.originalAmount)}
                      </div>
                    ) : null}
                  </div>
                  {utility.invoicedAt ? (
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <LuLock className="size-3" />
                      {t('Invoiced')}
                    </div>
                  ) : null}
                  {(utility.attachmentIds || []).length ? (
                    <>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() =>
                          handlePreviewUtilityBillAttachment(utility)
                        }
                        disabled={
                          workingUtilityAttachmentId ===
                          String(utility.attachmentIds?.[0] || '')
                        }
                      >
                        <LuFileSearch className="size-4" />
                        {t('View bill')}
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() =>
                          handleDownloadUtilityBillAttachment(utility)
                        }
                        disabled={
                          workingUtilityAttachmentId ===
                          String(utility.attachmentIds?.[0] || '')
                        }
                      >
                        <LuDownload className="size-4" />
                        {t('Download bill')}
                      </Button>
                    </>
                  ) : null}
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
                  {utility.invoicedAt ? (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() =>
                        router.push(
                          `/${router.query.organization}/accounting/utility-invoices`
                        )
                      }
                    >
                      <LuFileText className="size-4" />
                      {t('View invoices')}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => onGenerateInvoices && onGenerateInvoices(utility._id)}
                    >
                      <LuSend className="size-4" />
                      {t('Generate invoices')}
                    </Button>
                  )}
                  {onLogQbPosted ? (
                    qbUtilityId === utility._id ? (
                      <div className="flex items-center gap-1">
                        <input
                          className="border rounded px-2 py-1 text-xs w-32"
                          placeholder={t('QB ref # (optional)')}
                          value={qbRef}
                          onChange={(e) => setQbRef(e.target.value)}
                        />
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            onLogQbPosted(utility._id, qbRef);
                            setQbUtilityId(null);
                            setQbRef('');
                          }}
                        >
                          {t('Log')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setQbUtilityId(null); setQbRef(''); }}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="gap-2 text-xs"
                        onClick={() => setQbUtilityId(utility._id)}
                      >
                        <LuBookmark className="size-3" />
                        {t('Log QB posted')}
                      </Button>
                    )
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default SavedBills;
