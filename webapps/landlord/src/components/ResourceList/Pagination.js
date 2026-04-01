import {
  PaginationContent,
  PaginationItem,
  PaginationLink,
  Pagination as PrimitivePagination
} from '../ui/pagination';
import { useCallback, useState } from 'react';

export default function Pagination({ 
  chunks, 
  onChange, 
  pageSize = 5,
  onPageSizeChange 
}) {
  const [selectedPage, setSelectedPage] = useState(1);
  
  const handlePageChange = useCallback(
    (index) => {
      setSelectedPage(index + 1);
      onChange?.(index + 1);
    },
    [onChange]
  );

  const handlePageSizeChange = useCallback(
    (e) => {
      const newSize = parseInt(e.target.value);
      onPageSizeChange?.(newSize);
    },
    [onPageSizeChange]
  );

  return (
    <div className="flex flex-col gap-4 items-center">
      {chunks.length > 1 && (
        <PrimitivePagination>
          <PaginationContent>
            <PaginationItem>
              {chunks.map((_, index) => (
                <PaginationLink
                  key={index}
                  href="#"
                  isActive={selectedPage === index + 1}
                  onClick={() => handlePageChange(index)}
                >
                  {index + 1}
                </PaginationLink>
              ))}
            </PaginationItem>
          </PaginationContent>
        </PrimitivePagination>
      )}
      
      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="pageSize" className="text-sm text-muted-foreground">
          Items per page:
        </label>
        <select
          id="pageSize"
          value={pageSize}
          onChange={handlePageSizeChange}
          className="px-2 py-1 border rounded bg-background text-sm"
        >
          <option value="3">3</option>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="15">15</option>
          <option value="20">20</option>
        </select>
      </div>
    </div>
  );
}
