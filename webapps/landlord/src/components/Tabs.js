import { Box, Divider } from '@material-ui/core';
import { memo, useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/router';

export const useTabChangeHelper = (hashes) => {
  const router = useRouter();
  const [tabsReady, setTabsReady] = useState(false);
  const [tabSelectedIndex, setTabSelectedIndex] = useState(0);

  useEffect(() => {
    const hash = router.asPath.split('#')?.[1];
    if (hash && hashes.includes(hash)) {
      setTabSelectedIndex(hashes.indexOf(hash));
    } else {
      router.push(`#${hashes[0]}`, null, { shallow: true });
    }
    setTabsReady(true);
  }, [router, hashes]);

  const handleTabChange = useCallback(
    (event, newValue) => {
      router.push(`#${hashes[newValue]}`, null, { shallow: true });
      setTabSelectedIndex(newValue);
    },
    [router, hashes]
  );

  return { handleTabChange, tabSelectedIndex, tabsReady };
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
