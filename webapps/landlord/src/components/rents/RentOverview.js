import MonthRevenuesCard from '../metrics/MonthRevenuesCard';
import RentCountCard from '../metrics/RentCountCard';

export function RentOverview({ data }) {
  const month = data.period.month() + 1;
  const year = data.period.year();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <RentCountCard month={month} year={year} className="hidden sm:block" />
      <MonthRevenuesCard
        variant="notPaid"
        month={month}
        year={year}
        className="hidden sm:block"
      />
      <MonthRevenuesCard
        variant="paid"
        month={month}
        year={year}
        className="hidden sm:block"
      />
    </div>
  );
}
