import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@microrealestate/commonui/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { LuCircleFadingArrowUp } from 'react-icons/lu';
import useNewReleases from '@/hooks/useNewReleases';
import sanitizeReleaseNotes from '@/utils/sanitizeReleaseNotes';

// markdown output, plus GitHub's alert markup (`> [!WARNING]`)
const notesClassName = [
  'space-y-3 text-sm leading-relaxed',
  '[&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary',
  '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs',
  '[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5',
  '[&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold',
  '[&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
  '[&_.markdown-alert]:space-y-1 [&_.markdown-alert]:rounded-md [&_.markdown-alert]:border-l-4 [&_.markdown-alert]:bg-muted/50 [&_.markdown-alert]:px-3 [&_.markdown-alert]:py-2',
  '[&_.markdown-alert-title]:font-semibold',
  '[&_.markdown-alert-warning]:border-warning [&_.markdown-alert-caution]:border-destructive [&_.markdown-alert-important]:border-primary'
].join(' ');

// Shown only while a newer release exists; a click opens the notes
export default function UpdateAvailableButton() {
  const t = useTranslations('common');
  const releases = useNewReleases();
  const [open, setOpen] = useState(false);
  const notes = useMemo(
    () =>
      open
        ? releases.map((release) => ({
            ...release,
            html: sanitizeReleaseNotes(release.html)
          }))
        : [],
    [open, releases]
  );

  const [newest] = releases;
  if (!newest) {
    return null;
  }

  const label = t('Version {version} is available', {
    version: newest.version
  });

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="group h-9 shrink-0 gap-1.5 rounded-full bg-primary/10 px-3 text-primary hover:bg-primary/20 hover:text-primary"
        onClick={() => setOpen(true)}
        aria-label={label}
        title={label}
        data-cy="updateAvailableButton"
      >
        <LuCircleFadingArrowUp className="size-4 transition-transform duration-300 ease-out motion-safe:group-hover:-translate-y-0.5" />
        <span className="sm:hidden">{t('New version')}</span>
        <span className="hidden sm:inline">{label}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex max-h-[85svh] flex-col gap-4"
          aria-describedby={undefined}
          data-cy="updateAvailableDialog"
        >
          <DialogHeader>
            <DialogTitle className="text-xl">{label}</DialogTitle>
          </DialogHeader>
          <div className="-mx-6 min-h-0 flex-1 space-y-6 overflow-y-auto px-6">
            {notes.map((release) => (
              <section
                key={release.version}
                className="space-y-2"
                data-cy="releaseNotes"
              >
                {notes.length > 1 ? (
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {t('Version {version}', { version: release.version })}
                  </h3>
                ) : null}
                <div
                  className={notesClassName}
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitizeReleaseNotes
                  dangerouslySetInnerHTML={{ __html: release.html }}
                />
              </section>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setOpen(false)}
              data-cy="updateAvailableDialogClose"
            >
              {t('Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
