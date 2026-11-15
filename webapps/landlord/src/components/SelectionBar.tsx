import { Button } from '@microrealestate/commonui/components/ui/button';
import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect } from 'react';
import { LuX } from 'react-icons/lu';

export default function SelectionBar({
  label,
  onClose,
  closeLabel,
  closeDisabled,
  onSelectAll,
  allSelected,
  children,
  dataCy
}: {
  label: string;
  onClose: () => void;
  closeLabel: string;
  closeDisabled?: boolean;
  onSelectAll: () => void;
  allSelected: boolean;
  children?: ReactNode;
  dataCy?: string;
}) {
  const t = useTranslations('common');
  useEffect(() => {
    if (closeDisabled) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !document.querySelector('[role="dialog"]')
      ) {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeDisabled, onClose]);

  return (
    <>
      {/* Room under the last row, so the bar never covers it */}
      <div className="h-20" aria-hidden="true" />
      <section
        aria-label={label}
        data-cy={dataCy}
        className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center gap-2 border-t bg-card px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-6 md:left-1/2 md:w-auto md:min-w-[28rem] md:max-w-[calc(100%-3rem)] md:-translate-x-1/2 md:rounded-xl md:border md:pb-2 md:shadow-lg"
      >
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={closeLabel}
          disabled={closeDisabled}
          onClick={onClose}
        >
          <LuX className="size-5" />
        </Button>
        <span className="flex-1 whitespace-nowrap text-sm font-medium">
          {label}
        </span>
        {allSelected ? null : (
          <Button variant="outline" className="shrink-0" onClick={onSelectAll}>
            {t('Select all')}
          </Button>
        )}
        {children}
      </section>
    </>
  );
}
