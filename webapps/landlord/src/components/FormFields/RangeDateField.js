import { useField, useFormikContext } from 'formik';

import DateField from './DateField';
import { Grid } from '@material-ui/core';
import moment from 'moment';
import { useEffect } from 'react';

const defaultMinDate = moment('1900-01-01', 'YYYY-MM-DD');
const defaultMaxDate = moment('2100-01-01', 'YYYY-MM-DD');

export default function RangeDateField({
  beginName,
  endName,
  beginLabel,
  endLabel,
  minDate,
  maxDate,
  duration,
  disabled,
}) {
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
}
