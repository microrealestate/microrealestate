import { Button } from './ui/button';
import { cn } from '../utils';

import useTranslation from 'next-translate/useTranslation';

export default function SideMenuButton({ item, selected, className, onClick }) {
  const { t } = useTranslation('common');

  return (
    <Button
      variant="ghost"
      // disabled={selected}
      onClick={onClick}
      className={cn(
        'border-none rounded-none h-12 w-full justify-start gap-2 hover:bg-primary/10',
        selected
          ? 'disabled:opacity-100 bg-primary text-primary-foreground'
          : null,
        className
      )}
      data-cy={item.dataCy}
    >
      {item.Icon ? <item.Icon className="size-6" /> : null}
      {item?.labelId ? <span className="ml-2">{t(item.labelId)}</span> : null}
    </Button>
  );
}
