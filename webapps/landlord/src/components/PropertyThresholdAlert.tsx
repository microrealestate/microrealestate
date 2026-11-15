import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@microrealestate/commonui/components/ui/alert';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { PROPERTY_COUNT_WARN_THRESHOLD } from '@microrealestate/shared';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { LuInfo, LuX } from 'react-icons/lu';
import { useLocalStorage } from 'usehooks-ts';
import CommercialContactLink from '@/components/CommercialContactLink';
import SponsorLink from '@/components/SponsorLink';
import { PROPERTY_THRESHOLD_ALERT_KEY } from '@/utils/propertyThresholdAlert';
import { fetchPropertyCount, QueryKeys } from '@/utils/restcalls';

export default function PropertyThresholdAlert({
  className,
  dataCy = 'propertyThresholdAlert'
}: {
  className?: string;
  dataCy?: string;
}) {
  const t = useTranslations('common');
  const { data, error } = useQuery<{ count: number }>({
    queryKey: [QueryKeys.PROPERTY_COUNT],
    queryFn: () => fetchPropertyCount(),
    refetchOnMount: 'always'
  });

  const [dismissed, setDismissed] = useLocalStorage(
    PROPERTY_THRESHOLD_ALERT_KEY,
    false
  );

  if (
    dismissed ||
    error ||
    (data?.count ?? 0) <= PROPERTY_COUNT_WARN_THRESHOLD
  ) {
    return null;
  }

  return (
    <Alert className={className} data-cy={dataCy}>
      <LuInfo className="size-4" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDismissed(true)}
        aria-label={t('Close')}
        title={t('Close')}
        className="absolute right-2 top-2 size-8 text-muted-foreground"
        data-cy="dismissPropertyThresholdAlert"
      >
        <LuX />
      </Button>
      <AlertTitle className="pr-10">
        {t('You rent out more than {max} properties', {
          max: PROPERTY_COUNT_WARN_THRESHOLD
        })}
      </AlertTitle>
      <AlertDescription>
        <p className="text-muted-foreground">
          {t(
            'If the app helps you, you can buy me a coffee. If you use it for your business, please write to me.'
          )}
        </p>
        <div className="-ml-2 flex flex-wrap items-center gap-2 pt-2">
          <SponsorLink compact />
          <CommercialContactLink label={t('Write to me')} />
        </div>
      </AlertDescription>
    </Alert>
  );
}
