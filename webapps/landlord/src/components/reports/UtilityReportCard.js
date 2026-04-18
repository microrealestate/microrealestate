/* eslint-disable sort-imports */
import { useMemo, useState } from 'react';

import { downloadDocument } from '../../utils/fetch';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table';
import { LuArrowDown, LuArrowUp, LuDownload } from 'react-icons/lu';

function toCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function compareStrings(left, right) {
  return String(left || '').localeCompare(String(right || ''), undefined, {
    numeric: true,
    sensitivity: 'base'
  });
}

function getRowSearchText(row) {
  return [
    row.billingMonth,
    row.propertyLabel,
    row.parentPropertyLabel,
    row.accountNumber,
    row.accountLabel,
    row.provider,
    row.type,
    row.status,
    row.source,
    row.notes,
    (row.accountAllocationLabels || []).join(' ')
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function compareRowValues(leftRow, rightRow, sortBy, sortOrder) {
  let leftValue = leftRow[sortBy];
  let rightValue = rightRow[sortBy];

  if (sortBy === 'amount') {
    leftValue = Number(leftValue || 0);
    rightValue = Number(rightValue || 0);
  }

  if (sortBy === 'billingMonth') {
    leftValue = String(leftValue || '');
    rightValue = String(rightValue || '');
  }

  if (sortBy === 'parentPropertyLabel') {
    leftValue = String(leftValue || '');
    rightValue = String(rightValue || '');
  }

  if (sortBy === 'childPropertyLabel') {
    leftValue = String(leftValue || '');
    rightValue = String(rightValue || '');
  }

  if (leftValue < rightValue) {
    return sortOrder === 'asc' ? -1 : 1;
  }

  if (leftValue > rightValue) {
    return sortOrder === 'asc' ? 1 : -1;
  }

  return 0;
}

function buildPivotRows(rows, pivotDimension, pivotSortBy, pivotSortOrder) {
  const columns = [...new Set(rows.map((row) => row.billingMonth).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right))
    .reverse();

  const grouped = new Map();

  rows.forEach((row) => {
    const rowKey =
      pivotDimension === 'account'
        ? row.accountKey || row.accountNumber || row.accountLabel || 'Unknown account'
        : row.propertyId || row.propertyLabel || 'Unknown property';
    const rowLabel =
      pivotDimension === 'account'
        ? row.accountLabel || row.accountNumber || 'Unknown account'
        : row.propertyLabel || 'Unknown property';
    const rowSubLabel =
      pivotDimension === 'account'
        ? [
            row.provider,
            row.accountAllocationLabels?.length ? row.accountAllocationLabels.join(', ') : ''
          ]
            .filter(Boolean)
            .join(' / ')
        : row.parentPropertyLabel && row.parentPropertyLabel !== row.propertyLabel
          ? row.parentPropertyLabel
          : '';

    if (!grouped.has(rowKey)) {
      grouped.set(rowKey, {
        key: rowKey,
        label: rowLabel,
        subLabel: rowSubLabel,
        total: 0,
        valuesByMonth: {}
      });
    }

    const bucket = grouped.get(rowKey);
    const amount = Number(row.amount || 0);
    bucket.total += amount;
    bucket.valuesByMonth[row.billingMonth] = Number(
      bucket.valuesByMonth[row.billingMonth] || 0
    ) + amount;
  });

  const orderedRows = [...grouped.values()].sort((left, right) => {
    if (pivotSortBy === 'total') {
      if (left.total < right.total) {
        return pivotSortOrder === 'asc' ? -1 : 1;
      }

      if (left.total > right.total) {
        return pivotSortOrder === 'asc' ? 1 : -1;
      }

      return compareStrings(left.label, right.label);
    }

    const labelComparison = compareStrings(left.label, right.label);
    return pivotSortOrder === 'asc' ? labelComparison : -labelComparison;
  });

  const totalsByMonth = columns.reduce((accumulator, month) => {
    accumulator[month] = 0;
    return accumulator;
  }, {});

  orderedRows.forEach((row) => {
    columns.forEach((month) => {
      totalsByMonth[month] = Number(totalsByMonth[month] || 0) + Number(row.valuesByMonth[month] || 0);
    });
  });

  return {
    columns,
    rows: orderedRows,
    totalsByMonth,
    grandTotal: orderedRows.reduce((sum, row) => sum + Number(row.total || 0), 0)
  };
}

function SortButton({ active, direction, children, onClick }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto px-0 py-0 font-semibold hover:bg-transparent"
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active ? (
          direction === 'asc' ? (
            <LuArrowUp className="size-3.5" />
          ) : (
            <LuArrowDown className="size-3.5" />
          )
        ) : null}
      </span>
    </Button>
  );
}

