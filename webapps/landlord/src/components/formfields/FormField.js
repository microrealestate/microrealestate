import { cn } from '../../utils';
import { useField } from 'formik';

export default function FormField({ children, ...props }) {
  const [field, meta] = useField(props.name);
  const hasError = !!(meta.touched && meta.error);

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'text-muted-foreground mb-0.5',
          hasError ? 'text-destructive' : ''
        )}
      >
        {props.label}
      </div>
      {children}
      {hasError && (
        <span className="text-destructive text-xs mt-0.5">{meta.error}</span>
      )}
    </div>
  );
}
