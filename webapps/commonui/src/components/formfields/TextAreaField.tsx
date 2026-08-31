import { useField, useFormikContext } from 'formik';
import { cn } from '../../utils';
import { Textarea } from '../ui/textarea';
import FormField from './FormField';

export function TextAreaField({
  disabled,
  readOnly,
  ...props
}: {
  disabled?: boolean;
  readOnly?: boolean;
  name: string;
  label: string;
}) {
  const [field, _meta, helpers] = useField(props);
  const { isSubmitting } = useFormikContext();

  if (readOnly) {
    if (!field.value) {
      return null;
    }
    return (
      <FormField {...props}>
        <div className="py-2 text-sm font-medium whitespace-pre-wrap">
          {field.value}
        </div>
      </FormField>
    );
  }

  return (
    <FormField {...props}>
      <Textarea
        className={cn('grow not-last:mr-2')}
        disabled={disabled}
        readOnly={readOnly || isSubmitting}
        {...props}
        {...field}
        onFocus={() => {
          helpers.setTouched(false, false);
        }}
      />
    </FormField>
  );
}
