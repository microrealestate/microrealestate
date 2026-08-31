'use client';

import { Badge } from '@microrealestate/commonui/components/ui/badge';
import {
  Card,
  CardContent
} from '@microrealestate/commonui/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { LeaseInfo } from '@/components/lease-info';
import Page from '@/components/page';
import { Link, useRouter } from '@/i18n/navigation';
import { QueryKeys } from '@/utils/fetch/queryKeys';
import { fetchAllTenantsClient } from '@/utils/fetch/tenant';

export default function NoticesAndReceiptsPage() {
  const t = useTranslations('common');
  const router = useRouter();
  const { data: leases, isLoading } = useQuery({
    queryKey: [QueryKeys.TENANTS],
    queryFn: fetchAllTenantsClient,
    refetchOnMount: 'always'
  });

  const shouldRedirect = !isLoading && leases?.length === 1;

  useEffect(() => {
    if (shouldRedirect && leases) {
      router.replace(`/noticesandreceipts/${leases[0].tenant.id}`);
    }
  }, [shouldRedirect, leases, router]);

  if (isLoading || !leases || leases.length === 0) return null;
  if (shouldRedirect) return null;

  return (
    <Page
      description={t('View your notices and receipts.')}
      dataCy="noticesAndReceiptsPage"
    >
      {leases.map((lease) => {
        const balanceDue = lease.balance < 0;
        const unpaidCount = lease.receipts.filter(
          (inv) => inv.status !== 'paid'
        ).length;

        const badgeVariant = balanceDue ? 'warning' : 'success';
        const badgeLabel = balanceDue
          ? t('{count} outstanding', { count: unpaidCount })
          : t('Up to date');

        return (
          <Link
            key={lease.tenant.id}
            href={`/noticesandreceipts/${lease.tenant.id}`}
          >
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <LeaseInfo lease={lease} />
                <Badge variant={badgeVariant} className="shrink-0 ml-4">
                  {badgeLabel}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </Page>
  );
}
