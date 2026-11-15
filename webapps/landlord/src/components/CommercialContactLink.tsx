import { cn } from '@microrealestate/commonui/utils';
import { COMMERCIAL_CONTACT_URL } from '@microrealestate/shared';
import { LuMail } from 'react-icons/lu';

export default function CommercialContactLink({
  className,
  label,
  dataCy = 'commercialContactLink'
}: {
  className?: string;
  label: string;
  dataCy?: string;
}) {
  return (
    <a
      href={COMMERCIAL_CONTACT_URL}
      data-cy={dataCy}
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        className
      )}
    >
      <LuMail className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      <span>{label}</span>
    </a>
  );
}
