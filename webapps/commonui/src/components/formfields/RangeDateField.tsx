import { useField, useFormikContext } from 'formik';
import moment from 'moment';
import { useEffect } from 'react';
import { DateField, DEFAULT_MAX_DATE, DEFAULT_MIN_DATE } from './DateField';
import FormField from './FormField';

interface RangeDateFieldProps {
  beginName: string;
  endName: string;
  beginLabel: string;
  endLabel: string;
  min?: moment.Moment;
  max?: moment.Moment;
  duration?: number;
  disabled?: boolean;
  readOnly?: boolean;
}
export function RangeDateField({
  beginName,
  endName,
  beginLabel,
  endLabel,
  min,
  max,
  duration,
  disabled,
  readOnly
}: RangeDateFieldProps) {
  const { setFieldValue } = useFormikContext();
  const [beginField] = useField(beginName);
  const [endField] = useField(endName);

  useEffect(() => {
    if (duration && beginField.value?.isValid()) {
      let newEndDate = moment(beginField.value.startOf('day'))
        .add(duration)
        .subtract(1, 'seconds');
      if (max && newEndDate.isAfter(max)) {
        newEndDate = moment(max);
      }
      if (!newEndDate.isSame(endField.value)) {
        setFieldValue(endName, newEndDate, true);
      }
      return;
    }

    if (
      beginField.value?.isValid() &&
      endField.value?.isValid() &&
      endField.value.isBefore(beginField.value)
    ) {
      setFieldValue(endName, moment(beginField.value), true);
    }
  }, [beginField.value, endField.value, duration, endName, max, setFieldValue]);

  if (readOnly) {
    const beginValue = beginField.value?.format('L');
    const endValue = endField.value?.format('L');
    if (!beginValue && !endValue) {
      return null;
    }
    return (
      <FormField name={beginName} label={`${beginLabel} - ${endLabel}`}>
        <div className="py-2 text-sm font-medium">
          {beginValue} - {endValue}
        </div>
      </FormField>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-0 sm:flex sm:gap-2">
      <DateField
        label={beginLabel}
        name={beginName}
        min={min?.isValid() ? min : DEFAULT_MIN_DATE}
        max={max?.isValid() ? max : DEFAULT_MAX_DATE}
        disabled={disabled}
        className="w-full"
      />
      <DateField
        label={endLabel}
        name={endName}
        min={beginField.value || min || DEFAULT_MIN_DATE}
        max={max || DEFAULT_MAX_DATE}
        disabled={disabled}
        readOnly={!!duration}
        className="w-full"
      />
    </div>
  );
}
