import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useCallback, useState } from 'react';
import { useField, useFormikContext } from 'formik';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { cn } from '../../utils';
import FormField from './FormField';
import { LuCalendar } from 'react-icons/lu';
import moment from 'moment';

export function DateField({ disabled, ...props }) {
  const [field, meta] = useField(props.name);
  const { isSubmitting, setFieldValue } = useFormikContext();
  const hasError = !!(meta.touched && meta.error);
  const [open, setOpen] = useState(false);

  const handleChange = useCallback(
    (date) => {
      setFieldValue(field.name, moment(date), true);
      setOpen(false);
    },
    [field.name, setFieldValue]
  );

  return (
    <FormField {...props}>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'flex font-normal',
              !field.value && 'text-muted-foreground',
              hasError
                ? 'border-destructive border-2 rounded-sm focus:ring-0 focus:ring-offset-0'
                : ''
            )}
            disabled={disabled || isSubmitting}
          >
            <div className="flex-grow text-left">
              {field.value ? moment(field.value).format('L') : ''}
            </div>
            <LuCalendar className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            locale={{
              localize: {
                month: (monthIndex) => moment.months()[monthIndex],
                day: (dayIndex) => moment.weekdaysShort()[dayIndex]
              }
            }}
            selected={
              field.value
                ? moment(field.value).toDate()
                : props?.minDate?.toDate()
            }
            onSelect={handleChange}
            fromDate={props.minDate ? props.minDate.toDate() : null}
            toDate={props.maxDate ? props.maxDate.toDate() : null}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </FormField>
  );
}
