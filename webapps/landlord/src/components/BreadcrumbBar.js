import { Breadcrumbs, Typography } from '@material-ui/core';
import { memo, useCallback } from 'react';

import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import Hidden from './HiddenSSRCompatible';
import Link from './Link';
import { MobileButton } from './MobileMenuButton';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';

function BreadcrumbBar({ backPath, backPage, currentPage }) {
  const router = useRouter();
  const { t } = useTranslation('common');

  const handleClick = useCallback(() => {
    router.push(backPath);
  }, [router, backPath]);

  return (
    <>
      <Hidden smDown>
        <Breadcrumbs aria-label="breadcrumb" separator={<NavigateNextIcon />}>
          <Link underline="always" color="inherit" href={backPath}>
            <Typography variant="caption" noWrap>
              {backPage}
            </Typography>
          </Link>
          <Typography variant="body1" noWrap>
            {currentPage}
          </Typography>
        </Breadcrumbs>
      </Hidden>
      <Hidden mdUp>
        <MobileButton
          Icon={ArrowBackIcon}
          label={t('Back')}
          onClick={handleClick}
        />
      </Hidden>
    </>
  );
}

export default memo(BreadcrumbBar);
