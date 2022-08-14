import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core';
import { useField, useFormikContext } from 'formik';

export function SelectField({ label, values = [], disabled, ...props }) {
  const [field, meta] = useField(props);
  const { isSubmitting } = useFormikContext();
  const hasError = !!(meta.touched && meta.error);

  return (
    <FormControl margin="normal" fullWidth>
      <InputLabel htmlFor={props.name} error={hasError}>
        {label}
      </InputLabel>
      <Select
        disabled={disabled || isSubmitting}
        error={hasError}
        {...field}
        {...props}
      >
        {values.map(({ id, value, label, disabled: disabledMenu }) => (
          <MenuItem key={id} value={value} disabled={disabledMenu}>
            {label}
          </MenuItem>
        ))}
      </Select>
      {hasError && (
        <FormHelperText error={hasError}>{meta.error}</FormHelperText>
      )}
    </FormControl>
  );
}
