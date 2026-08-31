import { useFormikContext } from 'formik';
import { forwardRef } from 'react';
import { Button, type ButtonProps } from '../ui/button';

interface SubmitButtonProps extends ButtonProps {
  label: string;
}

function SubmitButtonWithRef(
  { label, disabled, ...props }: SubmitButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const { isSubmitting } = useFormikContext();
  return (
    <Button
      ref={ref}
      type="submit"
      disabled={isSubmitting || disabled}
      data-cy="submit"
      {...props}
    >
      {label}
    </Button>
  );
}

export const SubmitButton = forwardRef(SubmitButtonWithRef);
