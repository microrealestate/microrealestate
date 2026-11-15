import { Button } from '@microrealestate/commonui/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle
} from '@microrealestate/commonui/components/ui/drawer';
import { Separator } from '@microrealestate/commonui/components/ui/separator';
import { cn } from '@microrealestate/commonui/utils';
import { useTranslations } from 'next-intl';
import {
  type ElementType,
  type MouseEvent,
  type ReactNode,
  useRef,
  useState
} from 'react';
import { LuEllipsis, LuLayoutGrid, LuRotateCw } from 'react-icons/lu';

export type PageAction = {
  id: string;
  label: string;
  icon: ElementType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  hidden?: boolean;
  primary?: boolean;
  destructive?: boolean;
  dataCy?: string;
};

/**
 * Visible actions: `primary` first, then the rest in declared order, destructive last
 */
function orderActions(actions: PageAction[]) {
  const visible = actions.filter(({ hidden }) => !hidden);
  return [
    ...visible.filter(({ primary, destructive }) => primary && !destructive),
    ...visible.filter(({ primary, destructive }) => !primary && !destructive),
    ...visible.filter(({ destructive }) => destructive)
  ];
}

function runnable(action: PageAction) {
  return action.loading ? undefined : action.onClick;
}

function mobileDataCy(dataCy?: string) {
  return dataCy ? `${dataCy}-mobile` : undefined;
}

function ActionIcon({ action }: { action: PageAction }) {
  const Icon = action.loading ? LuRotateCw : action.icon;
  return <Icon className={cn(action.loading && 'animate-spin')} />;
}

function DesktopTile({ action }: { action: PageAction }) {
  return (
    <Button
      variant="ghost"
      onClick={runnable(action)}
      disabled={action.disabled}
      aria-busy={action.loading || undefined}
      data-cy={action.dataCy}
      className={cn(
        'flex h-auto min-h-20 w-full min-w-32 flex-col items-center justify-center gap-1.5 rounded-xl border bg-card shadow-sm [&_svg]:size-6',
        action.destructive && 'text-destructive'
      )}
    >
      <ActionIcon action={action} />
      <span className="whitespace-nowrap text-xs">{action.label}</span>
    </Button>
  );
}

function DesktopActions({ actions }: { actions: PageAction[] }) {
  return (
    <div className="grid w-full grid-flow-col auto-cols-fr gap-2">
      {actions.map((action) => (
        <DesktopTile key={action.id} action={action} />
      ))}
    </div>
  );
}

const MAX_DOCK_TABS = 2;

function MobileSingleAction({ action }: { action: PageAction }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t bg-card px-4 pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
      <Button
        className="h-13 w-full gap-2 rounded-[14px] px-4 text-base font-semibold [&_svg]:size-5.5"
        onClick={runnable(action)}
        disabled={action.disabled}
        aria-busy={action.loading || undefined}
        data-cy={mobileDataCy(action.dataCy)}
      >
        <ActionIcon action={action} />
        {action.label}
      </Button>
    </div>
  );
}

type MobileTabProps = {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
  dataCy?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
};

function MobileTab({
  label,
  icon,
  onClick,
  disabled,
  busy,
  className,
  dataCy,
  ariaLabel,
  ariaExpanded
}: MobileTabProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'h-auto min-h-16 min-w-0 flex-col gap-1 rounded-[14px] px-0.5 py-2 [&_svg]:size-6',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy || undefined}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      data-cy={dataCy}
    >
      {icon}
      <span className="w-full truncate text-center text-[11px] leading-tight">
        {label}
      </span>
    </Button>
  );
}

function DockTab({ action }: { action: PageAction }) {
  return (
    <MobileTab
      label={action.label}
      icon={<ActionIcon action={action} />}
      onClick={runnable(action)}
      disabled={action.disabled}
      busy={action.loading}
      className="font-medium"
      dataCy={mobileDataCy(action.dataCy)}
    />
  );
}

function sheetDataCy(dataCy?: string) {
  return dataCy ? `${dataCy}-sheet` : undefined;
}

