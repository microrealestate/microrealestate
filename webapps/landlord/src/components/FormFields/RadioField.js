import { FormControlLabel, Radio } from '@material-ui/core';

import { useFormikContext } from 'formik';

export default function RadioField({ disabled, ...props }) {
  const { isSubmitting } = useFormikContext();

  return (
    <FormControlLabel
      control={<Radio color="default" disabled={disabled || isSubmitting} />}
      {...props}
    />
  );
}
