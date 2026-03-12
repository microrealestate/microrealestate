import { useMemo, useState } from 'react';
import { LuExternalLink, LuSearch, LuWrench } from 'react-icons/lu';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

import { withAuthentication } from '../../../components/Authentication';
import Page from '../../../components/Page';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { apiFetcher } from '../../../utils/fetch';

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

  const { data: properties = [], isLoading: loadingProperties } = useQuery({
    queryKey: ['utilities-properties'],
    queryFn: async () => {
      const response = await apiFetcher().get('/properties');
      return response.data || [];
    }
  });

  const {
    data: utilities = [],
    isLoading: loadingUtilities,
    isError
  } = useQuery({
    queryKey: ['utilities-all'],
    queryFn: async () => {
      const response = await apiFetcher().get('/utilities');
      return response.data || [];
    }
  });

  const propertyById = useMemo(
    () =>
      (properties || []).reduce((acc, property) => {
        acc[String(property._id)] = property;
        return acc;
      }, {}),
    [properties]
  );

  const utilityTypes = useMemo(() => {
    const typeSet = new Set();
    utilities.forEach((utility) => {
      if (utility?.type) {
        typeSet.add(utility.type);
      }
    });
    return Array.from(typeSet).sort();
  }, [utilities]);

  const billingMonths = useMemo(() => {
    const monthSet = new Set();
    utilities.forEach((utility) => {
      if (utility?.billingMonth) {
        monthSet.add(String(utility.billingMonth));
      }
    });
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [utilities]);

  const filteredUtilities = useMemo(() => {
    const cleanedSearchText = searchText.trim().toLowerCase();
    return utilities.filter((utility) => {
      if (typeFilter !== 'all' && utility.type !== typeFilter) {
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
              {utilityTypes.map((type) => (
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
