import { Box, Breadcrumbs, Typography, useMediaQuery } from '@material-ui/core';

import { memo, useCallback } from 'react';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import Link from './Link';
import { MobileButton } from './MobileMenuButton';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import { useRouter } from 'next/router';

function BreadcrumbBar({ backPath, backPage, currentPage }) {
  const router = useRouter();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const handleClick = useCallback(() => {
    router.push(backPath);
  }, [router, backPath]);

  return !isMobile ? (
    <Breadcrumbs aria-label="breadcrumb" separator={<NavigateNextIcon />}>
      <Link underline="always" color="inherit" href={backPath}>
        {backPage}
      </Link>
      <Typography variant="h6" noWrap>
        {currentPage}
      </Typography>
    </Breadcrumbs>
  ) : (
    <Box display="flex" alignItems="center" width="100%">
      <MobileButton
        // label={t('Back')}
        Icon={ArrowBackIcon}
        onClick={handleClick}
      />
    </Box>
  );
}

export default memo(BreadcrumbBar);
