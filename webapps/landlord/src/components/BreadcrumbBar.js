import { Breadcrumbs, Typography } from '@material-ui/core';

import Link from './Link';
import { memo } from 'react';

function BreadcrumbBar({ backPath, backPage, currentPage }) {
  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Link underline="always" color="inherit" href={backPath}>
        {backPage}
      </Link>
      <Typography variant="h6" noWrap>
        {currentPage}
      </Typography>
    </Breadcrumbs>
  );
}

export default memo(BreadcrumbBar);
