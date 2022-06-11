import {
  Box,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Typography,
  withStyles,
} from '@material-ui/core';
import React, { useCallback, useEffect, useState } from 'react';
import { RestrictButton, RestrictedComponent } from './RestrictedComponents';
import { useField, useFormikContext } from 'formik';

import AttachFileIcon from '@material-ui/icons/AttachFile';
import { KeyboardDatePicker } from '@material-ui/pickers';
import moment from 'moment';
import useTranslation from 'next-translate/useTranslation';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

const FormBaseField = RestrictedComponent(
  ({ label, disabled, showHidePassword = true, ...props }) => {
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
        <InputLabel htmlFor={props.name} error={hasError} shrink>
          {label}
        </InputLabel>
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
);

export const FormTextField = (props) => {
  return <FormBaseField {...props} />;
};

export const FormNumberField = (props) => {
  return <FormBaseField {...props} type="number" />;
};

export const SelectField = RestrictedComponent(
  ({ label, values = [], disabled, ...props }) => {
    const [field, meta] = useField(props);
    const { isSubmitting } = useFormikContext();
    const hasError = !!(meta.touched && meta.error);

    return (
      <FormControl margin="normal" fullWidth>
        <InputLabel htmlFor={props.name} error={hasError}>
          {label}
        </InputLabel>
        <Select
          disabled={disabled || isSubmitting}
          error={hasError}
          {...field}
          {...props}
        >
          {values.map(({ id, value, label, disabled: disabledMenu }) => (
            <MenuItem key={id} value={value} disabled={disabledMenu}>
              {label}
            </MenuItem>
          ))}
        </Select>
        {hasError && (
          <FormHelperText error={hasError}>{meta.error}</FormHelperText>
        )}
      </FormControl>
    );
  }
);

export const RadioFieldGroup = ({ children, label, ...props }) => {
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
};

export const RadioField = ({ onlyRoles, disabled, ...props }) => {
  const { isSubmitting } = useFormikContext();

  const RestrictedRadio = RestrictedComponent(Radio);
  return (
    <FormControlLabel
      control={
        <RestrictedRadio
          color="default"
          disabled={disabled || isSubmitting}
          onlyRoles={onlyRoles}
        />
      }
      {...props}
    />
  );
};

export const CheckboxField = RestrictedComponent(
  ({ label, disabled, ...props }) => {
    const [field] = useField(props);
    const { isSubmitting } = useFormikContext();

    return (
      <FormControlLabel
        control={
          <Checkbox
            color="default"
            checked={field.value}
            {...props}
            {...field}
          />
        }
        label={label}
        disabled={disabled || isSubmitting}
      />
    );
  }
);

export const SwitchField = RestrictedComponent(
  ({ label, disabled, ...props }) => {
    const [field] = useField(props);
    const { isSubmitting } = useFormikContext();

    return (
      <FormControlLabel
        control={
          <Switch color="default" checked={field.value} {...props} {...field} />
        }
        label={label}
        disabled={disabled || isSubmitting}
      />
    );
  }
);

export const DateField = RestrictedComponent(({ disabled, ...props }) => {
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
});

const defaultMinDate = moment('1900-01-01', 'YYYY-MM-DD');
const defaultMaxDate = moment('2100-01-01', 'YYYY-MM-DD');
export const DateRangeField = ({
  beginName,
  endName,
  beginLabel,
  endLabel,
  minDate,
  maxDate,
  duration,
  disabled,
}) => {
  const { setFieldValue } = useFormikContext();
  const [beginField] = useField(beginName);
  const [endField] = useField(endName);

  useEffect(() => {
    if (duration && beginField.value?.isValid()) {
      const newEndDate = moment(beginField.value.startOf('day'))
        .add(duration)
        .subtract(1, 'second');
      if (!newEndDate.isSame(endField.value)) {
        setFieldValue(endName, newEndDate, true);
      }
    }
  }, [duration, beginField.value, endField.value, endName, setFieldValue]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <DateField
          label={beginLabel}
          name={beginName}
          minDate={(
            (minDate?.isValid() && minDate) ||
            defaultMinDate
          ).toISOString()}
          maxDate={(
            (maxDate?.isValid() && maxDate) ||
            defaultMaxDate
          ).toISOString()}
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <DateField
          label={endLabel}
          name={endName}
          minDate={(
            beginField.value ||
            minDate ||
            defaultMinDate
          ).toISOString()}
          maxDate={(maxDate || defaultMaxDate).toISOString()}
          disabled={disabled || !!duration}
        />
      </Grid>
    </Grid>
  );
};

export const SubmitButton = ({ label, disabled, ...props }) => {
  const { isSubmitting } = useFormikContext();
  return (
    <RestrictButton
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
    </RestrictButton>
  );
};

export const CancelButton = ({ label, disabled, onClick, ...props }) => {
  const { isSubmitting, resetForm } = useFormikContext();

  const handleClick = useCallback(
    (e) => {
      resetForm();
      onClick && onClick(e);
    },
    [onClick, resetForm]
  );

  return !isSubmitting ? (
    <RestrictButton
      color="primary"
      disabled={disabled}
      {...props}
      onClick={handleClick}
    >
      {label}
    </RestrictButton>
  ) : null;
};

export const FormSection = ({
  label,
  description,
  visible = true,
  children,
}) => {
  return (
    <Box pb={4}>
      {visible ? (
        <>
          <Typography variant="h5">{label}</Typography>
          <Box pt={1} pb={2}>
            <Divider />
          </Box>
          {!!description && (
            <Typography variant="body1">{description}</Typography>
          )}
          {children}
        </>
      ) : (
        children
      )}
    </Box>
  );
};

export const ContactForm = ({
  contactName,
  emailName,
  phone1Name,
  phone2Name,
  onlyRoles,
  disabled,
}) => {
  const { t } = useTranslation('common');
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FormTextField
          label={t('Contact')}
          name={contactName || 'contact'}
          onlyRoles={onlyRoles}
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <FormTextField
          label={t('Email')}
          name={emailName || 'email'}
          onlyRoles={onlyRoles}
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <FormTextField
          label={t('Phone 1')}
          name={phone1Name || 'phone1'}
          onlyRoles={onlyRoles}
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <FormTextField
          label={t('Phone 2')}
          name={phone2Name || 'phone2'}
          onlyRoles={onlyRoles}
          disabled={disabled}
        />
      </Grid>
    </Grid>
  );
};

export const AddressField = ({ onlyRoles, disabled }) => {
  const { t } = useTranslation('common');
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FormTextField
          label={t('Street 1')}
          name="address.street1"
          onlyRoles={onlyRoles}
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12}>
        <FormTextField
          label={t('Street 2')}
          name="address.street2"
          onlyRoles={onlyRoles}
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormTextField
          label={t('Zip code')}
          name="address.zipCode"
          onlyRoles={onlyRoles}
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormTextField
          label={t('City')}
          name="address.city"
          onlyRoles={onlyRoles}
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormTextField
          label={t('State')}
          name="address.state"
          onlyRoles={onlyRoles}
          disabled={disabled}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormTextField
          label={t('Country')}
          name="address.country"
          onlyRoles={onlyRoles}
          disabled={disabled}
        />
      </Grid>
    </Grid>
  );
};

const HiddenInput = withStyles({
  root: { display: 'none' },
})(Input);

export const UploadField = RestrictedComponent(
  ({ label, description, disabled, ...props }) => {
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
);
