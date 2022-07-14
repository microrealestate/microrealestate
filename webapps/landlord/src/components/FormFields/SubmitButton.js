import { Button, CircularProgress } from '@material-ui/core';

import { useFormikContext } from 'formik';

export default function SubmitButton({ label, disabled, ...props }) {
  const { isSubmitting } = useFormikContext();
  return (
    <Button
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
}
