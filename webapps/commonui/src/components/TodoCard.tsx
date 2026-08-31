'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';
import { LuRotateCw } from 'react-icons/lu';
import { cn } from '../utils';
import MessageBubble from './MessageBubble';
import { Button } from './ui/button';

type Variant = 'default' | 'success' | 'warning' | 'destructive' | 'info';

function getVariantClasses(variant: Variant) {
  switch (variant) {
    case 'info':
      return {
        border: 'border-l-primary',
        iconBg: 'bg-primary/15 text-primary'
      };
    case 'success':
      return {
        border: 'border-l-success',
        iconBg: 'bg-success/15 text-success'
      };
    case 'warning':
      return {
        border: 'border-l-warning',
        iconBg: 'bg-warning/15 text-warning'
      };
    case 'destructive':
      return {
        border: 'border-l-destructive',
        iconBg: 'bg-destructive/15 text-destructive'
      };
    default:
      return {
        border: 'border-l-border',
        iconBg: 'bg-muted text-muted-foreground'
      };
  }
}

type BaseProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  descriptions?: string[];
  message?: string;
  messageLabel?: string;
  messageIcon?: ReactNode;
  variant?: Variant;
  className?: string;
  dataCy?: string;
  children?: ReactNode;
};

type MessageContactProps =
  | { messageContactHref: string; messageContactLabel: string }
  | { messageContactHref?: undefined; messageContactLabel?: undefined };

type ActionProps =
  | { buttonText?: undefined; navigateTo?: undefined; onClick?: undefined }
  | { buttonText: string; navigateTo: string; onClick?: undefined }
  | { buttonText: string; onClick: () => void; navigateTo?: undefined };

export default function TodoCard({
  icon,
  title,
  description,
  descriptions,
  message,
  messageLabel,
  messageIcon,
  messageContactHref,
  messageContactLabel,
  buttonText,
  variant = 'default',
  navigateTo,
  onClick,
  className,
  dataCy,
  children
}: BaseProps & MessageContactProps & ActionProps) {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [clicked, setClicked] = useState(false);

  const handleClick = async () => {
    if (!(navigateTo || onClick) || clicked) return;
    setClicked(true);
    if (onClick) {
      try {
        await onClick();
      } catch (error) {
        console.error(error);
      } finally {
        setClicked(false);
      }
      return;
    }
    // navigation unmounts the card, so leave clicked=true to keep it disabled
    const path = navigateTo.startsWith('/') ? navigateTo : `/${navigateTo}`;
    router.push(`/${locale}${path}`);
  };

  const { border, iconBg } = getVariantClasses(variant);
  const lines = descriptions?.length
    ? descriptions
    : description
      ? [description]
      : [];

  return (
    <div
      className={cn(
        'rounded-lg border border-l-4 bg-card shadow-sm p-4',
        border,
        className
      )}
      data-cy={dataCy}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-3 flex-1">
          {icon && (
            <div className={cn('rounded-full p-2 shrink-0 self-start', iconBg)}>
              {icon}
            </div>
          )}
          <div className="flex-1 space-y-6">
            <p className="font-medium text-sm pt-1.5">{title}</p>
            {lines.length > 1 ? (
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                {lines.map((d, i) => (
                  <li key={`${i}-${d}`}>{d}</li>
                ))}
              </ul>
            ) : lines.length === 1 ? (
              <p className="text-sm text-muted-foreground">{lines[0]}</p>
            ) : null}
            {message &&
              (messageContactHref && messageContactLabel ? (
                <MessageBubble
                  message={message}
                  label={messageLabel}
                  icon={messageIcon}
                  contactHref={messageContactHref}
                  contactLabel={messageContactLabel}
                />
              ) : (
                <MessageBubble
                  message={message}
                  label={messageLabel}
                  icon={messageIcon}
                />
              ))}
          </div>
        </div>

        {children ??
          (buttonText && (
            <Button
              size="sm"
              variant="default"
              onClick={handleClick}
              disabled={clicked}
              className="w-full sm:w-auto"
              data-cy={dataCy ? `${dataCy}-button` : undefined}
            >
              {clicked ? <LuRotateCw className="animate-spin size-4" /> : null}
              {clicked ? t('Processing...') : buttonText}
            </Button>
          ))}
      </div>
    </div>
  );
}
