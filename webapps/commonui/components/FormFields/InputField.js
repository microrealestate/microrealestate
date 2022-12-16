import {
  FormControl,
  FormHelperText,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
} from '@material-ui/core';
import { useCallback, useState } from 'react';
import { useField, useFormikContext } from 'formik';
import { Visibility, VisibilityOff } from '@material-ui/icons';

export function InputField({
  label,
  disabled,
  showHidePassword = true,
  ...props
}) {
  const [displayPassword, showPassword] = useState(false);
  const [field, meta] = useField(props);
  const { isSubmitting } = useFormikContext();
  const hasError = !!(meta.touched && meta.error);

  const handleClickShowPassword = useCallback(() => {
    showPassword((displayPassword) => !displayPassword);
  }, [showPassword]);

  const handleMouseDownPassword = useCallback((event) => {
    event.preventDefault();
  }, []);

  return (
    <FormControl margin="normal" fullWidth>
      {label ? (
        <InputLabel htmlFor={props.name} error={hasError} shrink>
          {label}
        </InputLabel>
      ) : null}

      <Input
        error={hasError}
        endAdornment={
          props.type === 'password' && showHidePassword ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
              >
                {displayPassword ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </InputAdornment>
          ) : null
        }
        disabled={disabled || isSubmitting}
        fullWidth
        {...props}
        {...field}
        type={
          props.type === 'password' && displayPassword ? 'text' : props.type
        }
      />
      {hasError && (
        <FormHelperText error={hasError}>{meta.error}</FormHelperText>
      )}
    </FormControl>
  );
}