export default function UtilityReportCard({
  rows = [],
  startDate,
  endDate,
  propertyId,
  includePending
}) {
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [pivotDimension, setPivotDimension] = useState('property');
  const [sortBy, setSortBy] = useState('billingMonth');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pivotSortBy, setPivotSortBy] = useState('label');
  const [pivotSortOrder, setPivotSortOrder] = useState('asc');

  const availableTypes = useMemo(() => {
    return [...new Set(rows.map((row) => row.type).filter(Boolean))].sort(compareStrings);
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = normalizeText(searchText);

    return rows
      .filter((row) => {
        if (typeFilter !== 'all' && row.type !== typeFilter) {
          return false;
        }

        if (statusFilter !== 'all' && row.status !== statusFilter) {
          return false;
        }

        if (normalizedSearch && !getRowSearchText(row).includes(normalizedSearch)) {
          return false;
        }

        return true;
      })
      .sort((left, right) => compareRowValues(left, right, sortBy, sortOrder));
  }, [rows, searchText, typeFilter, statusFilter, sortBy, sortOrder]);

  const pivotData = useMemo(() => {
    return buildPivotRows(filteredRows, pivotDimension, pivotSortBy, pivotSortOrder);
  }, [filteredRows, pivotDimension, pivotSortBy, pivotSortOrder]);

  const summary = useMemo(() => {
    const totalAmount = filteredRows.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );
    const pendingAmount = filteredRows
      .filter((row) => row.status === 'pending')
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    return {
      totalAmount,
      pendingAmount,
      rowCount: filteredRows.length,
      propertyCount: new Set(filteredRows.map((row) => row.propertyId).filter(Boolean)).size,
      accountCount: new Set(filteredRows.map((row) => row.accountKey).filter(Boolean)).size
    };
  }, [filteredRows]);

  function handleSort(field) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      return;
    }

    setSortBy(field);
    setSortOrder(field === 'amount' ? 'desc' : 'asc');
  }

  function handlePivotSort(field) {
    if (pivotSortBy === field) {
      setPivotSortOrder(pivotSortOrder === 'asc' ? 'desc' : 'asc');
      return;
    }

    setPivotSortBy(field);
    setPivotSortOrder(field === 'total' ? 'desc' : 'asc');
  }

  function handleExportCsv() {
    const suffix = `${startDate || 'start'}_${endDate || 'end'}`;
    downloadDocument({
      endpoint: `/reports/utility-ledger.csv?startDate=${encodeURIComponent(
        startDate
      )}&endDate=${encodeURIComponent(endDate)}${propertyId ? `&propertyId=${encodeURIComponent(propertyId)}` : ''}${
        includePending ? '&includePending=true' : '&includePending=false'
      }`,
      documentName: `Utility ledger ${suffix}.csv`
    });
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Utility report</h3>
          <p className="text-sm text-muted-foreground">
            Search utility bills by month, property, or account, then switch to a pivot view for quick rollups.
          </p>
          <p className="text-xs text-muted-foreground">
            Pending imports are included in this report.
          </p>
        </div>
        <Button type="button" variant="outline" className="gap-2" onClick={handleExportCsv}>
          <LuDownload className="size-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Card className="p-3">
          <div className="text-xs uppercase text-muted-foreground">Rows</div>
          <div className="text-xl font-semibold">{summary.rowCount}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs uppercase text-muted-foreground">Total amount</div>
          <div className="text-xl font-semibold">{toCurrency(summary.totalAmount)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs uppercase text-muted-foreground">Pending amount</div>
          <div className="text-xl font-semibold">{toCurrency(summary.pendingAmount)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs uppercase text-muted-foreground">Properties</div>
          <div className="text-xl font-semibold">{summary.propertyCount}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs uppercase text-muted-foreground">Accounts</div>
          <div className="text-xl font-semibold">{summary.accountCount}</div>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-4">
        <div className="relative xl:col-span-2">
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by property, account, provider, month, note..."
          />
        </div>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">All types</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={viewMode === 'table' ? 'default' : 'outline'}
          onClick={() => setViewMode('table')}
        >
          Flat table
        </Button>
        <Button
          type="button"
          variant={viewMode === 'pivot' ? 'default' : 'outline'}
          onClick={() => setViewMode('pivot')}
        >
          Pivot summary
        </Button>
        {viewMode === 'pivot' ? (
          <>
            <span className="text-sm text-muted-foreground">Group by</span>
            <Button
              type="button"
              variant={pivotDimension === 'property' ? 'default' : 'outline'}
              onClick={() => setPivotDimension('property')}
            >
              Property
            </Button>
            <Button
              type="button"
              variant={pivotDimension === 'account' ? 'default' : 'outline'}
              onClick={() => setPivotDimension('account')}
            >
              Account
            </Button>
          </>
        ) : null}
      </div>

      {viewMode === 'table' ? (
        filteredRows.length ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">
                    <SortButton
                      active={sortBy === 'billingMonth'}
                      direction={sortOrder}
                      onClick={() => handleSort('billingMonth')}
                    >
                      Billing month
                    </SortButton>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <SortButton
                      active={sortBy === 'parentPropertyLabel'}
                      direction={sortOrder}
                      onClick={() => handleSort('parentPropertyLabel')}
                    >
                      Parent Property
                    </SortButton>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <SortButton
                      active={sortBy === 'childPropertyLabel'}
                      direction={sortOrder}
                      onClick={() => handleSort('childPropertyLabel')}
                    >
                      Property
                    </SortButton>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <SortButton
                      active={sortBy === 'accountLabel'}
                      direction={sortOrder}
                      onClick={() => handleSort('accountLabel')}
                    >
                      Account
                    </SortButton>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <SortButton
                      active={sortBy === 'type'}
                      direction={sortOrder}
                      onClick={() => handleSort('type')}
                    >
                      Type
                    </SortButton>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">
                    <SortButton
                      active={sortBy === 'source'}
                      direction={sortOrder}
                      onClick={() => handleSort('source')}
                    >
                      Source
                    </SortButton>
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    <SortButton
                      active={sortBy === 'amount'}
                      direction={sortOrder}
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                    </SortButton>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Due date</TableHead>
                  <TableHead className="whitespace-nowrap">Paid date</TableHead>
                  <TableHead className="whitespace-nowrap">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={
                      row.status === 'pending'
                        ? 'bg-amber-50/40 dark:bg-amber-950/30'
                        : ''
                    }
                  >
                    <TableCell className="whitespace-nowrap font-medium">
                      {row.billingMonth || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.parentPropertyLabel || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.childPropertyLabel || 'Unknown property'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium">
                          {row.accountLabel || row.accountNumber || 'No account number'}
                        </div>
                        {row.provider ? (
                          <div className="text-xs text-muted-foreground">
                            {row.provider}
                          </div>
                        ) : null}
                        {row.accountAllocationLabels?.length ? (
                          <div className="text-xs text-muted-foreground">
                            Assigned to {row.accountAllocationLabels.join(', ')}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap capitalize">
                      {row.type || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                          row.status === 'pending'
                            ? 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {row.status || 'confirmed'}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap capitalize">
                      {row.source || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold">
                      {toCurrency(row.amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.dueDate || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.paidDate || '-'}
                    </TableCell>
                    <TableCell className="max-w-72 truncate text-muted-foreground">
                      {row.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No utility rows match the current filters.
          </div>
        )
      ) : pivotData.rows.length ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort rows by</span>
            <Button
              type="button"
              variant={pivotSortBy === 'label' ? 'default' : 'outline'}
              onClick={() => handlePivotSort('label')}
            >
              Label
            </Button>
            <Button
              type="button"
              variant={pivotSortBy === 'total' ? 'default' : 'outline'}
              onClick={() => handlePivotSort('total')}
            >
              Total
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">
                    <SortButton
                      active={pivotSortBy === 'label'}
                      direction={pivotSortOrder}
                      onClick={() => handlePivotSort('label')}
                    >
                      {pivotDimension === 'account' ? 'Account' : 'Property'}
                    </SortButton>
                  </TableHead>
                  {pivotData.columns.map((month) => (
                    <TableHead key={month} className="whitespace-nowrap text-right">
                      {month}
                    </TableHead>
                  ))}
                  <TableHead className="whitespace-nowrap text-right">
                    <SortButton
                      active={pivotSortBy === 'total'}
                      direction={pivotSortOrder}
                      onClick={() => handlePivotSort('total')}
                    >
                      Total
                    </SortButton>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pivotData.rows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium">{row.label}</div>
                        {row.subLabel ? (
                          <div className="text-xs text-muted-foreground">
                            {row.subLabel}
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    {pivotData.columns.map((month) => (
                      <TableCell
                        key={`${row.key}-${month}`}
                        className="whitespace-nowrap text-right"
                      >
                        {toCurrency(row.valuesByMonth[month] || 0)}
                      </TableCell>
                    ))}
                    <TableCell className="whitespace-nowrap text-right font-semibold">
                      {toCurrency(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t bg-muted/30 font-semibold">
                  <TableCell>Grand total</TableCell>
                  {pivotData.columns.map((month) => (
                    <TableCell
                      key={`total-${month}`}
                      className="whitespace-nowrap text-right"
                    >
                      {toCurrency(pivotData.totalsByMonth[month] || 0)}
                    </TableCell>
                  ))}
                  <TableCell className="whitespace-nowrap text-right">
                    {toCurrency(pivotData.grandTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No pivot data matches the current filters.
        </div>
      )}
    </Card>
  );
}
