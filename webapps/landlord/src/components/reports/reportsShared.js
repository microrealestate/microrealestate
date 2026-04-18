import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { apiFetcher } from '../../utils/fetch';
import { downloadDocument } from '../../utils/fetch';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';

export const REPORT_SUBPAGES = [
  {
    slug: 'property-cost-breakdown',
    title: 'Property Cost Breakdown',
    description: 'Parent and child rollups for utilities and property taxes.'
  },
  {
    slug: 'utility-trend',
    title: 'Utility Trend by Category',
    description: 'Monthly utility totals split by category.'
  },
  {
    slug: 'tax-projection-risk',
    title: 'Tax Projection Risk',
    description: 'Current vs projected tax totals and risk level.'
  },
  {
    slug: 'delinquent-alerts',
    title: 'Delinquent and Unpaid Alerts',
    description: 'Unpaid utilities and tax balances requiring action.'
  },
  {
    slug: 'utility-anomalies',
    title: 'Utility Anomaly Detection',
    description: 'Bills that exceed baseline thresholds.'
  },
  {
    slug: 'space-marketing',
    title: 'Space Marketing Generator',
    description: 'Email template and one-page flyer output for a space.'
  }
];

export function toCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export function formatPropertyLabel(property, propertyById) {
  if (!property) {
    return 'Unknown property';
  }

  const parentId =
    typeof property.parentPropertyId === 'object'
      ? property.parentPropertyId?._id
      : property.parentPropertyId;

  if (!parentId) {
    return property.name || 'Unnamed property';
  }

  const parent = propertyById[String(parentId)];
  if (!parent) {
    return property.name || 'Unnamed property';
  }

  return `${parent.name} / ${property.name}`;
}

export function buildDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 12);

  const toISODate = (value) => value.toISOString().slice(0, 10);

  return {
    startDate: toISODate(start),
    endDate: toISODate(end)
  };
}

export function useReportsFilters() {
  const defaultRange = useMemo(() => buildDefaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [propertyId, setPropertyId] = useState('');
  const [includePending, setIncludePending] = useState(false);

  const propertiesQuery = useQuery({
    queryKey: ['reports-properties'],
    queryFn: async () => {
      const response = await apiFetcher().get('/properties');
      return response.data || [];
    }
  });

  const propertyById = useMemo(() => {
    return (propertiesQuery.data || []).reduce((acc, property) => {
      acc[String(property._id)] = property;
      return acc;
    }, {});
  }, [propertiesQuery.data]);

  const propertyOptions = useMemo(() => {
    return [...(propertiesQuery.data || [])].sort((left, right) =>
      formatPropertyLabel(left, propertyById).localeCompare(
        formatPropertyLabel(right, propertyById)
      )
    );
  }, [propertiesQuery.data, propertyById]);

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    propertyId,
    setPropertyId,
    includePending,
    setIncludePending,
    propertyOptions,
    propertyById,
    loadingProperties: propertiesQuery.isLoading
  };
}

export function useReportsData({ startDate, endDate, propertyId, includePending }) {
  return useQuery({
    queryKey: [
      'reports-property-costs',
      startDate,
      endDate,
      propertyId,
      includePending
    ],
    queryFn: async () => {
      const response = await apiFetcher().get('/reports/property-costs', {
        params: {
          startDate,
          endDate,
          propertyId: propertyId || undefined,
          includePending
        }
      });
      return response.data;
    }
  });
}

export function exportPropertyCostsCsv({ startDate, endDate, propertyId, includePending }) {
  const suffix = `${startDate || 'start'}_${endDate || 'end'}`;

  downloadDocument({
    endpoint: `/reports/property-costs.csv?startDate=${encodeURIComponent(
      startDate
    )}&endDate=${encodeURIComponent(endDate)}${
      propertyId ? `&propertyId=${encodeURIComponent(propertyId)}` : ''
    }${includePending ? '&includePending=true' : ''}`,
    documentName: `Property costs ${suffix}.csv`
  });
}

export function ReportsSubpageNav({ currentSlug = '' }) {
  const router = useRouter();
  const organization = String(router.query.organization || '').trim();

  const basePath = organization ? `/${organization}/reports` : '/reports';

  return (
    <Card className="p-3 mb-4">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant={currentSlug === '' ? 'default' : 'outline'} size="sm">
          <Link href={basePath}>Overview</Link>
        </Button>
        {REPORT_SUBPAGES.map((page) => (
          <Button
            key={page.slug}
            asChild
            variant={currentSlug === page.slug ? 'default' : 'outline'}
            size="sm"
          >
            <Link href={`${basePath}/${page.slug}`}>{page.title}</Link>
          </Button>
        ))}
      </div>
    </Card>
  );
}

export function ReportsFiltersCard({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  propertyId,
  setPropertyId,
  includePending,
  setIncludePending,
  propertyOptions,
  propertyById,
  showIncludePending = true,
  onExportCsv
}) {
  return (
    <Card className="p-4 mb-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">Start date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">End date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 md:min-w-72">
          <label className="text-sm text-muted-foreground">Property</label>
          <select
            className="w-full h-10 rounded-md border bg-background px-3 text-sm"
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
          >
            <option value="">All properties</option>
            {propertyOptions.map((property) => (
              <option key={String(property._id)} value={String(property._id)}>
                {formatPropertyLabel(property, propertyById)}
              </option>
            ))}
          </select>
        </div>
        {showIncludePending ? (
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground md:pb-2">
            <input
              type="checkbox"
              checked={includePending}
              onChange={(event) => setIncludePending(event.target.checked)}
            />
            Include pending utility imports
          </label>
        ) : null}
        {onExportCsv ? (
          <div className="md:ml-auto">
            <Button type="button" onClick={onExportCsv} variant="outline">
              Export CSV
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
