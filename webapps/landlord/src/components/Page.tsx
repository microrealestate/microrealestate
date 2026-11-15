import { useTopBarTitleSlot } from '@microrealestate/commonui/components/shell/TopBarTitleSlot';
import { Button } from '@microrealestate/commonui/components/ui/button';
import { StickyHeader } from '@microrealestate/commonui/components/ui/StickyHeader';
import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LuArrowLeft } from 'react-icons/lu';
import Loading from './Loading';
import { type PageAction, PageActionBar } from './PageActions';

type PageProps = {
  children?: ReactNode;
  dataCy?: string;
  className?: string;
  loading?: boolean;
  title?: ReactNode;
  onBack?: () => void;
  actions?: PageAction[];
  headerLayout?: 'inline' | 'stacked';
  greeting?: string;
  description?: string;
  intro?: ReactNode;
  summary?: ReactNode;
  toolbar?: ReactNode;
};

export default function Page({
  children,
  dataCy,
  className,
  loading = false,
  title,
  onBack,
  actions,
  headerLayout = 'inline',
  greeting,
  description,
  intro,
  summary,
  toolbar
}: PageProps) {
  const t = useTranslations('common');
  const hasActions = !!actions?.some(({ hidden }) => !hidden);
  const stacked = headerLayout === 'stacked';
  const { slot, setHasPageTitle } = useTopBarTitleSlot();
  const hasTitle = !!title;

  useEffect(() => {
    setHasPageTitle(hasTitle);
    return () => setHasPageTitle(false);
  }, [hasTitle, setHasPageTitle]);

  return (
    <div
      data-cy={dataCy}
      className={cn(
        'px-4 pt-5 pb-2 mb-24 md:container md:mx-auto md:px-6 md:pt-8 md:mb-4',
        className
      )}
    >
      {onBack ? (
        <div className="mb-4 md:mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 -ml-2"
            aria-label={t('Back')}
            data-cy="backButton"
          >
            <LuArrowLeft className="size-4" />
            {t('Back')}
          </Button>
        </div>
      ) : null}

      {slot && title
        ? createPortal(
            typeof title === 'string' ? (
              <h1 className="font-semibold truncate">{title}</h1>
            ) : (
              title
            ),
            slot
          )
        : null}

      {greeting || description || hasActions ? (
        <div
          className={
            stacked
              ? 'flex flex-col items-start gap-6 mb-8 md:mb-10'
              : 'flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-6 md:mb-8'
          }
        >
          {greeting || description ? (
            <div
              className={cn(
                'flex min-w-0 flex-col',
                stacked ? 'gap-2' : 'grow-9999 basis-72 gap-1.5'
              )}
            >
              {greeting ? (
                <p className="text-xl font-semibold text-foreground">
                  {greeting}
                </p>
              ) : null}
              {description ? (
                <p className="text-base text-muted-foreground">{description}</p>
              ) : null}
            </div>
          ) : null}
          <PageActionBar actions={actions} />
        </div>
      ) : null}

      {intro ? <div className="contents *:mb-6">{intro}</div> : null}

      {summary && !loading ? <div className="mb-6">{summary}</div> : null}

      {toolbar ? <StickyHeader className="mb-6">{toolbar}</StickyHeader> : null}

      {loading ? <Loading /> : children}
    </div>
  );
}
