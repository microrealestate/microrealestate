import { useField } from 'formik';
import { Children } from 'react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import FormField from './FormField';

interface RadioGroupFieldProps extends React.ComponentProps<typeof RadioGroup> {
  id: string;
  name: string;
  label: string;
  readOnly?: boolean;
}

export function RadioGroupField({
  label,
  children,
  readOnly,
  ...props
}: RadioGroupFieldProps) {
  const [field] = useField(props.name);

  if (readOnly) {
    const selectedItem = Children.toArray(children).find(
      (child) =>
        typeof child === 'object' &&
        child !== null &&
        'props' in child &&
        (child as { props: { value: string } }).props.value === field.value
    ) as { props: { label: string } } | undefined;
    if (!selectedItem) {
      return null;
    }
    return (
      <FormField name={props.name} label={label}>
        <div className="py-2 text-sm font-medium">
          {selectedItem.props.label}
        </div>
      </FormField>
    );
  }

  return (
    <FormField name={props.name} label={label}>
      <RadioGroup
        {...props}
        {...field}
        id={props.id || props.name}
        value={undefined}
        defaultValue={field.value}
        onValueChange={field.onChange}
        className="flex flex-col gap-4"
      >
        {children}
      </RadioGroup>
    </FormField>
  );
}

export function RadioItem(
  { name, value, label, ...props } = {
    name: '',
    value: '',
    label: ''
  }
) {
  return (
    <div className="flex items-center space-x-2">
      <RadioGroupItem id={name} value={value} {...props} />
      <label htmlFor={name}>{label}</label>
    </div>
  );
}
