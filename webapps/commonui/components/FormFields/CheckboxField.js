import { Checkbox, FormControlLabel } from '@material-ui/core';
import { useField, useFormikContext } from 'formik';

export function CheckboxField({ label, disabled, ...props }) {
  const [field] = useField(props);
  const { isSubmitting } = useFormikContext();

  return (
    <FormControlLabel
      control={
        <Checkbox color="default" checked={field.value} {...props} {...field} />
      }
      label={label}
      disabled={disabled || isSubmitting}
    />
  );
}
