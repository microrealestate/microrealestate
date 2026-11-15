'use client';

import { useTheme } from 'next-themes';
import {
  LuCircleAlert,
  LuCircleCheck,
  LuInfo,
  LuTriangleAlert
} from 'react-icons/lu';
import {
  type ExternalToast,
  Toaster as Sonner,
  toast as sonnerToast
} from 'sonner';
import { useMediaQuery } from 'usehooks-ts';

type ToasterProps = React.ComponentProps<typeof Sonner> & {
  /** Accessible name of the close button, in the user's language */
  closeLabel?: string;
};

const ERROR_DURATION = 7000;
const DEFAULT_DURATION = 3000;

const iconClassName = 'size-5 shrink-0';

const Toaster = ({ closeLabel, ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();
  // Phones keep the bottom free for the page action dock and selection bar
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position={isDesktop ? 'bottom-right' : 'top-center'}
      duration={DEFAULT_DURATION}
      visibleToasts={3}
      gap={8}
      icons={{
        success: <LuCircleCheck className={iconClassName} />,
        error: <LuCircleAlert className={iconClassName} />,
        warning: <LuTriangleAlert className={iconClassName} />,
        info: <LuInfo className={iconClassName} />
      }}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: closeLabel,
        classNames: {
          toast:
            'relative flex w-full items-start gap-3 rounded-lg border border-l-4 bg-card p-4 text-sm text-card-foreground shadow-lg md:w-[356px] [&:has([data-close-button])]:pr-10',
          title: 'font-medium leading-5',
          description: 'text-muted-foreground',
          default: 'border-l-border',
          success: 'border-l-success [&_[data-icon]]:text-success',
          error: 'border-l-destructive [&_[data-icon]]:text-destructive',
          warning: 'border-l-warning [&_[data-icon]]:text-warning',
          info: 'border-l-primary [&_[data-icon]]:text-primary',
          closeButton:
            'absolute top-2 right-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          actionButton:
            'ml-auto shrink-0 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground',
          cancelButton:
            'shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground'
        }
      }}
      {...props}
    />
  );
};

/**
 * Sonner's `toast` with the app's error behaviour: errors stay longer, get a
 * close button, and the same message updates the toast already shown instead
 * of stacking a copy (screens that toast a failed query on every render).
 */
const toast = Object.assign(
  (...args: Parameters<typeof sonnerToast>) => sonnerToast(...args),
  sonnerToast,
  {
    error: (
      message: Parameters<typeof sonnerToast.error>[0],
      data?: ExternalToast
    ) =>
      sonnerToast.error(message, {
        duration: ERROR_DURATION,
        closeButton: true,
        ...(typeof message === 'string' && { id: `error:${message}` }),
        ...data
      })
  }
);

export { Toaster, toast };
