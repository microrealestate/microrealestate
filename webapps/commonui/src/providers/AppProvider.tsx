import type { Locale } from 'date-fns';
import { de, enUS, es, fr, ptBR } from 'date-fns/locale';
import moment from 'moment';
import 'moment/locale/de';
import 'moment/locale/es';
import 'moment/locale/fr';
import 'moment/locale/pt-br';
import { useLocale } from 'next-intl';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { createContext, useContext, useMemo } from 'react';
import { useIsClient } from 'usehooks-ts';
import { Toaster } from '../components/ui/sonner';
import EnvProvider from './EnvProvider';

const dateFnsLocales: Record<string, Locale> = {
  en: enUS,
  'fr-FR': fr,
  'pt-BR': ptBR,
  'de-DE': de,
  'es-CO': es
};

const LocaleContext = createContext<{
  dateFnsLocale: Locale;
}>({
  dateFnsLocale: enUS
});

export function useLocaleContext() {
  return useContext(LocaleContext);
}

interface AppProviderProps {
  children: React.ReactNode;
  env: Record<string, string | undefined>;
  themeStorageKey?: string;
}

export default function AppProvider({
  children,
  env,
  themeStorageKey = 'mre-theme'
}: AppProviderProps) {
  const isClient = useIsClient();
  const locale = useLocale();

  const dateFnsLocale = useMemo(() => {
    return dateFnsLocales[locale] || enUS;
  }, [locale]);

  useMemo(() => {
    moment.locale(locale.toLowerCase());
  }, [locale]);

  if (!isClient) {
    return null; // Avoid hydration mismatch
  }

  return (
    <NextThemesProvider
      attribute="class"
      storageKey={themeStorageKey}
      defaultTheme="system"
      enableSystem
    >
      <EnvProvider env={env}>
        <LocaleContext.Provider value={{ dateFnsLocale }}>
          {children}
          <Toaster
            position="bottom-center"
            closeButton
            toastOptions={{
              unstyled: true,
              classNames: {
                error:
                  'flex items-center gap-2 p-4 rounded-lg shadow-lg bg-destructive text-destructive-foreground',
                success:
                  'flex items-center gap-2 p-4 rounded-lg shadow-lg bg-success text-success-foreground',
                warning:
                  'flex items-center gap-2 p-4 rounded-lg shadow-lg bg-warning text-warning-foreground',
                info: 'flex items-center gap-2 p-4 rounded-lg shadow-lg bg-info text-info-foreground'
              }
            }}
          />
        </LocaleContext.Provider>
      </EnvProvider>
    </NextThemesProvider>
  );
}
