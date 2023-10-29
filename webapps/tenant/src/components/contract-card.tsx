import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Contract } from '@/types';
import { DocumentTable } from '@/components/document-table';
import getTranslation from '@/utils/i18n/server/getTranslation';
import { InvoiceTable } from '@/components/invoice-table';
import { LabelValue } from '@/components/label-value';
import { PropertyTable } from '@/components/property-table';
import { request } from '@/mocks/api';
import { StatusBadge } from '@/components/ui/status-badge';

export async function ContractCard() {
  const { t } = await getTranslation();
  const contract = await request.get<Contract>('/api/contract');

  return (
    <Card>
      {contract ? (
        <CardHeader>
          <CardTitle>
            <div className="flex justify-between">
              <div className="text-sm uppercase text-muted-foreground">
                {contract.name}
              </div>
              <StatusBadge variant={contract.status}>
                {contract.status === 'active'
                  ? t('In progress')
                  : t('Terminated')}
              </StatusBadge>
            </div>
          </CardTitle>
        </CardHeader>
      ) : null}
      <CardContent>
        <div className="flex flex-col gap-12">
          {contract ? (
            <>
              <LabelValue label={t('Tenant')} value={contract.tenantName} />

              <div className="flex">
                <LabelValue
                  label={t('Start date')}
                  value={contract.startDate}
                  className="w-1/3"
                />

                <LabelValue
                  label={t('End date')}
                  value={contract.endDate}
                  className="w-1/3"
                />
                <LabelValue
                  label={t('Termination date')}
                  value={contract.terminationDate}
                  className="w-1/3"
                />
              </div>

              <PropertyTable properties={contract.properties} />

              <DocumentTable documents={contract.documents} />

              <InvoiceTable invoices={contract.invoices} />
            </>
          ) : (
            <h1>{t('No contracts found')}</h1>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
