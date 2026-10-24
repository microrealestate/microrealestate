import { Button } from '@microrealestate/commonui/components/ui/button';
import { Separator } from '@microrealestate/commonui/components/ui/separator';
import { Toggle } from '@microrealestate/commonui/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@microrealestate/commonui/components/ui/tooltip';
import { cn } from '@microrealestate/commonui/utils';
import { type ComponentProps, forwardRef, type ReactNode } from 'react';

// The shortcut hint is written the way the running platform writes it. The
// editor only ever mounts through a `dynamic(..., { ssr: false })` import
// (`RichTextEditorDialog.js`), so reading `navigator` at module scope cannot
// desynchronise a server render from the client one.
const isApplePlatform =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

const KEY_LABELS: Record<string, string> = isApplePlatform
  ? { Mod: '⌘', Shift: '⇧', Alt: '⌥', Enter: '↩' }
  : { Mod: 'Ctrl', Shift: 'Shift', Alt: 'Alt', Enter: 'Enter' };

export function formatShortcut(shortcut: string): string {
  const keys = shortcut.split('-').map((key) => KEY_LABELS[key] ?? key);
  return keys.join(isApplePlatform ? '' : '+');
}

/**
 * Tooltip wrapper shared by every toolbar control. The name and the shortcut
 * are two sibling elements on purpose — a translated string is never
 * concatenated with anything (see the root AGENTS.md i18n rules).
 */
function ToolbarTip({
  label,
  shortcut,
  children
}: {
  label: string;
  shortcut?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        <span>{label}</span>
        {shortcut ? (
          <span className="text-xs text-muted-foreground">
            {formatShortcut(shortcut)}
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

type ToolbarControlProps = {
  label: string;
  shortcut?: string;
  children: ReactNode;
};

export const ToolbarButton = forwardRef<
  HTMLButtonElement,
  ToolbarControlProps & Omit<ComponentProps<typeof Button>, 'children'>
>(({ label, shortcut, children, className, ...props }, ref) => (
  <ToolbarTip label={label} shortcut={shortcut}>
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      aria-label={label}
      className={cn('h-9 w-9', className)}
      {...props}
    >
      {children}
    </Button>
  </ToolbarTip>
));
ToolbarButton.displayName = 'ToolbarButton';

export const ToolbarToggle = forwardRef<
  HTMLButtonElement,
  ToolbarControlProps & Omit<ComponentProps<typeof Toggle>, 'children'>
>(({ label, shortcut, children, className, ...props }, ref) => (
  <ToolbarTip label={label} shortcut={shortcut}>
    <Toggle
      ref={ref}
      aria-label={label}
      className={cn('h-9 w-9 p-0', className)}
      {...props}
    >
      {children}
    </Toggle>
  </ToolbarTip>
));
ToolbarToggle.displayName = 'ToolbarToggle';

export function ToolbarGroup({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn('flex items-center', className)}>{children}</div>;
}

/**
 * `h-6` is not decoration: a vertical Radix separator is `h-full`, and in a
 * flex row whose items only stretch to their own content that resolves to
 * zero — which is why the previous toolbar drew no separators at all.
 */
export function ToolbarSeparator() {
  return <Separator orientation="vertical" className="mx-1 h-6" />;
}

export function ToolbarMenuItem({
  label,
  shortcut,
  icon,
  active,
  disabled,
  onSelect
}: {
  label: string;
  shortcut?: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <Button
      variant="ghost"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'w-full justify-start gap-3 font-normal',
        active && 'bg-accent text-accent-foreground'
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {shortcut ? (
        <span className="text-xs text-muted-foreground">
          {formatShortcut(shortcut)}
        </span>
      ) : null}
    </Button>
  );
}
