import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useScroll from '@/hooks/useScroll';
import { usePathname, useRouter } from '@/i18n/navigation';
import Header from './Header';
import Pagination from './Pagination';

function _computeChunks(chunkSize, data = []) {
  const chunks = [];
  let index = 0;
  while (index < data.length) {
    const endIndex = index + chunkSize;
    if (endIndex < data.length) {
      chunks.push(data.slice(index, endIndex));
      index += chunkSize;
    } else {
      chunks.push(data.slice(index));
      index = data.length;
    }
  }
  return chunks.length > 0 ? chunks : [[]];
}

const ITEMS_PER_PAGE = 21;

export default function List({
  title,
  data,
  filters,
  filterFn,
  renderActions,
  renderNotice,
  renderList
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { scrollY } = useScroll();

  const initialPageIndex = searchParams.get('page')
    ? Number(searchParams.get('page'))
    : 1;
  const prevPageIndex = useRef(initialPageIndex);
  const [pageIndex, setPageIndex] = useState(initialPageIndex);
  const [filteredData, setFilteredData] = useState([]);

  const chunks = useMemo(
    () => _computeChunks(ITEMS_PER_PAGE, filteredData),
    [filteredData]
  );

  useEffect(() => {
    if (prevPageIndex.current !== pageIndex) {
      prevPageIndex.current = pageIndex;
      scrollY(0);
    }
  }, [scrollY, pageIndex]);

  const lastFiltersRef = useRef({});
  const handleSearch = useCallback(
    (filters, text) => {
      const newFilters = {
        ...filters,
        searchText: text
      };
      lastFiltersRef.current = newFilters;
      setFilteredData(filterFn(data, newFilters));
    },
    [data, filterFn]
  );

  useEffect(() => {
    if (data) {
      setFilteredData(filterFn(data, lastFiltersRef.current));
    }
  }, [data, filterFn]);

  const handlePageChange = (pageIndex) => {
    setPageIndex(pageIndex);
    const params = new URLSearchParams(searchParams.toString());
    if (pageIndex > 1) {
      params.set('page', pageIndex);
    } else {
      params.delete('page');
    }
    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="flex flex-col">
      <Header
        filters={filters}
        renderActions={renderActions}
        onSearch={handleSearch}
        className="mb-8"
      />

      {renderNotice ? <div className="mb-4">{renderNotice()}</div> : null}

      {title ? (
        <h2 className="text-base md:text-lg font-semibold mb-4">{title}</h2>
      ) : null}
      {renderList?.({ data: chunks[pageIndex - 1] ?? [] })}

      <Pagination
        pageIndex={pageIndex}
        chunks={chunks}
        data={filteredData}
        onChange={handlePageChange}
        className="mt-4"
      />
    </div>
  );
}
