import { cn } from '@microrealestate/commonui/utils';
import { SPONSOR_URL } from '@microrealestate/shared';
import { useTranslations } from 'next-intl';
import { LuCoffee } from 'react-icons/lu';

export default function SponsorLink({
  className,
  label,
  dataCy = 'sponsorLink'
}: {
  className?: string;
  label?: string;
  dataCy?: string;
}) {
  const t = useTranslations('common');

  return (
    <a
      href={SPONSOR_URL}
      target="_blank"
      rel="noreferrer noopener"
      data-cy={dataCy}
      className={cn(
        'group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-accent hover:border-primary',
        className
      )}
    >
      <LuCoffee className="size-5 shrink-0 text-warning transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-110" />
      <span className="flex flex-col text-left">
        <span className="text-sm font-medium">
          {label ?? t('Buy me a coffee')}
        </span>
        <span className="text-xs text-muted-foreground">
          {t('Keeps the project alive')}
        </span>
      </span>
    </a>
  );
}
