'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import type { SetStateAction } from 'react';
import { LuMonitor, LuMoon, LuSun } from 'react-icons/lu';
import { useIsClient } from 'usehooks-ts';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';

const THEMES = [
  { id: 'system', label: 'Use system setting (default)', Icon: LuMonitor },
  { id: 'light', label: 'Light mode', Icon: LuSun },
  { id: 'dark', label: 'Dark mode', Icon: LuMoon }
] as const;

export default function ThemeSwitch() {
  const t = useTranslations('common');
  const isClient = useIsClient();
  const { theme: selectedTheme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between gap-2 px-4 h-12">
      <span className="text-sm font-medium">{t('Appearance')}</span>
      <ToggleGroup
        type="single"
        variant="outline"
        value={isClient ? selectedTheme || 'system' : undefined}
        onValueChange={(value: SetStateAction<string>) => {
          if (value) {
            setTheme(value);
          }
        }}
        aria-label={t('Appearance')}
      >
        {THEMES.map(({ id, label, Icon }) => (
          <ToggleGroupItem
            key={id}
            value={id}
            aria-label={t(label)}
            title={t(label)}
            disabled={!isClient}
          >
            <Icon />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
