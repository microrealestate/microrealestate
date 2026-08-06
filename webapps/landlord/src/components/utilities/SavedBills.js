import {
  LuArrowDown,
  LuArrowUp,
  LuBookmark,
  LuCheck,
  LuDownload,
  LuExternalLink,
  LuEye,
  LuFileText,
  LuLock,
  LuMail,
  LuRefreshCw,
  LuSearch,
  LuSend,
  LuTrash2,
  LuUpload,
  LuX
} from 'react-icons/lu';
import { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';
import { Input } from '../ui/input';

function getPropertyLabel(property, propertyById) {
  const parent = property?.parentPropertyId
    ? propertyById[String(property.parentPropertyId)]
    : null;
  return parent
    ? `${parent.name || ''} / ${property.name || ''}`
    : property?.name || '';
}

function AttachmentsList({
  utility,
  onPreview,
  onDownload,
  onUploadBill,
  onRecapture,
  onRemove,
  onRequestConfirm,
  workingAttachmentId,
  recapturingId,
  reuploadUtilityId,
  removingAttachmentId,
  fileInputRef,
  t
}) {
  const attachments = utility.attachments || [];

  return (
    <div className="border rounded text-xs overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-muted/50 text-muted-foreground">
            <th className="px-2 py-1 font-medium">{t('Attached Files')}</th>
            <th className="px-2 py-1 font-medium">{t('Type')}</th>
            <th className="px-2 py-1 w-20" />
          </tr>
        </thead>
        <tbody>
          {attachments.map((att) => {
            const isPdf = att.mimeType?.includes('pdf');
            const Icon = isPdf ? LuFileText : LuMail;
            const typeLabel = isPdf ? t('PDF') : t('Email');
            const isWorking = workingAttachmentId === String(att._id);
            return (
              <tr key={att._id} className="border-t">
                <td className="px-2 py-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate max-w-[160px]" title={att.filename}>{att.filename}</span>
                  </div>
                </td>
                <td className="px-2 py-1 text-muted-foreground whitespace-nowrap">{typeLabel}</td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={isWorking}
                      title={t('View')}
                      onClick={() => onPreview && onPreview(String(att._id), att.filename, att.mimeType || '')}>
                      <LuEye className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" disabled={isWorking}
                      title={t('Download')}
                      onClick={() => onDownload && onDownload(String(att._id), att.filename)}>
                      <LuDownload className="size-3.5" />
                    </Button>
                    {onRemove ? (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        disabled={removingAttachmentId === String(att._id)}
                        title={t('Remove file')}
                        onClick={() => onRequestConfirm({
                          type: 'remove-attachment',
                          label: att.filename,
                          onConfirm: () => onRemove(utility, String(att._id))
                        })}>
                        <LuX className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
          {attachments.length === 0 && (
            <tr>
              <td className="px-2 py-1 text-muted-foreground" colSpan={3}>{t('No source bill attached')}</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex items-center gap-1 px-2 py-1 border-t flex-wrap">
        {onUploadBill ? (
          <Button variant="outline" size="sm" className="gap-1 h-6 px-2 text-xs"
            disabled={reuploadUtilityId === utility._id}
            onClick={() => {
              if (!fileInputRef) return;
              fileInputRef.onchange = (e) => {
                const file = e.target.files?.[0];
                if (file) onUploadBill(utility, file);
                fileInputRef.value = '';
              };
              fileInputRef.click();
            }}>
            <LuUpload className="size-3" />{t('Attach file')}
          </Button>
        ) : null}
        {utility.source === 'email' && onRecapture ? (
          <Button variant="outline" size="sm" className="gap-1 h-6 px-2 text-xs"
            disabled={recapturingId === utility._id}
            onClick={() => onRecapture(utility._id)}
            title={t('Re-fetch email content from inbox')}>
            <LuRefreshCw className={`size-3 ${recapturingId === utility._id ? 'animate-spin' : ''}`} />
            {t('Recapture email')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function SplitBreakdownTable({ utility, propertyById, toCurrency, t }) {
  const items = Array.isArray(utility.splitItems) ? utility.splitItems : [];
  const isSplit = utility.originalAmount != null && utility.originalAmount !== utility.amount;
  const property = propertyById[String(utility.propertyId)];
  const propertyName = property?.name || t('This property');

  const subRows = items.map((item) => {
    const subProp = propertyById[String(item.subPropertyId)];
    const name = subProp?.name || t('Unit');
    const amount =
      item.splitType === 'percentage' && item.percentage != null
        ? (item.percentage / 100) * (utility.amount || 0)
        : items.length > 0 ? (utility.amount || 0) / items.length : utility.amount || 0;
    const splitLabel = item.splitType === 'percentage' ? `${item.percentage}%` : t('equal');
    return { name, amount, splitLabel };
  });

  return (
    <div className="border rounded text-xs overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-muted/50 text-muted-foreground">
            <th className="px-2 py-1 font-medium">{t('Meter / Unit')}</th>
            <th className="px-2 py-1 font-medium text-right">{t('Split')}</th>
            <th className="px-2 py-1 font-medium text-right">{t('Amount')}</th>
          </tr>
        </thead>
        <tbody>
          {subRows.map((row, i) => (
            <tr key={i} className="border-t">
              <td className="px-2 py-1">{row.name}</td>
              <td className="px-2 py-1 text-right text-muted-foreground">{row.splitLabel}</td>
              <td className="px-2 py-1 text-right">{toCurrency(row.amount)}</td>
            </tr>
          ))}
          {/* Sibling properties from the same bill (e.g. other allocations on email-imported records) */}
          {!items.length && (utility.siblingProperties || []).map((sib, i) => {
            const siblings = utility.siblingProperties || [];
            // Derive sibling amount if missing: for 2-way splits, it's total minus this property
            const sibAmount = (sib.amount > 0)
              ? sib.amount
              : (siblings.length === 1 && utility.originalAmount > 0)
                ? Number((utility.originalAmount - utility.amount).toFixed(2))
                : 0;
            const pct = (utility.originalAmount > 0 && sibAmount > 0)
              ? Math.round((sibAmount / utility.originalAmount) * 100)
              : null;
            return (
              <tr key={`sib-${i}`} className="border-t text-muted-foreground italic">
                <td className="px-2 py-1">({sib.name})</td>
                <td className="px-2 py-1 text-right">{pct != null ? `${pct}%` : ''}</td>
                <td className="px-2 py-1 text-right">{sibAmount > 0 ? toCurrency(sibAmount) : ''}</td>
              </tr>
            );
          })}
          <tr className={`border-t ${isSplit || items.length || (utility.siblingProperties || []).length ? 'font-semibold' : ''}`}>
            <td className="px-2 py-1">{items.length ? t('This property share') : propertyName}</td>
            <td className="px-2 py-1 text-right">
              {!items.length && utility.originalAmount && (utility.siblingProperties || []).length
                ? `${Math.round((utility.amount / utility.originalAmount) * 100)}%`
                : null}
            </td>
            <td className="px-2 py-1 text-right">{toCurrency(utility.amount)}</td>
          </tr>
        </tbody>
        {isSplit || (!items.length && (utility.siblingProperties || []).length && utility.originalAmount) ? (
          <tfoot>
            <tr className="border-t bg-muted/30 text-muted-foreground">
              <td className="px-2 py-1" colSpan={2}>{t('Full bill (before split)')}</td>
              <td className="px-2 py-1 text-right font-semibold">{toCurrency(utility.originalAmount)}</td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}

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
  propertyFilter,
  setPropertyFilter,
  propertyOptions,
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
  onLogQbPosted,
  onRecaptureEmailBill,
  onReuploadBill,
  onPreviewAttachment,
  onDownloadAttachment,
  onRemoveAttachment,
  onTogglePaid,
  onDeleteUtility,
  previewMode,
  onTogglePreviewMode,
  recapturingUtilityId,
  reuploadUtilityId,
  removingAttachmentId,
  togglingPaidUtilityId,
  deletingUtilityId
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('billingMonth');
  const [sortOrder, setSortOrder] = useState('desc');
  const [confirmModal, setConfirmModal] = useState(null);
  const [reuploadTargetId, setReuploadTargetId] = useState(null);
  const fileInputRef = useState(() => {
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf,image/*';
      return input;
    }
    return null;
  })[0];

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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5 mb-4">
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
        <div>
          <select
            value={propertyFilter || 'all'}
            onChange={(event) =>
              setPropertyFilter && setPropertyFilter(event.target.value)
            }
            className="w-full px-3 py-2 border rounded-md text-sm bg-background"
          >
            <option value="all">{t('All properties')}</option>
            {(propertyOptions || []).map((property) => (
              <option key={String(property._id)} value={String(property._id)}>
                {getPropertyLabel(property, propertyById)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t('Bill preview')}:</span>
          <button
            className={`px-2 py-0.5 rounded border text-xs ${previewMode === 'popup' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            onClick={() => onTogglePreviewMode && onTogglePreviewMode()}
            title={previewMode === 'popup' ? t('Switch to modal (in-page)') : t('Switch to popup window')}
          >
            {previewMode === 'popup' ? t('Popup window') : t('Modal (in-page)')}
          </button>
        </div>
        <div className="flex items-center gap-4">
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
                className="rounded-lg border p-4 flex flex-col gap-3"
              >
                {/* Top: three equal columns — info | attachments | meter split */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                  {/* Col 1: bill details — Type and Provider first for scannability */}
                  <div className="border rounded text-xs overflow-x-auto">
                    <table className="w-full text-left">
                      <tbody>
                        <tr>
                          <td className="px-2 py-1 text-muted-foreground whitespace-nowrap font-medium bg-muted/50 w-20">{t('Type')}</td>
                          <td className="px-2 py-1 font-semibold">{formatCategoryLabel(utility.type)}</td>
                        </tr>
                        {utility.provider ? (
                          <tr className="border-t">
                            <td className="px-2 py-1 text-muted-foreground whitespace-nowrap font-medium bg-muted/50">{t('Provider')}</td>
                            <td className="px-2 py-1">{utility.provider}</td>
                          </tr>
                        ) : null}
                        <tr className="border-t">
                          <td className="px-2 py-1 text-muted-foreground whitespace-nowrap font-medium bg-muted/50">{t('Property')}</td>
                          <td className="px-2 py-1">{propertyName}</td>
                        </tr>
                        {utility.accountNumber ? (
                          <tr className="border-t">
                            <td className="px-2 py-1 text-muted-foreground whitespace-nowrap font-medium bg-muted/50">{t('Account')}</td>
                            <td className="px-2 py-1">{utility.accountNumber}</td>
                          </tr>
                        ) : null}
                        <tr className="border-t">
                          <td className="px-2 py-1 text-muted-foreground whitespace-nowrap font-medium bg-muted/50">{t('Billing')}</td>
                          <td className="px-2 py-1">{utility.billingMonth}</td>
                        </tr>
                        <tr className="border-t">
                          <td className="px-2 py-1 text-muted-foreground whitespace-nowrap font-medium bg-muted/50">{t('Status')}</td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-2">
                              <span className={utility.paidDate ? 'text-green-700' : 'text-amber-600'}>
                                {utility.paidDate
                                  ? `${t('Paid')} ${String(utility.paidDate).slice(0, 10)}`
                                  : t('Not paid yet')}
                              </span>
                              {onTogglePaid ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 px-1 text-xs text-muted-foreground"
                                  disabled={togglingPaidUtilityId === utility._id}
                                  onClick={() => onTogglePaid(utility)}
                                >
                                  {utility.paidDate ? t('Mark unpaid') : t('Mark paid')}
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Col 2: attached files */}
                  <AttachmentsList
                    utility={utility}
                    onPreview={onPreviewAttachment}
                    onDownload={onDownloadAttachment}
                    onUploadBill={onReuploadBill}
                    onRecapture={onRecaptureEmailBill}
                    onRemove={onRemoveAttachment}
                    onRequestConfirm={setConfirmModal}
                    workingAttachmentId={workingUtilityAttachmentId}
                    recapturingId={recapturingUtilityId}
                    reuploadUtilityId={reuploadUtilityId}
                    removingAttachmentId={removingAttachmentId}
                    fileInputRef={fileInputRef}
                    t={t}
                  />

                  {/* Col 3: meter / split breakdown */}
                  <SplitBreakdownTable
                    utility={utility}
                    propertyById={propertyById}
                    toCurrency={toCurrency}
                    t={t}
                  />
                </div>

                {/* Bottom bar: action buttons | updated-by | delete isolated right */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() =>
                        router.push(
                          `/${router.query.organization}/properties/${utility.propertyId}`
                        )
                      }
                    >
                      <LuExternalLink className="size-3.5" />
                      {t('Open property')}
                    </Button>
                    {utility.invoicedAt ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() =>
                          router.push(
                            `/${router.query.organization}/accounting/utility-invoices`
                          )
                        }
                      >
                        <LuFileText className="size-3.5" />
                        {t('View invoices')}
                        <LuLock className="size-3 text-amber-600" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => onGenerateInvoices && onGenerateInvoices(utility._id)}
                      >
                        <LuSend className="size-3.5" />
                        {t('Generate invoices')}
                      </Button>
                    )}
                    {onLogQbPosted ? (
                      utility.qbPostedAt ? (
                        <button
                          className="text-left border border-green-400 rounded px-2 py-1 text-xs text-green-700 hover:bg-green-50 cursor-pointer"
                          onClick={() => onLogQbPosted(utility._id, '')}
                          title={t('Click to re-log')}
                        >
                          <div className="flex items-center gap-1 font-medium">
                            <LuCheck className="size-3 shrink-0" />
                            {t('QuickBooks')}
                          </div>
                          <div className="text-green-600 mt-0.5">
                            {String(utility.qbPostedAt).slice(0, 10)}
                          </div>
                          {utility.qbPostedBy ? (
                            <div className="text-green-600 truncate max-w-[120px]">
                              {utility.qbPostedBy}
                            </div>
                          ) : null}
                        </button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-muted-foreground"
                          onClick={() => onLogQbPosted(utility._id, '')}
                        >
                          <LuBookmark className="size-3.5" />
                          {t('Not Entered QuickBooks')}
                        </Button>
                      )
                    ) : null}
                  </div>
                  {/* Updated by between action buttons and delete */}
                  <div className="text-muted-foreground space-y-0.5 px-2">
                    {utility.lastUpdatedBy ? (
                      <div>{t('Updated by')}: <span className="font-medium">{utility.lastUpdatedBy}</span></div>
                    ) : null}
                    {utility.updatedAt ? (
                      <div>{String(utility.updatedAt).slice(0, 10)}</div>
                    ) : null}
                  </div>
                  {/* Delete isolated on the far right */}
                  {onDeleteUtility ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-red-600 border-red-300 hover:bg-red-50 ml-auto"
                      disabled={deletingUtilityId === utility._id}
                      onClick={() => setConfirmModal({
                        label: t('Delete this bill record? This cannot be undone.'),
                        onConfirm: () => onDeleteUtility(utility._id)
                      })}
                    >
                      <LuTrash2 className="size-3.5" />
                      {t('Delete record')}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Dialog open={!!confirmModal} onOpenChange={(open) => { if (!open) setConfirmModal(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('Confirm')}</DialogTitle>
            <DialogDescription className="break-all">
              {confirmModal?.label}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmModal(null)}>
              {t('Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                confirmModal?.onConfirm?.();
                setConfirmModal(null);
              }}
            >
              {t('Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default SavedBills;
