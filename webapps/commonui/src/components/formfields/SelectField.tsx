import { useField, useFormikContext } from 'formik';
import { useMemo, useState } from 'react';
import { cn } from '../../utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import FormField from './FormField';

export function SelectField({
  values = [],
  disabled,
  readOnly,
  ...props
}: {
  values?: {
    id: string;
    value: string;
    label: string;
    renderIcon?: () => React.ReactNode;
    disabled?: boolean;
  }[];
  disabled?: boolean;
  readOnly?: boolean;
  name: string;
  label: string;
  onChange?: (event: { target: { value: string; name: string } }) => void;
}) {
  const [field] = useField(props);
  const { isSubmitting } = useFormikContext();

  // ----------------------------------------------------------
  // used to fix rerender issue when there are a lot of options
  const [_open, _setOpen] = useState(false);
  const selectedOption = useMemo(
    () => values.find((option) => option.value === field.value),
    [field.value, values]
  );
  // ----------------------------------------------------------

  const overridenField = useMemo(
    () => ({
      ...field,
      value: undefined,
      onChange: undefined,
      defaultValue: field.value,
      onValueChange: async (value: string) => {
        await props.onChange?.({ target: { value, name: field.name } });
        field.onChange({ target: { value, name: field.name } });
      }
    }),
    [field, props.onChange]
  );

  if (readOnly) {
    if (!selectedOption) {
      return null;
    }
    return (
      <FormField {...props}>
        <div className="py-2 text-sm font-medium">{selectedOption.label}</div>
      </FormField>
    );
  }

  return (
    <FormField {...props}>
      <Select
        disabled={disabled || isSubmitting}
        {...overridenField}
        onOpenChange={_setOpen}
      >
        <SelectTrigger className={cn('w-full')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {_open ? (
            values.map(
              ({ id, value, label, renderIcon, disabled: disabledMenu }) => (
                <SelectItem key={id} value={value} disabled={disabledMenu}>
                  <div
                    className="flex items-center gap-2"
                    data-cy={`${props.name}-${value}-option`}
                  >
                    {renderIcon ? renderIcon() : null}
                    <span>{label}</span>
                  </div>
                </SelectItem>
              )
            )
          ) : selectedOption ? (
            <SelectItem value={selectedOption.value}>
              <div className="flex items-center gap-2">
                {selectedOption.renderIcon ? selectedOption.renderIcon() : null}
                <span>{selectedOption.label}</span>
              </div>
            </SelectItem>
          ) : null}
        </SelectContent>
      </Select>
    </FormField>
  );
}
