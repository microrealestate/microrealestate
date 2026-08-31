import { useField, useFormikContext } from 'formik';
import moment from 'moment';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { LuCalendar } from 'react-icons/lu';
import 'react-day-picker/style.css';
import { useLocaleContext } from '../../providers/AppProvider';
import { cn } from '../../utils';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import FormField from './FormField';

export const DEFAULT_MIN_DATE = moment('1900-01-01', 'YYYY-MM-DD');
export const DEFAULT_MAX_DATE = moment('2100-01-01', 'YYYY-MM-DD');

export function DateField({
  disabled,
  readOnly,
  ...props
}: {
  disabled?: boolean;
  readOnly?: boolean;
  name: string;
  label: string;
  defaultMonth?: moment.Moment;
  min?: moment.Moment;
  max?: moment.Moment;
  className?: string;
}) {
  const [field, _meta, helpers] = useField(props.name);
  const { isSubmitting, setFieldValue, setFieldError, setFieldTouched } =
    useFormikContext();
  const nextLocale = useLocale();
  const { dateFnsLocale } = useLocaleContext();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    field.value ? moment(field.value).format('L') : ''
  );
  const [previousInputLength, setPreviousInputLength] = useState(0);
  const selectedDate = field.value
    ? moment(field.value).toDate()
    : (props?.defaultMonth?.toDate() ?? props?.min?.toDate());

  // Update input value when field value changes
  useEffect(() => {
    if (field.value) {
      setInputValue(moment(field.value).format('L'));
    } else {
      setInputValue('');
    }
  }, [field.value]);

  const startMonth = (props.min ?? DEFAULT_MIN_DATE).toDate();
  const endMonth = (props.max ?? DEFAULT_MAX_DATE).toDate();
  const isOneMonth =
    props.min && props.max
      ? props.min.format('YYYYMM') === props.max.format('YYYYMM')
      : false;

  const isDateOutOfRange = (date: Date) => {
    if (props.min?.isAfter(date)) return true;
    if (props.max?.isBefore(date)) return true;
    return false;
  };

  const handleChange = (date: Date) => {
    const momentDate = moment(date);
    setFieldValue(field.name, momentDate, true);
    setInputValue(momentDate.format('L'));
  };

  const handleDayClick = () => {
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const isDeleting = value.length < previousInputLength;

    // Get the current locale format and determine separators
    const localeFormat = moment.localeData().longDateFormat('L');
    const separators = localeFormat.match(/[^\w]/g) || ['/'];
    const primarySeparator = separators[0];

    // Allow only numbers and the locale's separator
    const separatorRegex = new RegExp(
      `[^\\d${primarySeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`,
      'g'
    );
    const sanitizedValue = value.replace(separatorRegex, '');

    // Auto-format based on locale pattern (only when typing, not deleting)
    let formattedValue = sanitizedValue;
    if (!isDeleting) {
      const formatParts = localeFormat.split(primarySeparator);

      if (formatParts.length === 3) {
        // Add separator after first part (day or month depending on locale)
        if (
          sanitizedValue.length === formatParts[0].length &&
          !sanitizedValue.includes(primarySeparator)
        ) {
          formattedValue = `${sanitizedValue}${primarySeparator}`;
        }
        // Add separator after second part
        else if (
          sanitizedValue.length ===
            formatParts[0].length + formatParts[1].length + 1 &&
          sanitizedValue.split(primarySeparator).length === 2
        ) {
          formattedValue = `${sanitizedValue}${primarySeparator}`;
        }
      }
    }

    // Calculate max length (allow for 2-digit year format)
    // const twoDigitYearFormat = localeFormat.replace(/YYYY/g, 'YY');

    if (formattedValue.length <= localeFormat.length) {
      setInputValue(formattedValue);
      setPreviousInputLength(formattedValue.length);
      setFieldError(field.name, '');
    }
  };

  const handleInputBlur = () => {
    const localeFormat = moment.localeData().longDateFormat('L');
    const twoDigitYearFormat = localeFormat.replace(/YYYY/g, 'YY');
    const fourDigitYearDateLength = localeFormat.length;
    const twoDigitYearDateLength = twoDigitYearFormat.length;

    let momentDate = null;
    // Check if current input matches 2-digit year format
    if (inputValue.length === twoDigitYearDateLength) {
      momentDate = moment(inputValue, twoDigitYearFormat, false);
      if (!momentDate.isValid()) {
        momentDate = null;
      }
    }

    if (inputValue.length === fourDigitYearDateLength) {
      momentDate = moment(inputValue, localeFormat, true);
      if (!momentDate.isValid()) {
        momentDate = null;
      }
    }

    // Mark field as touched for error display
    if (momentDate) {
      if (props.min && momentDate.isBefore(props.min, 'day')) {
        setFieldError(field.name, [
          'Enter a date after {min}',
          { min: props.min.format('L') }
        ] as unknown as string);
      } else if (props.max && momentDate.isAfter(props.max, 'day')) {
        setFieldError(field.name, [
          'Enter a date before {max}',
          { max: props.max.format('L') }
        ] as unknown as string);
      } else {
        setFieldValue(field.name, momentDate, true);
      }
    } else {
      setFieldError(field.name, 'Invalid date format');
    }
    setFieldTouched(field.name, true, false);
  };

  return (
    <FormField {...props}>
      {readOnly || disabled || isSubmitting ? (
        <Input
          className={cn('grow')}
          name={field.name}
          type="text"
          value={inputValue}
          disabled={disabled}
          readOnly={readOnly || isSubmitting}
        />
      ) : (
        <Popover open={open} onOpenChange={setOpen} modal>
          <div className="relative flex items-center gap-2">
            <Input
              className={cn('grow')}
              name={field.name}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onFocus={() => {
                helpers.setTouched(false, false);
              }}
            />
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="absolute p-0 m-0 size-fit right-4"
              >
                <LuCalendar className="size-4" />
              </Button>
            </PopoverTrigger>
          </div>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              defaultMonth={selectedDate}
              selected={selectedDate}
              onSelect={handleChange}
              onDayClick={handleDayClick}
              startMonth={startMonth}
              endMonth={endMonth}
              captionLayout={isOneMonth ? 'label' : 'dropdown'}
              hideNavigation={isOneMonth}
              modifiers={{ today: [] }}
              classNames={{ today: '' }}
              locale={dateFnsLocale}
              formatters={{
                formatMonthDropdown: (month) =>
                  month.toLocaleString(nextLocale, { month: 'short' })
              }}
              disabled={isDateOutOfRange}
              autoFocus
              required
            />
          </PopoverContent>
        </Popover>
      )}
    </FormField>
  );
}
