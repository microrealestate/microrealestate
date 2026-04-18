import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiFetcher } from '../../../utils/fetch';
import { downloadDocument } from '../../../utils/fetch';
import { withAuthentication } from '../../../components/Authentication';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import Page from '../../../components/Page';

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
  const trendRows = reportsQuery.data?.sections?.utilityTrendByCategory || [];
  const utilityAlerts = reportsQuery.data?.sections?.delinquentAlerts?.utilities || [];
  const taxAlerts = reportsQuery.data?.sections?.delinquentAlerts?.taxes || [];
  const anomalies = reportsQuery.data?.sections?.utilityAnomalies || [];
  const taxRisk = reportsQuery.data?.sections?.taxProjectionRisk || [];

  const totals = useMemo(() => {
    return breakdownRows.reduce(
      (acc, row) => {
        acc.utilities += Number(row.utilitiesTotal || 0);
        acc.taxDue += Number(row.taxDue || 0);
        acc.taxBalance += Number(row.taxBalance || 0);
        acc.combined += Number(row.combinedCost || 0);
        return acc;
      },
      { utilities: 0, taxDue: 0, taxBalance: 0, combined: 0 }
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
      </Card>

      <Tabs defaultValue="property-cost-breakdown" className="mb-4">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="property-cost-breakdown">Property Cost Breakdown</TabsTrigger>
          <TabsTrigger value="utility-trend">Utility Trend</TabsTrigger>
          <TabsTrigger value="tax-projection-risk">Tax Projection Risk</TabsTrigger>
          <TabsTrigger value="delinquent-alerts">Delinquent Alerts</TabsTrigger>
          <TabsTrigger value="utility-anomalies">Utility Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="property-cost-breakdown">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <Card className="p-4">
              <div className="text-xs uppercase text-muted-foreground">Utilities</div>
              <div className="text-xl font-semibold">{toCurrency(totals.utilities)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase text-muted-foreground">Tax Due</div>
              <div className="text-xl font-semibold">{toCurrency(totals.taxDue)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase text-muted-foreground">Tax Balance</div>
              <div className="text-xl font-semibold">{toCurrency(totals.taxBalance)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase text-muted-foreground">Combined Cost</div>
              <div className="text-xl font-semibold">{toCurrency(totals.combined)}</div>
            </Card>
          </div>

          <Card className="p-4 mb-4 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-3">Property cost breakdown</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-2">Property</th>
                  <th className="py-2 pr-2">Utilities</th>
                  <th className="py-2 pr-2">Tax Due</th>
                  <th className="py-2 pr-2">Tax Paid</th>
                  <th className="py-2 pr-2">Tax Balance</th>
                  <th className="py-2 pr-2">Combined</th>
                </tr>
              </thead>
              {breakdownRows.map((row) => (
                <tbody key={`group-${row.parentPropertyId}`}>
                  <tr className="border-b bg-muted/25">
                    <td className="py-2 pr-2 font-medium">{row.parentPropertyName}</td>
                    <td className="py-2 pr-2">{toCurrency(row.utilitiesTotal)}</td>
                    <td className="py-2 pr-2">{toCurrency(row.taxDue)}</td>
                    <td className="py-2 pr-2">{toCurrency(row.taxPaid)}</td>
                    <td className="py-2 pr-2">{toCurrency(row.taxBalance)}</td>
                    <td className="py-2 pr-2 font-semibold">{toCurrency(row.combinedCost)}</td>
                  </tr>
                  {(row.childRows || []).map((child) => (
                    <tr key={`child-${child.propertyId}`} className="border-b">
                      <td className="py-2 pr-2 pl-6 text-muted-foreground">{child.propertyName}</td>
                      <td className="py-2 pr-2">{toCurrency(child.utilitiesTotal)}</td>
                      <td className="py-2 pr-2">{toCurrency(child.taxDue)}</td>
                      <td className="py-2 pr-2">{toCurrency(child.taxPaid)}</td>
                      <td className="py-2 pr-2">{toCurrency(child.taxBalance)}</td>
                      <td className="py-2 pr-2">{toCurrency(child.combinedCost)}</td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="utility-trend">
          <Card className="p-4 mb-4">
            <h2 className="text-lg font-semibold mb-3">Utility trend by category</h2>
            <div className="space-y-2 max-h-96 overflow-auto text-sm">
              {trendRows.length ? (
                trendRows.map((row) => (
                  <div key={row.billingMonth} className="border rounded p-2">
                    <div className="font-medium">{row.billingMonth}</div>
                    <div className="text-muted-foreground">Total: {toCurrency(row.total)}</div>
                    <div className="mt-1 text-xs">
                      {Object.entries(row.categories || {})
                        .map(([category, amount]) => `${category}: ${toCurrency(amount)}`)
                        .join(' | ')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No utility trend data for selected filters.</div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tax-projection-risk">
          <Card className="p-4 mb-4">
            <h2 className="text-lg font-semibold mb-3">Tax projection risk</h2>
            <div className="space-y-2 max-h-96 overflow-auto text-sm">
              {taxRisk.length ? (
                taxRisk.map((item) => (
                  <div key={item.propertyId} className="border rounded p-2">
                    <div className="font-medium">{item.propertyLabel}</div>
                    <div>Current: {toCurrency(item.currentTotal)}</div>
                    <div>Projected: {toCurrency(item.projectedTotal)}</div>
                    <div>
                      Increase: {toCurrency(item.projectedIncrease)} ({item.projectedIncreasePercent.toFixed(2)}%)
                    </div>
                    <div className="uppercase text-xs text-muted-foreground">Risk: {item.riskLevel}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No tax risk data for selected filters.</div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="delinquent-alerts">
          <Card className="p-4 mb-4">
            <h2 className="text-lg font-semibold mb-3">Delinquent and unpaid alerts</h2>
            <div className="space-y-2 text-sm max-h-96 overflow-auto">
              {utilityAlerts.length === 0 && taxAlerts.length === 0 ? (
                <div className="text-muted-foreground">No delinquent alerts in selected range.</div>
              ) : null}

              {utilityAlerts.map((alert) => (
                <div key={`u-${alert.utilityId}`} className="rounded border p-2">
                  <div className="font-medium">Utility: {alert.propertyLabel}</div>
                  <div>
                    {alert.type} {alert.billingMonth ? `(${alert.billingMonth})` : ''} - {toCurrency(alert.amount)}
                  </div>
                </div>
              ))}

              {taxAlerts.map((alert) => (
                <div key={`t-${alert.statementId}`} className="rounded border p-2">
                  <div className="font-medium">Tax: {alert.propertyLabel}</div>
                  <div>
                    {alert.taxYearLabel} balance {toCurrency(alert.balance)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="utility-anomalies">
          <Card className="p-4 mb-4">
            <h2 className="text-lg font-semibold mb-3">Utility anomaly detection</h2>
            <div className="space-y-2 text-sm max-h-96 overflow-auto">
              {anomalies.length ? (
                anomalies.map((anomaly) => (
                  <div key={anomaly.utilityId} className="rounded border p-2">
                    <div className="font-medium">
                      {anomaly.propertyLabel} - {anomaly.type}
                    </div>
                    <div>
                      {anomaly.billingMonth} amount {toCurrency(anomaly.amount)}
                    </div>
                    <div>
                      Baseline {toCurrency(anomaly.baselineAmount)} (+{anomaly.percentAbove.toFixed(2)}%)
                    </div>
                    <div className="uppercase text-xs text-muted-foreground">{anomaly.severity}</div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground">No anomalies detected for selected range.</div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </Page>
  );
}

export default withAuthentication(ReportsPage);