function SheetRow({
  action,
  onClick
}: {
  action: PageAction;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <DrawerClose asChild>
      <Button
        variant="ghost"
        className={cn(
          'h-auto min-h-14 w-full justify-start gap-3 whitespace-normal rounded-[14px] px-2 py-2 text-left text-base font-medium [&_svg]:size-5',
          action.destructive && 'text-destructive hover:text-destructive'
        )}
        onClick={onClick}
        disabled={action.disabled}
        aria-busy={action.loading || undefined}
        data-cy={sheetDataCy(action.dataCy)}
      >
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted',
            action.destructive && 'bg-destructive/10'
          )}
        >
          <ActionIcon action={action} />
        </span>
        {action.label}
      </Button>
    </DrawerClose>
  );
}

function ActionSheet({
  actions,
  open,
  onOpenChange
}: {
  actions: PageAction[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('common');
  const pendingActionRef = useRef<PageAction | null>(null);
  const groups = [
    actions.filter(({ destructive }) => !destructive),
    actions.filter(({ destructive }) => destructive)
  ].filter((group) => group.length);

  const handleClick = (
    event: MouseEvent<HTMLButtonElement>,
    action: PageAction
  ) => {
    if (action.loading) {
      event.preventDefault();
      return;
    }
    pendingActionRef.current = action;
  };

  const handleAnimationEnd = (isOpen: boolean) => {
    if (!isOpen && pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      action.onClick();
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      onAnimationEnd={handleAnimationEnd}
    >
      <DrawerContent>
        <DrawerTitle className="sr-only">{t('Actions')}</DrawerTitle>
        <div className="flex max-h-[80dvh] flex-col gap-2 overflow-y-auto px-3 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {groups.map((group, index) => (
            <div key={group[0].id} className="flex flex-col gap-2">
              {index > 0 ? <Separator /> : null}
              <div className="flex flex-col gap-1">
                {group.map((action) => (
                  <SheetRow
                    key={action.id}
                    action={action}
                    onClick={(event) => handleClick(event, action)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function MobileDock({ actions }: { actions: PageAction[] }) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);

  const docked = actions
    .filter(({ destructive }) => !destructive)
    .slice(0, MAX_DOCK_TABS);
  const overflowing = actions.length > docked.length;
  const threeColumns = docked.length + (overflowing ? 1 : 0) === 3;

  return (
    <>
      <nav
        aria-label={t('Page actions')}
        className={cn(
          'fixed bottom-0 inset-x-0 z-50 grid border-t bg-card px-1.5 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]',
          threeColumns ? 'grid-cols-3' : 'grid-cols-2'
        )}
      >
        {docked.map((action) => (
          <DockTab key={action.id} action={action} />
        ))}
        {overflowing ? (
          <MobileTab
            label={t('More')}
            icon={<LuLayoutGrid />}
            onClick={() => setOpen(true)}
            className="font-semibold text-primary hover:text-primary"
            ariaLabel={t('More actions')}
            ariaExpanded={open}
            dataCy="moreActions-mobile"
          />
        ) : null}
      </nav>

      {overflowing ? (
        <ActionSheet actions={actions} open={open} onOpenChange={setOpen} />
      ) : null}
    </>
  );
}

function MobileMoreOnly({ actions }: { actions: PageAction[] }) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-50 border-t bg-card px-4 pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
        <Button
          variant="outline"
          className="h-13 w-full gap-2 rounded-[14px] px-4 text-base font-semibold [&_svg]:size-5.5"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          data-cy="moreActions-mobile"
        >
          <LuEllipsis />
          {t('More actions')}
        </Button>
      </div>
      <ActionSheet actions={actions} open={open} onOpenChange={setOpen} />
    </>
  );
}

function MobileActions({ actions }: { actions: PageAction[] }) {
  const regular = actions.filter(({ destructive }) => !destructive);

  if (!regular.length) {
    return actions.every(({ disabled }) => disabled) ? null : (
      <MobileMoreOnly actions={actions} />
    );
  }
  if (actions.length === 1) {
    return actions[0].disabled ? null : (
      <MobileSingleAction action={actions[0]} />
    );
  }
  return <MobileDock actions={actions} />;
}

export function PageActionBar({ actions = [] }: { actions?: PageAction[] }) {
  const ordered = orderActions(actions);
  if (!ordered.length) {
    return null;
  }

  return (
    <>
      <div className="hidden md:flex md:grow">
        <DesktopActions actions={ordered} />
      </div>
      <div className="md:hidden">
        <MobileActions actions={ordered} />
      </div>
    </>
  );
}
