'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { LuMonitor, LuMoon, LuSun } from 'react-icons/lu';
import { useIsClient } from 'usehooks-ts';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

const THEMES = [
  { id: 'system', label: 'Use system setting (default)', Icon: LuMonitor },
  {
    id: 'light',
    label: 'Light mode',
    Icon: LuSun
  },
  { id: 'dark', label: 'Dark mode', Icon: LuMoon }
] as const;

type ThemeType = (typeof THEMES)[number]['id'];

const ThemeToggle = () => {
  const t = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const isClient = useIsClient();
  const { theme: selectedTheme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  if (!isClient) {
    // Render a placeholder with the same dimensions to avoid layout shift
    return (
      <Button variant="ghost" disabled>
        <LuMonitor />
      </Button>
    );
  }

  const SelectedIcon =
    THEMES.find(({ id }) => id === selectedTheme)?.Icon || LuMonitor;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost">
          <SelectedIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-2 flex flex-col space-y-2 w-fit">
        {THEMES.map((theme) => (
          <Button
            key={theme.id}
            variant={theme.id === selectedTheme ? 'default' : 'ghost'}
            onClick={() => handleThemeChange(theme.id)}
            className="justify-start"
          >
            <theme.Icon /> {t(theme.label)}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default ThemeToggle;
