import {
  PaginationContent,
  PaginationItem,
  PaginationLink,
  Pagination as PrimitivePagination
} from '../ui/pagination';
import { useCallback, useState } from 'react';

export default function Pagination({ chunks, onChange }) {
  const [selectedPage, setSelectedPage] = useState(1);
  const handlePageChange = useCallback(
    (index) => {
      setSelectedPage(index + 1);
      onChange?.(index + 1);
    },
    [onChange]
  );

  return chunks.length > 1 ? (
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
  ) : null;
}
