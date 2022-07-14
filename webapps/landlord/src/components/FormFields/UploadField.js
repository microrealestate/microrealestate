import {
  Box,
  FormControl,
  FormHelperText,
  IconButton,
  Input,
  InputLabel,
  withStyles,
} from '@material-ui/core';
import { useField, useFormikContext } from 'formik';

import AttachFileIcon from '@material-ui/icons/AttachFile';
import { useCallback } from 'react';

const HiddenInput = withStyles({
  root: { display: 'none' },
})(Input);

export default function UploadField({
  label,
  description,
  disabled,
  ...props
}) {
  const { isSubmitting, setFieldValue } = useFormikContext();
  const [field, meta] = useField(props);
  const hasError = !!(meta.touched && meta.error);

  const handleChange = useCallback(
    (event) => {
      setFieldValue(field.name, event.target.files[0], true);
    },
    [field.name, setFieldValue]
  );

  return (
    <label htmlFor={props.name}>
      <Box display="flex">
        <FormControl margin="normal" fullWidth>
          <InputLabel htmlFor={props.name} error={hasError}>
            {label}
          </InputLabel>
          <Input
            error={hasError}
            value={field.value?.name ?? ''}
            fullWidth
            disabled={disabled || isSubmitting}
            readOnly
          />
          {hasError && (
            <FormHelperText error={hasError}>{meta.error}</FormHelperText>
          )}
        </FormControl>
        <Box pt={3}>
          <HiddenInput
            type="file"
            id={props.name}
            name={props.name}
            onChange={handleChange}
            disabled={disabled}
          />
          <IconButton component="span" disabled={disabled}>
            <AttachFileIcon />
          </IconButton>
        </Box>
      </Box>
    </label>
  );
}
