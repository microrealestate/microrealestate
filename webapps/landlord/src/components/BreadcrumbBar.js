import { Box, Breadcrumbs, Typography } from '@material-ui/core';
import { memo, useCallback } from 'react';

import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import Hidden from './HiddenSSRCompatible';
import Link from './Link';
import { MobileButton } from './MobileMenuButton';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import { useRouter } from 'next/router';

function BreadcrumbBar({ backPath, backPage, currentPage }) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    router.push(backPath);
  }, [router, backPath]);

  return (
    <>
      <Hidden smDown>
        <Breadcrumbs aria-label="breadcrumb" separator={<NavigateNextIcon />}>
          <Link underline="always" color="inherit" href={backPath}>
            {backPage}
          </Link>
          <Typography variant="h6" noWrap>
            {currentPage}
          </Typography>
        </Breadcrumbs>
      </Hidden>
      <Hidden mdUp>
        <Box display="flex" alignItems="center" width="100%">
          <MobileButton
            // label={t('Back')}
            Icon={ArrowBackIcon}
            onClick={handleClick}
          />
        </Box>
      </Hidden>
    </>
  );
}

export default memo(BreadcrumbBar);
