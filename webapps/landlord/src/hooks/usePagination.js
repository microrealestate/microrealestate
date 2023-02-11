import { useCallback, useMemo, useState } from 'react';

import { Box } from '@material-ui/core';
import { Pagination } from '@material-ui/lab';

export default function usePagination(pageSize, allData = [], setPageData) {
  const [selectedPage, setSelectedPage] = useState(1);
  const pageItems = useMemo(() => {
    const chunks = [];
    const chunkSize = pageSize;

    let index = 0;
    while (index < allData.length) {
      const endIndex = index + chunkSize;
      if (endIndex < allData.length) {
        chunks.push(allData.slice(index, endIndex));
        index += chunkSize;
      } else {
        chunks.push(allData.slice(index));
        index = allData.length;
      }
    }
    setPageData(chunks.length ? chunks[0] : []);
    setSelectedPage(1);
    return chunks;
  }, [allData, pageSize, setPageData]);

  const handleChange = useCallback(
    (event, value) => {
      setSelectedPage(value);
      setPageData(pageItems[value - 1]);
    },
    [pageItems, setPageData]
  );

  const CustomPagination = ({ onPageChange }) => {
    const handlePageChange = useCallback(
      (event, value) => {
        handleChange(event, value);
        onPageChange?.(value);
      },
      [onPageChange]
    );

    return pageItems.length > 1 ? (
      <Box my={1}>
        <Pagination
          count={pageItems.length}
          page={selectedPage}
          onChange={handlePageChange}
          shape="rounded"
        />
      </Box>
    ) : null;
  };

  return [CustomPagination];
}
