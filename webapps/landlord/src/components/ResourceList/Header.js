import { Card } from '../ui/card';
import SearchFilterBar from '../SearchFilterBar';

export default function Header({ filters, renderActions, onSearch }) {
  return (
    <Card className="flex items-center px-6 py-4">
      <SearchFilterBar
        filters={filters}
        onSearch={onSearch}
        className="flex-grow"
      />
      <div className="fixed bottom-0 left-0 bg-card p-4 w-full z-50 border-t md:relative md:bg-none md:p-0 md:w-auto md:z-auto md:border-none">
        {renderActions()}
      </div>
    </Card>
  );
}
