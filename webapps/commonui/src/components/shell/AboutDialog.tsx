'use client';

import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@microrealestate/commonui/components/ui/dialog';
import { useEnv } from '@microrealestate/commonui/providers/EnvProvider';
import { cn } from '@microrealestate/commonui/utils';
import { useFormatter, useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { LuArrowUpRight, LuChevronLeft, LuHeart } from 'react-icons/lu';
import AppLogo from '../AppLogo';

type LicenseEntry = {
  name: string;
  license: string;
  author?: string;
  url?: string;
  text?: string;
};

type LicenseState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; entries: LicenseEntry[] };

const version = {
  release: process.env.NEXT_PUBLIC_RELEASE_VERSION,
  sha: process.env.NEXT_PUBLIC_GIT_SHA,
  date: process.env.BUILD_DATE
};

const app = {
  author: {
    name: 'Camel Aissani',
    url: 'https://www.linkedin.com/in/caissani'
  },
  license: {
    name: 'Sustainable Use License',
    url: 'https://github.com/microrealestate/microrealestate/blob/main/LICENSE.md'
  },
  issues: { url: 'https://github.com/microrealestate/microrealestate/issues' }
};

function ExternalLink({
  href,
  children
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-0.5 font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
    >
      {children}
      <LuArrowUpRight className="size-3" aria-hidden="true" />
    </a>
  );
}

