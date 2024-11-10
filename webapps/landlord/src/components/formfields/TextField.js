import { LuEye, LuEyeOff } from 'react-icons/lu';
import { useCallback, useState } from 'react';
import { useField, useFormikContext } from 'formik';
import { Button } from '../ui/button';
import { cn } from '../../utils';
import FormField from './FormField';
import { Input } from '../ui/input';

export function TextField({ disabled, showHidePassword = true, ...props }) {
  const [displayPassword, showPassword] = useState(false);
  const [field, meta] = useField(props);
  const { isSubmitting } = useFormikContext();
  const hasError = !!(meta.touched && meta.error);
  const isPasswordInput = props.type === 'password';

  const handleClickShowPassword = useCallback(() => {
    showPassword((displayPassword) => !displayPassword);
  }, [showPassword]);

  const handleMouseDownPassword = useCallback((event) => {
    event.preventDefault();
  }, []);

  return (
    <FormField {...props}>
      <div className="flex">
        <Input
          className={cn(
            'flex-grow [&:not(:last-child)]:mr-2',
            hasError
              ? 'border-destructive border-2 focus:ring-0 focus:ring-offset-0'
              : ''
          )}
          disabled={disabled || isSubmitting}
          {...props}
          {...field}
          type={
            props.type === 'password' && displayPassword ? 'text' : props.type
          }
        />
        {isPasswordInput ? (
          <Button
            variant="outline"
            size="icon"
            onClick={handleClickShowPassword}
          >
            {displayPassword ? <LuEye /> : <LuEyeOff />}
          </Button>
        ) : null}
      </div>
    </FormField>
  );
}
