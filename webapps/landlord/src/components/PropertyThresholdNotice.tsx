import { cn } from '@microrealestate/commonui/utils';
import {
  COMMERCIAL_CONTACT_URL,
  PROPERTY_COUNT_WARN_THRESHOLD,
  SPONSOR_URL
} from '@microrealestate/shared';
import { useTranslations } from 'next-intl';
import { LuCoffee, LuMail } from 'react-icons/lu';

const linkClassName =
  'group inline-flex items-center gap-1 underline underline-offset-4 hover:text-primary';

export default function PropertyThresholdNotice({
  className,
  dataCy = 'propertyThresholdNotice'
}: {
  className?: string;
  dataCy?: string;
}) {
  const t = useTranslations('common');

  return (
    <span
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 whitespace-normal text-base text-left text-muted-foreground',
        className
      )}
      data-cy={dataCy}
    >
      <a
        href={COMMERCIAL_CONTACT_URL}
        className={linkClassName}
        data-cy="commercialContactLink"
      >
        <LuMail className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
        {t('Managing more than {max} properties? Contact me', {
          max: PROPERTY_COUNT_WARN_THRESHOLD
        })}
      </a>
      <a
        href={SPONSOR_URL}
        target="_blank"
        rel="noreferrer noopener"
        className={linkClassName}
        data-cy="sponsorLink"
      >
        <LuCoffee className="size-4 shrink-0 transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-110" />
        {t('Buy me a coffee if the app helps you')}
      </a>
    </span>
  );
}
