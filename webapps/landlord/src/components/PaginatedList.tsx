import {
  PaginationContent,
  PaginationItem,
  PaginationLink,
  Pagination as PrimitivePagination
} from '@microrealestate/commonui/components/ui/pagination';
import { useSearchParams } from 'next/navigation';
import { type ReactNode, useCallback, useMemo } from 'react';
import useScroll from '@/hooks/useScroll';
import { usePathname, useRouter } from '@/i18n/navigation';

const DEFAULT_PAGE_SIZE = 21;

function computeChunks<T>(items: T[], pageSize: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += pageSize) {
    chunks.push(items.slice(index, index + pageSize));
  }
  return chunks.length > 0 ? chunks : [[]];
}

type PaginationProps = {
  pageIndex: number;
  pageCount: number;
  onChange: (pageIndex: number) => void;
};

function Pagination({ pageIndex, pageCount, onChange }: PaginationProps) {
  if (pageCount < 2) {
    return null;
  }
  return (
    <PrimitivePagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map(
            (page) => (
              <PaginationLink
                key={page}
                href="#"
                isActive={page === pageIndex}
                onClick={(event) => {
                  event.preventDefault();
                  onChange(page);
                }}
              >
                {page}
              </PaginationLink>
            )
          )}
        </PaginationItem>
      </PaginationContent>
    </PrimitivePagination>
  );
}

type PaginatedListProps<T> = {
  items: T[];
  pageSize?: number;
  children: (pageItems: T[]) => ReactNode;
};

export default function PaginatedList<T>({
  items,
  pageSize = DEFAULT_PAGE_SIZE,
  children
}: PaginatedListProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { scrollY } = useScroll();

  const chunks = useMemo(
    () => computeChunks(items, pageSize),
    [items, pageSize]
  );

  const requestedPage = Number(searchParams.get('page')) || 1;
  const pageIndex = Math.min(Math.max(requestedPage, 1), chunks.length);

  const handlePageChange = useCallback(
    (nextPageIndex: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextPageIndex > 1) {
        params.set('page', String(nextPageIndex));
      } else {
        params.delete('page');
      }
      const queryString = params.toString();
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
      scrollY(0);
    },
    [pathname, router, searchParams, scrollY]
  );

  return (
    <>
      {children(chunks[pageIndex - 1])}
      <Pagination
        pageIndex={pageIndex}
        pageCount={chunks.length}
        onChange={handlePageChange}
      />
    </>
  );
}
