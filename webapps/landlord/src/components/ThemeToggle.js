import { LuMoon, LuSun } from 'react-icons/lu';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

const THEME_STORAGE_KEY = 'mre-theme';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      const shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark;

      document.documentElement.classList.toggle('dark', shouldUseDark);
      setIsDark(shouldUseDark);
      setMounted(true);
    } catch {
      setMounted(true);
    }
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    document.documentElement.classList.toggle('dark', nextIsDark);
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      nextIsDark ? 'dark' : 'light'
    );
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="text-muted-foreground"
      disabled={!mounted}
    >
      {isDark ? <LuSun className="h-5 w-5" /> : <LuMoon className="h-5 w-5" />}
    </Button>
  );
}
