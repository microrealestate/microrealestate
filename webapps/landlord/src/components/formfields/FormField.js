import { cn } from '../../utils';
import { useField } from 'formik';

export default function FormField({ children, ...props }) {
  const [field, meta] = useField(props.name);
  const hasError = !!(meta.touched && meta.error);

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={props.name}
        className={cn(
          'text-muted-foreground',
          hasError ? 'text-destructive' : ''
        )}
      >
        {props.label}
      </label>
      {children}
      {hasError && <div className="text-destructive text-xs">{meta.error}</div>}
    </div>
  );
}
