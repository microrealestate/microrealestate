import { Button } from '@microrealestate/commonui/components/ui/button';
import { cn } from '@microrealestate/commonui/utils';
import type { ElementType } from 'react';

interface ShortcutButtonProps {
  Icon?: ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  dataCy?: string;
}

export default function ShortcutButton({
  Icon,
  label,
  onClick,
  disabled,
  className,
  dataCy
}: ShortcutButtonProps) {
  const nbWords = label.split(' ').length;

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      data-cy={dataCy}
      className={cn(
        'flex flex-col h-full items-center justify-center min-h-16 md:min-h-24 border shadow-sm rounded-xl bg-card',
        className
      )}
    >
      {Icon ? <Icon className="size-5 md:size-6" /> : null}
      <span
        className={cn(
          'text-xs tracking-tighter whitespace-normal md:text-base md:tracking-normal',
          nbWords < 3 ? '[word-spacing:2000px] md:[word-spacing:normal]' : ''
        )}
      >
        {label}
      </span>
    </Button>
  );
}
