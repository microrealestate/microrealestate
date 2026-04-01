import { useCallback, useMemo, useState } from 'react';
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

export default function List({
  data,
  filters,
  filterFn,
  renderActions,
  renderList,
  pageSize: pageSizeProp = 5,
  onPageSizeChange
}) {
  const [pageSize, setPageSize] = useState(pageSizeProp);
  const [pageIndex, setPageIndex] = useState(1);
  const [filteredData, setFilteredData] = useState([]);
  const chunks = useMemo(
    () => _computeChunks(pageSize, filteredData),
    [pageSize, filteredData]
  );

  const handleSearch = useCallback(
    (filters, text) => {
      const newFilters = {
        searchText: text,
        statuses: filters.filter(({ id }) => id).map(({ id }) => id)
      };
      setFilteredData(filterFn(data, newFilters));
    },
    [data, filterFn]
  );

  const handlePageChange = useCallback((pageIndex) => {
    setPageIndex(pageIndex);
  }, []);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    onPageSizeChange?.(newSize);
    setPageIndex(1); // Reset to first page when page size changes
  }, [onPageSizeChange]);

  return (
    <div className="flex flex-col gap-8">
      <Header
        filters={filters}
        renderActions={renderActions}
        onSearch={handleSearch}
      />

      {renderList?.({ data: chunks[pageIndex - 1] })}

      <Pagination
        chunks={chunks}
        data={filteredData}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        onChange={handlePageChange}
      />
    </div>
  );
}
