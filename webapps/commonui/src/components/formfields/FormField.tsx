import '../../config/yupConfig';
import { cn } from '../../utils';
import useFormError from './useFormError';

export default function FormField({
  children,
  className,
  error,
  description,
  ...props
}: {
  children?: React.ReactNode;
  className?: string;
  name: string;
  label: string;
  error?: boolean;
  description?: string;
}) {
  const { errorMessage, hasError } = useFormError({ name: props.name });

  return (
    <div className={cn('relative pb-2', className)}>
      <label
        htmlFor={props.name}
        className={cn(error ? 'text-warning' : 'text-muted-foreground')}
      >
        {props.label}
      </label>
      {description ? (
        <p className="text-muted-foreground text-xs">{description}</p>
      ) : null}
      <div className="mt-1">{children}</div>
      {hasError && (
        <div className="absolute left-0.5 -bottom-3 text-destructive text-xs font-semibold">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
