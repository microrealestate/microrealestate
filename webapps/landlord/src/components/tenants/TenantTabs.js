import { Card } from '@microrealestate/commonui/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@microrealestate/commonui/components/ui/tabs';
import { observer } from 'mobx-react-lite';
import { useTranslations } from 'next-intl';
import { LuTriangleAlert } from 'react-icons/lu';
import { useStore } from '@/providers/StoreProvider';
import ReadOnlyBanner from '../ReadOnlyBanner';
import BillingForm from './forms/BillingForm';
import DocumentsForm from './forms/DocumentsForm';
import LeaseContractForm from './forms/LeaseContractForm';
import TenantForm from './forms/TenantForm';

function TabCard({ children, readOnly }) {
  return (
    <Card className="relative p-6">
      <ReadOnlyBanner readOnly={readOnly} className="absolute top-8 right-6" />
      {children}
    </Card>
  );
}

function TenantTabs({ onSubmit, readOnly }) {
  const t = useTranslations('common');
  const store = useStore();

  const hasMissingCompulsoryDocuments =
    store.tenant.selected?.filesToUpload?.some(({ missing }) => missing);

  return (
    <>
      <Tabs defaultValue="tenant">
        <TabsList className="flex items-start justify-start h-auto w-auto overflow-x-auto">
          <TabsTrigger value="tenant" className="min-w-48 sm:w-full">
            {t('Tenant')}
          </TabsTrigger>
          <TabsTrigger value="lease" className="min-w-48 sm:w-full">
            {t('Lease')}
          </TabsTrigger>
          <TabsTrigger value="billing" className="min-w-48 sm:w-full">
            {t('Billing')}
          </TabsTrigger>
          <TabsTrigger value="documents" className="min-w-48 sm:w-full">
            <div className="flex justify-center items-center gap-1">
              {hasMissingCompulsoryDocuments ? (
                <LuTriangleAlert
                  className="text-warning size-6"
                  aria-label={t('Some compulsory documents are missing')}
                />
              ) : null}
              <div>{t('Documents')}</div>
            </div>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tenant">
          <TabCard readOnly={readOnly}>
            <TenantForm onSubmit={onSubmit} readOnly={readOnly} />
          </TabCard>
        </TabsContent>
        <TabsContent value="lease">
          <TabCard readOnly={readOnly}>
            <LeaseContractForm onSubmit={onSubmit} readOnly={readOnly} />
          </TabCard>
        </TabsContent>
        <TabsContent value="billing">
          <TabCard readOnly={readOnly}>
            <BillingForm onSubmit={onSubmit} readOnly={readOnly} />
          </TabCard>
        </TabsContent>
        <TabsContent value="documents">
          <TabCard readOnly={readOnly}>
            <DocumentsForm onSubmit={onSubmit} readOnly={readOnly} />
          </TabCard>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default observer(TenantTabs);
