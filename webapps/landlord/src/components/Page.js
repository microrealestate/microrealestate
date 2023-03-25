import { Box, Container } from '@material-ui/core';

import Hidden from './HiddenSSRCompatible';
import { Loading } from '@microrealestate/commonui/components';

function PageContent({ maxWidth, children }) {
  return (
    <>
      <Hidden smDown>
        <Box ml={7}>
          <Container maxWidth={maxWidth}>
            <Box my={2}>{children}</Box>
          </Container>
        </Box>
      </Hidden>
      <Hidden mdUp>
        <Box mt={12} mb={10} mx={0.8}>
          {children}
        </Box>
      </Hidden>
    </>
  );
}

function Page({ children, ActionBar, maxWidth = 'lg', loading = false }) {
  return (
    <PageContent maxWidth={maxWidth}>
      <Box mb={2}>{ActionBar}</Box>
      {loading ? <Loading fullScreen /> : children}
    </PageContent>
  );
}

export default Page;
