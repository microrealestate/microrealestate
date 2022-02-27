import {
  Box,
  Breadcrumbs,
  Button,
  Typography,
  useMediaQuery,
} from '@material-ui/core';

import { memo, useCallback } from 'react';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import Link from './Link';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

function BreadcrumbBar({ backPath, backPage, currentPage }) {
  const { t } = useTranslation('common');
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
      <Button
        startIcon={<ArrowBackIosIcon />}
        variant="contained"
        size="small"
        onClick={handleClick}
      >
        {t('Back')}
      </Button>
      <Box flexGrow={1}>
        <Typography variant="h6" align="center" noWrap>
          {currentPage}
        </Typography>
      </Box>
    </Box>
  );
}

export default memo(BreadcrumbBar);
