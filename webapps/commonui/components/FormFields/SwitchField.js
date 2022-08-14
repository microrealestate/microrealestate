import { FormControlLabel, Switch } from '@material-ui/core';
import { useField, useFormikContext } from 'formik';

export function SwitchField({ label, disabled, ...props }) {
  const [field] = useField(props);
  const { isSubmitting } = useFormikContext();

  return (
    <FormControlLabel
      control={
        <Switch color="default" checked={field.value} {...props} {...field} />
      }
      label={label}
      disabled={disabled || isSubmitting}
    />
  );
}
