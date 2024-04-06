import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { cn } from '../utils';
import moment from 'moment';

export default function PeriodPicker({
  value,
  period = 'month',
  className,
  onChange
}) {
  const [month, setMonth] = useState(value || moment());
  const format = useMemo(() => {
    let format = 'MMM YY';
    switch (period) {
      case 'year':
        format = 'YYYY';
        break;
      case 'week':
        format = 'w, YYYY';
        break;
      case 'day':
        format = 'D MMMM YYYY';
        break;
    }
    return format;
  }, [period]);

  const handlePreviousClick = () => {
    const newMoment = month.clone().subtract(1, period);
    setMonth(newMoment);
    onChange?.(newMoment);
  };

  const handleNextClick = () => {
    const newMoment = month.clone().add(1, period);
    setMonth(newMoment);
    onChange?.(newMoment);
  };

  return (
    <div
      className={cn('flex items-center justify-between uppercase', className)}
    >
      <span>{month.format(format)}</span>
      <div className="flex gap-2">
        <Button variant="secondary" size="icon" onClick={handlePreviousClick}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={handleNextClick}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
