import { useField, useFormikContext } from 'formik';

import { FormControl } from '@material-ui/core';
import { KeyboardDatePicker } from '@material-ui/pickers';
import moment from 'moment';
import { useCallback } from 'react';

export function DateField({ disabled, ...props }) {
  const [field, meta] = useField(props.name);
  const { isSubmitting, handleBlur, setFieldValue } = useFormikContext();
  const hasError = !!(meta.touched && meta.error);

  const handleChange = useCallback(
    (date) => {
      setFieldValue(field.name, date, true);
    },
    [field.name, setFieldValue]
  );

  return (
    <FormControl margin="normal" fullWidth>
      <KeyboardDatePicker
        name={field.name}
        value={field.value}
        format={moment.localeData().longDateFormat('L')}
        error={hasError}
        helperText={hasError ? meta.error : ''}
        onChange={handleChange}
        onBlur={handleBlur}
        autoOk
        disabled={disabled || isSubmitting}
        {...props}
      />
    </FormControl>
  );
}
