import { Button } from './ui/button';
import { cn } from '../utils';

export default function ShortcutButton({
  Icon,
  label,
  onClick,
  disabled,
  className,
  dataCy
}) {
  const nbWords = label.split(' ').length;

  return (
    <Button
      variant="secondary"
      onClick={onClick}
      disabled={disabled}
      data-cy={dataCy}
      className={cn(
        'flex flex-col items-center justify-start gap-1 h-full w-full text-xs font-light rounded-none bg-card',
        'md:flex-row md:justify-center md:gap-2 md:text-base md:font-semibold md:rounded md:bg-secondary',
        className
      )}
    >
      {Icon ? <Icon className="size-6" /> : null}
      <span
        className={cn(
          'tracking-tighter whitespace-normal md:text-sm md:tracking-normal',
          nbWords < 3 ? '[word-spacing:2000px] md:[word-spacing:normal]' : ''
        )}
      >
        {label}
      </span>
    </Button>
  );
}
