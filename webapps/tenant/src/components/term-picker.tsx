import { DateRange } from 'react-day-picker';
import { DateRangePicker } from './daterange-picker';
import { LeaseTimeRange } from '@microrealestate/types';
import MonthYearPicker from './monthyear-picker';

export default function TermPicker({
  timeRange,
  fromDate,
  toDate,
  onValueChange,
}: {
  timeRange: LeaseTimeRange;
  fromDate: Date;
  toDate: Date;
  onValueChange?: (
    range: DateRange | { year: number; month?: number } | undefined
  ) => void;
}) {
  if (timeRange === 'years') {
    return (
      <MonthYearPicker
        variant="year"
        fromDate={fromDate}
        toDate={toDate}
        onValueChange={onValueChange}
      />
    );
  }

  if (timeRange === 'months') {
    return (
      <MonthYearPicker
        variant="monthyear"
        fromDate={fromDate}
        toDate={toDate}
        onValueChange={onValueChange}
      />
    );
  }

  return <DateRangePicker onValueChange={onValueChange} />;
}
