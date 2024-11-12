import { Checkbox } from '../ui/checkbox';
import { cn } from '../../utils';
import { useField } from 'formik';

export function CheckboxField({ disabled, ...props }) {
  const [field, meta] = useField(props.name);
  const hasError = !!(meta.touched && meta.error);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <Checkbox
          name={props.name}
          checked={field.value}
          onCheckedChange={(value) =>
            field.onChange({ target: { value, name: field.name } })
          }
          disabled={disabled}
        />
        <label
          htmlFor={props.name}
          className={cn(
            'text-muted-foreground leading-none',
            hasError ? 'text-destructive' : ''
          )}
        >
          {props.label}
        </label>
      </div>
      {hasError && <div className="text-destructive text-xs">{meta.error}</div>}
    </div>
  );
}
