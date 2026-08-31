import { useField, useFormikContext } from 'formik';
import { useCallback, useState } from 'react';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import { cn } from '../../utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import FormField from './FormField';

export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showHidePassword?: boolean;
  name: string;
  label: string;
  error?: boolean;
  description?: string;
}
export function TextField({
  disabled,
  readOnly,
  error,
  description,
  showHidePassword = true,
  ...props
}: TextFieldProps) {
  const [displayPassword, showPassword] = useState(false);
  const [field, _meta, helpers] = useField(props);
  const { isSubmitting } = useFormikContext();
  const isPasswordInput = props.type === 'password';

  const handleClickShowPassword = useCallback((event: React.MouseEvent) => {
    // this callback is also called when typing enter in the password field
    // this avoid to reveal the password when the user submits the form with enter
    if (event.clientX && event.clientY) {
      showPassword((displayPassword) => !displayPassword);
      event.preventDefault();
    }
  }, []);

  if (readOnly) {
    const value =
      isPasswordInput && !displayPassword ? '••••••••' : field.value;
    if (!value) {
      return null;
    }
    return (
      <FormField {...props}>
        <div className="py-2 text-sm font-medium">{value}</div>
      </FormField>
    );
  }

  return (
    <FormField {...props} description={description} error={error}>
      <div className="flex gap-2">
        <Input
          className={cn('grow', error && 'border-warning ring-1 ring-warning')}
          disabled={disabled}
          readOnly={isSubmitting}
          {...props}
          {...field}
          type={
            props.type === 'password' && displayPassword ? 'text' : props.type
          }
          onFocus={() => {
            helpers.setTouched(false, false);
          }}
        />
        {isPasswordInput && !disabled ? (
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
