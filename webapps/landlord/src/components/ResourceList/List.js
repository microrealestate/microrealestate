import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { useCallback, useMemo, useState } from 'react';
import Header from './Header';
import Pagination from './Pagination';
import { Separator } from '../ui/separator';

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
  renderList
}) {
  const pageSize = 21;
  const [pageIndex, setPageIndex] = useState(1);
  const [filteredData, setFilteredData] = useState([]);
  const chunks = useMemo(
    () => _computeChunks(pageSize, filteredData),
    [filteredData]
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

  return (
    <Card>
      <CardHeader>
        <Header
          filters={filters}
          renderActions={renderActions}
          onSearch={handleSearch}
        />
      </CardHeader>
      <Separator className="mb-6" />
      <CardContent>{renderList?.({ data: chunks[pageIndex - 1] })}</CardContent>
      <CardFooter className="pb-4">
        <Pagination
          chunks={chunks}
          data={filteredData}
          onChange={handlePageChange}
        />
      </CardFooter>
    </Card>
  );
}