function useLicenses(open: boolean) {
  const basePath = useEnv('BASE_PATH') || '';
  const [state, setState] = useState<LicenseState>({ status: 'loading' });

  const requested = useRef(false);
  useEffect(() => {
    if (!open || requested.current) {
      return;
    }
    requested.current = true;
    setState({ status: 'loading' });
    fetch(`${basePath}/licenses.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json() as Promise<LicenseEntry[]>;
      })
      .then((entries) => setState({ status: 'loaded', entries }))
      .catch(() => {
        requested.current = false;
        setState({ status: 'error' });
      });
  }, [open, basePath]);

  return state;
}

function ViewHeader({
  title,
  backLabel,
  onBack
}: {
  title: string;
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <DialogHeader className="flex-row items-center gap-1 space-y-0 pr-8">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        onClick={onBack}
        aria-label={backLabel}
        data-cy="aboutBack"
      >
        <LuChevronLeft className="size-5" />
      </Button>
      <DialogTitle className="min-w-0 truncate text-lg">{title}</DialogTitle>
    </DialogHeader>
  );
}

function AboutView({
  open,
  licenses,
  onShowLicenses
}: {
  open: boolean;
  licenses: LicenseState;
  onShowLicenses: () => void;
}) {
  const t = useTranslations('common');
  const format = useFormatter();
  const appName = 'MicroRealEstate';
  const label = version.release?.trim() || version.sha?.trim();
  const taglines = [
    t('Rent paid, receipt ready, peace of mind.'),
    t('Clear leases, tracked payments, no surprises.'),
    t('Less paperwork, more weekends.'),
    t('Good tenancies start with clear paperwork.')
  ];
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    if (open) {
      setTaglineIndex(Math.floor(Math.random() * taglines.length));
    }
  }, [open, taglines.length]);

  const date = version.date ? new Date(version.date) : undefined;
  const code = (chunks: ReactNode) => (
    <code className="font-mono">{chunks}</code>
  );

  return (
    <>
      <DialogHeader className="items-center gap-3 text-center sm:text-center">
        <button
          type="button"
          onClick={() => setPlayCount((count) => count + 1)}
          aria-label={t('Play the animation again')}
          className="rounded-xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          data-cy="aboutIllustration"
        >
          <AppLogo key={playCount} size={96} animated />
        </button>
        <DialogTitle className="text-2xl">{appName}</DialogTitle>
        <DialogDescription className="italic" data-cy="aboutTagline">
          {taglines[taglineIndex]}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center gap-1 text-center text-sm text-muted-foreground">
        <p data-cy="aboutAuthor">
          {t.rich(
            'Crafted with <heart></heart> by <authorLink>{author}</authorLink>',
            {
              author: app.author.name,
              heart: () => (
                <>
                  <LuHeart
                    className="inline size-4 -translate-y-px fill-current text-red-500 motion-safe:animate-pulse"
                    aria-hidden="true"
                  />
                  <span className="sr-only">♥</span>
                </>
              ),
              authorLink: (chunks) => (
                <ExternalLink href={app.author.url}>{chunks}</ExternalLink>
              )
            }
          )}
        </p>
        <p data-cy="aboutLicense">
          {t.rich('Shared under the <licenseLink>{license}</licenseLink>', {
            license: app.license.name,
            licenseLink: (chunks) => (
              <ExternalLink href={app.license.url}>{chunks}</ExternalLink>
            )
          })}
        </p>
        <p data-cy="aboutHelp">
          {t.rich(
            'Found a bug or need help? <issuesLink>Tell us on GitHub</issuesLink>',
            {
              issuesLink: (chunks) => (
                <ExternalLink href={app.issues.url}>{chunks}</ExternalLink>
              )
            }
          )}
        </p>
        {label ? (
          <p className="text-xs" data-cy="aboutVersion">
            {date && !Number.isNaN(date.getTime())
              ? t.rich('Build <code>{sha}</code> · {date}', {
                  sha: label,
                  date: format.dateTime(date, { dateStyle: 'long' }),
                  code
                })
              : t.rich('Build <code>{sha}</code>', { sha: label, code })}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onShowLicenses}
          disabled={licenses.status !== 'loaded'}
          className="mt-3 text-xs text-muted-foreground/80 underline-offset-4 hover:text-foreground hover:underline disabled:cursor-default disabled:opacity-50 disabled:hover:no-underline"
          data-cy="aboutLicensesNav"
        >
          {t('Standing on the shoulders of open-source giants')}
          <span aria-hidden="true"> ›</span>
        </button>
        {licenses.status === 'error' ? (
          <p className="text-xs text-destructive">
            {t('The license list could not be loaded')}
          </p>
        ) : null}
      </div>
    </>
  );
}

function LicensesView({
  entries,
  onSelect,
  onBack
}: {
  entries: LicenseEntry[];
  onSelect: (entry: LicenseEntry) => void;
  onBack: () => void;
}) {
  const t = useTranslations('common');

  return (
    <>
      <ViewHeader
        title={t('Open-source licenses')}
        backLabel={t('Back')}
        onBack={onBack}
      />
      <DialogDescription>
        {t('Built on the work of {count} open-source projects', {
          count: entries.length
        })}
      </DialogDescription>
      <ul
        className="-mx-2 min-h-0 flex-1 overflow-y-auto"
        data-cy="aboutLicenses"
      >
        {entries.map((entry, index) => (
          <li key={`${entry.name}-${index}`}>
            <button
              type="button"
              onClick={() => onSelect(entry)}
              className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-accent"
            >
              <span className="min-w-0 truncate">{entry.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function PackageView({
  entry,
  onBack
}: {
  entry: LicenseEntry;
  onBack: () => void;
}) {
  const t = useTranslations('common');
  return (
    <>
      <ViewHeader title={entry.name} backLabel={t('Back')} onBack={onBack} />
      <DialogDescription className="flex flex-col gap-1">
        <span>{entry.license}</span>
        {entry.author ? (
          <span>{t('By {author}', { author: entry.author })}</span>
        ) : null}
        {entry.url ? (
          <a
            href={entry.url}
            target="_blank"
            rel="noreferrer"
            className="break-all text-primary underline"
          >
            {entry.url}
          </a>
        ) : null}
      </DialogDescription>
      <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
        {entry.text ||
          t('Released under the {license} license', {
            license: entry.license
          })}
      </pre>
    </>
  );
}

type View = 'about' | 'licenses' | LicenseEntry;

export default function AboutDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const licenses = useLicenses(open);
  const [view, setView] = useState<View>('about');

  useEffect(() => {
    if (open) {
      setView('about');
    }
  }, [open]);

  const entries = licenses.status === 'loaded' ? licenses.entries : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex max-h-[90svh] flex-col gap-4',
          view === 'about' ? 'gap-6 overflow-y-auto' : 'h-[min(40rem,85svh)]'
        )}
        data-cy="aboutDialog"
      >
        {view === 'about' ? (
          <AboutView
            open={open}
            licenses={licenses}
            onShowLicenses={() => setView('licenses')}
          />
        ) : view === 'licenses' ? (
          <LicensesView
            entries={entries}
            onSelect={setView}
            onBack={() => setView('about')}
          />
        ) : (
          <PackageView entry={view} onBack={() => setView('licenses')} />
        )}
      </DialogContent>
    </Dialog>
  );
}
