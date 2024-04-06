import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { useField, useFormikContext } from 'formik';
import { cn } from '../../utils';
import { FormControl } from '@material-ui/core';

export function SelectField({ label, values = [], disabled, ...props }) {
  const [field, meta] = useField(props);
  const { isSubmitting } = useFormikContext();
  const hasError = !!(meta.touched && meta.error);

  const overridenField = {
    ...field,
    onValueChange: (value) => {
      field.onChange({ target: { value, name: field.name } });
    }
  };

  return (
    <FormControl margin="normal" fullWidth>
      <span
        className={cn(
          'text-muted-foreground mb-0.5',
          hasError ? 'text-destructive' : ''
        )}
      >
        {label}
      </span>
      <Select
        disabled={disabled || isSubmitting}
        {...overridenField}
        {...props}
      >
        <SelectTrigger
          className={cn(
            'rounded-sm',
            hasError
              ? 'border-destructive border-2 focus:ring-0 focus:ring-offset-0'
              : ''
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {values.map(
              ({ id, value, label, renderIcon, disabled: disabledMenu }) => (
                <SelectItem key={id} value={value} disabled={disabledMenu}>
                  <div className="flex items-center gap-2">
                    {renderIcon ? renderIcon() : null}
                    <span>{label}</span>
                  </div>
                </SelectItem>
              )
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
      {hasError && (
        <span className="text-destructive text-xs mt-0.5">{meta.error}</span>
      )}
    </FormControl>
  );
}
