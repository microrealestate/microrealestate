import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@microrealestate/commonui/components/ui/popover';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { RiArrowDownSLine } from 'react-icons/ri';
import { ToolbarButton, ToolbarMenuItem } from './ToolbarPrimitives';
import type { ToolbarItem } from './useToolbarItems';

export default function AlignMenu({ items }: { items: ToolbarItem[] }) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const current = items.find((item) => item.active) ?? items[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton
          label={t('Alignment')}
          disabled={current.disabled}
          className="w-auto gap-0.5 px-2"
        >
          {current.icon}
          <RiArrowDownSLine className="opacity-60" />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        {items.map((item) => (
          <ToolbarMenuItem
            key={item.key}
            label={item.label}
            shortcut={item.shortcut}
            icon={item.icon}
            active={item.active}
            disabled={item.disabled}
            onSelect={() => {
              setOpen(false);
              item.run();
            }}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}
