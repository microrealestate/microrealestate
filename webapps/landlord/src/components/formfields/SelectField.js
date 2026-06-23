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
import FormField from './FormField';

export function SelectField({ values = [], disabled, onChange, ...props }) {
  const [field, meta] = useField(props);
  const { isSubmitting } = useFormikContext();
  const hasError = !!(meta.touched && meta.error);

  const overridenField = {
    ...field,
    value: field.value || undefined,
    onValueChange: (value) => {
      field.onChange({ target: { value, name: field.name } });
      onChange?.({ target: { value, name: field.name } });
    }
  };

  return (
    <FormField {...props}>
      <Select
        disabled={disabled || isSubmitting}
        {...props}
        {...overridenField}
      >
        <SelectTrigger
          className={cn(
            hasError
              ? 'border-destructive border-2 focus:ring-0 focus:ring-offset-0'
              : ''
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {values
            .filter(({ value }) => value !== '' && value != null)
            .map(
              ({ id, value, label, renderIcon, disabled: disabledMenu }) => (
                <SelectItem key={id} value={value} disabled={disabledMenu}>
                  <div className="flex items-center gap-2">
                    {renderIcon ? renderIcon() : null}
                    <span>{label}</span>
                  </div>
                </SelectItem>
              )
            )}
        </SelectContent>
      </Select>
    </FormField>
  );
}
