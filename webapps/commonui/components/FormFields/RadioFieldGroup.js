import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  RadioGroup,
} from '@material-ui/core';

import { useField } from 'formik';

export function RadioFieldGroup({ children, label, ...props }) {
  const [field, meta] = useField(props);
  const hasError = !!(meta.touched && meta.error);

  return (
    <Box pt={2}>
      <FormControl component="fieldset" error={hasError}>
        <FormLabel component="legend">{label}</FormLabel>
        <RadioGroup {...props} {...field}>
          {children}
        </RadioGroup>
        {hasError && (
          <FormHelperText error={hasError}>{meta.error}</FormHelperText>
        )}
      </FormControl>
    </Box>
  );
}
