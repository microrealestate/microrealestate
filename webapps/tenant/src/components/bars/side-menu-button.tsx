'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils';
import useTranslation from '@/utils/i18n/client/useTranslation';

export type MenuItem = {
  key: string;
  Icon?: React.FC;
  labelId: string;
  pathname?: string;
  dataCy: string;
};

export default function SideMenuButton({
  item,
  selected,
  onClick
}: {
  item: MenuItem;
  selected?: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      // disabled={selected}
      onClick={onClick}
      className={cn(
        'border-none rounded-none h-12 w-full justify-start hover:bg-primary/60 hover:text-primary-foreground',
        selected
          ? 'disabled:opacity-100 bg-primary text-primary-foreground'
          : null
      )}
      data-cy={item.dataCy}
    >
      {item.Icon ? <item.Icon /> : null}
      <span className="ml-2">{t(item.labelId)}</span>
    </Button>
  );
}
