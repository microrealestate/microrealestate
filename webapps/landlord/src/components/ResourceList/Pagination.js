import {
  PaginationContent,
  PaginationItem,
  PaginationLink,
  Pagination as PrimitivePagination
} from '@microrealestate/commonui/components/ui/pagination';
import { useState } from 'react';

export default function Pagination({ pageIndex, chunks, onChange, className }) {
  const [selectedPage, setSelectedPage] = useState(pageIndex || 1);
  const handlePageChange = (index) => {
    setSelectedPage(index + 1);
    onChange?.(index + 1);
  };

  return chunks.length > 1 ? (
    <PrimitivePagination className={className}>
      <PaginationContent>
        <PaginationItem>
          {chunks.map((_, index) => (
            <PaginationLink
              // biome-ignore lint/suspicious/noArrayIndexKey: no sorting
              key={index}
              href="#"
              isActive={selectedPage === index + 1}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(index);
              }}
            >
              {index + 1}
            </PaginationLink>
          ))}
        </PaginationItem>
      </PaginationContent>
    </PrimitivePagination>
  ) : null;
}
