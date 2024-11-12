import { useField, useFormikContext } from 'formik';
import { cn } from '../../utils';
import FormField from './FormField';
import { Textarea } from '../ui/textarea';

export function TextAreaField({ disabled, ...props }) {
  const [field, meta] = useField(props);
  const { isSubmitting } = useFormikContext();
  const hasError = !!(meta.touched && meta.error);

  return (
    <FormField {...props}>
      <Textarea
        className={cn(
          'flex-grow [&:not(:last-child)]:mr-2',
          hasError
            ? 'border-destructive border-2 focus:ring-0 focus:ring-offset-0'
            : ''
        )}
        disabled={disabled || isSubmitting}
        {...props}
        {...field}
      />
    </FormField>
  );
}
