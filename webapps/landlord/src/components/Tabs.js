import { Box, Divider } from '@material-ui/core';
import { memo, useCallback, useState } from 'react';

export const useTabChangeHelper = () => {
  const [tabSelectedIndex, setTabSelectedIndex] = useState(0);

  const handleTabChange = useCallback((event, newValue) => {
    setTabSelectedIndex(newValue);
  }, []);

  return { handleTabChange, tabSelectedIndex };
};

export const TabPanel = memo(function TabPanel(props) {
  const { children, value, index } = props;

  return value === index ? (
    <>
      <Divider />
      <Box p={5}>{children}</Box>
    </>
  ) : null;
});
