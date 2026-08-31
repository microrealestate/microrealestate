'use client';

import { useQuery } from '@tanstack/react-query';
import { notFound, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LuArrowLeft } from 'react-icons/lu';
import { LeaseInfo } from '@/components/lease-info';
import Page from '@/components/page';
import { ReceiptNoticeTable } from '@/components/receipt-notice-table';
import { Link } from '@/i18n/navigation';
import { QueryKeys } from '@/utils/fetch/queryKeys';
import { fetchAllTenantsClient } from '@/utils/fetch/tenant';

export default function TenantNoticesAndReceiptsPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const t = useTranslations('common');
  const { data: leases, isLoading } = useQuery({
    queryKey: [QueryKeys.TENANTS],
    queryFn: fetchAllTenantsClient,
    refetchOnMount: 'always'
  });

  if (isLoading) return null;

  const lease = leases?.find((l) => l.tenant.id === tenantId);

  if (!lease) {
    notFound();
  }

  const showBackLink = (leases?.length ?? 0) > 1;

  return (
    <Page
      description={t('View your notices and receipts.')}
      dataCy="tenantNoticesAndReceiptsPage"
    >
      {showBackLink && (
        <Link
          href="/noticesandreceipts"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LuArrowLeft className="size-4" />
          {t('Back')}
        </Link>
      )}
      <div className="space-y-4">
        <LeaseInfo lease={lease} />
        <ReceiptNoticeTable lease={lease} />
      </div>
    </Page>
  );
}
