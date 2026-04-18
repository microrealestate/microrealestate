import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';

import { apiFetcher } from '../../../utils/fetch';
import { downloadDocument } from '../../../utils/fetch';
import { withAuthentication } from '../../../components/Authentication';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import Page from '../../../components/Page';
import RentReportCard from '../../../components/reports/RentReportCard';
import {
  loadCityRentRanges,
  mergeCityRentRanges
} from '../../../components/properties/CityEstimatesCard';

function toCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatPropertyLabel(property, propertyById) {
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

function buildDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 12);

  const toISODate = (value) => value.toISOString().slice(0, 10);

  return {
    startDate: toISODate(start),
    endDate: toISODate(end)
  };
}

function ReportsPage() {
  const router = useRouter();
  const organization = String(router.query.organization || '').trim();
  const defaultRange = useMemo(() => buildDefaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [propertyId, setPropertyId] = useState('');
  const [includePending, setIncludePending] = useState(false);
  const [cityRentEstimates, setCityRentEstimates] = useState(() =>
    mergeCityRentRanges()
  );

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

  const cityList = useMemo(() => {
    return [
      ...new Set(
        (propertiesQuery.data || [])
          .map((property) => property?.address?.city?.trim())
          .filter(Boolean)
      )
    ].sort((left, right) => left.localeCompare(right));
  }, [propertiesQuery.data]);

  useEffect(() => {
    const storedRanges = loadCityRentRanges(organization);
    setCityRentEstimates((previousRanges) =>
      mergeCityRentRanges(storedRanges, Object.keys(previousRanges))
    );
  }, [organization]);

  useEffect(() => {
    setCityRentEstimates((previousRanges) =>
      mergeCityRentRanges(previousRanges, cityList)
    );
  }, [cityList]);

  const reportsQuery = useQuery({
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

  const breakdownRows = reportsQuery.data?.sections?.propertyCostBreakdown || [];
  const utilityTypes = reportsQuery.data?.sections?.utilityTypes || [
    'power',
    'gas',
    'water',
    'sewer',
    'trash',
    'internet',
    'other'
  ];

  const totals = useMemo(() => {
    return breakdownRows.reduce(
      (accumulator, row) => {
        accumulator.utilities += Number(row.utilitiesTotal || 0);
        utilityTypes.forEach((type) => {
          accumulator[type] += Number(row[`${type}Total`] || 0);
        });
        accumulator.combined += Number(row.combinedCost || 0);
        return accumulator;
      },
      utilityTypes.reduce(
        (accumulator, type) => ({
          ...accumulator,
          [type]: 0
        }),
        { utilities: 0, combined: 0 }
      )
    );
  }, [breakdownRows]);

  function handleExportCsv() {
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

  return (
    <Page
      loading={reportsQuery.isLoading || propertiesQuery.isLoading}
      dataCy="reportsPage"
    >
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
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground md:pb-2">
            <input
              type="checkbox"
              checked={includePending}
              onChange={(event) => setIncludePending(event.target.checked)}
            />
            Include pending utility imports
          </label>
          <div className="md:ml-auto">
            <Button type="button" onClick={handleExportCsv} variant="outline">
              Export CSV
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
        </div>
      </Card>

      <Tabs defaultValue="property-cost-breakdown" className="mb-4">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="property-cost-breakdown">Utility Breakdown</TabsTrigger>
          <TabsTrigger value="rent-report">Rent Report</TabsTrigger>
        </TabsList>

        <TabsContent value="property-cost-breakdown">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
            <Card className="p-4">
              <div className="text-xs uppercase text-muted-foreground">Utilities total</div>
              <div className="text-xl font-semibold">{toCurrency(totals.utilities)}</div>
            </Card>
            {utilityTypes.map((type) => (
              <Card key={type} className="p-4">
                <div className="text-xs uppercase text-muted-foreground">{type}</div>
                <div className="text-xl font-semibold">{toCurrency(totals[type])}</div>
              </Card>
            ))}
          </div>

          <Card className="p-4 mb-4 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-3">Utility breakdown</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-2">Property</th>
                  {utilityTypes.map((type) => (
                    <th key={type} className="py-2 pr-2 capitalize">{type}</th>
                  ))}
                  <th className="py-2 pr-2">Combined</th>
                </tr>
              </thead>
              {breakdownRows.map((row) => (
                <tbody key={`group-${row.parentPropertyId}`}>
                  <tr className="border-b bg-muted/25">
                    <td className="py-2 pr-2 font-medium">{row.parentPropertyName}</td>
                    {utilityTypes.map((type) => (
                      <td key={`${row.parentPropertyId}-${type}`} className="py-2 pr-2">
                        {toCurrency(row[`${type}Total`])}
                      </td>
                    ))}
                    <td className="py-2 pr-2 font-semibold">{toCurrency(row.combinedCost)}</td>
                  </tr>
                  {(row.childRows || []).map((child) => (
                    <tr key={`child-${child.propertyId}`} className="border-b">
                      <td className="py-2 pr-2 pl-6 text-muted-foreground">{child.propertyName}</td>
                      {utilityTypes.map((type) => (
                        <td key={`${child.propertyId}-${type}`} className="py-2 pr-2">
                          {toCurrency(child[`${type}Total`])}
                        </td>
                      ))}
                      <td className="py-2 pr-2">{toCurrency(child.combinedCost)}</td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="rent-report">
          <RentReportCard
            cityList={cityList}
            cityRentEstimates={cityRentEstimates}
            properties={propertiesQuery.data || []}
          />
        </TabsContent>
      </Tabs>
    </Page>
  );
}

export default withAuthentication(ReportsPage);
