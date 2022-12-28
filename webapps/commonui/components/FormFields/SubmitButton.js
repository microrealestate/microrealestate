import { Button, CircularProgress } from '@material-ui/core';

import { forwardRef } from 'react';
import { useFormikContext } from 'formik';

export const SubmitButton = forwardRef(function SubmitButton(
  { label, disabled, ...props },
  ref
) {
  const { isSubmitting } = useFormikContext();
  return (
    <Button
      ref={ref}
      type="submit"
      variant="contained"
      color="primary"
      disabled={isSubmitting || disabled}
      endIcon={
        isSubmitting ? <CircularProgress color="inherit" size={20} /> : null
      }
      data-cy="submit"
      {...props}
    >
      {label}
    </Button>
  );
});
