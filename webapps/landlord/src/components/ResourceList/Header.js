import { StickyHeader } from '@microrealestate/commonui/components/ui/StickyHeader';
import { cn } from '@microrealestate/commonui/utils';
import { memo } from 'react';
import SearchFilterBar from '../SearchFilterBar';

function Header({ filters, renderActions, onSearch, className }) {
  return (
    <StickyHeader className={cn('p-4 space-y-4', className)}>
      <SearchFilterBar filters={filters} onSearch={onSearch} className="grow" />
      <div className="fixed bottom-0 left-0 bg-card p-4 w-full z-50 border-t md:flex md:justify-end md:relative md:bg-transparent md:p-0 md:z-auto md:border-none">
        <div className="md:w-fit">{renderActions()}</div>
      </div>
    </StickyHeader>
  );
}

export default memo(Header);
