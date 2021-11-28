import { Box, IconButton, Link, Tooltip, Typography } from '@material-ui/core';
import { memo, useCallback } from 'react';

import { downloadDocument } from '../utils/fetch';
import VerticalAlignBottomIcon from '@material-ui/icons/VerticalAlignBottom';

const DownloadLink = ({
  label,
  tooltipText,
  url,
  withIcon = false,
  documentName,
  ...props
}) => {
  const onClick = useCallback(
    () => downloadDocument(url, documentName),
    [url, documentName]
  );

  return (
    <>
      {withIcon && tooltipText && (
        <Tooltip title={tooltipText} aria-label="download">
          <IconButton size="small" onClick={onClick} aria-label="download">
            <VerticalAlignBottomIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
      {!withIcon && label && (
        <Link component="button" variant={props.variant} onClick={onClick}>
          <Typography {...props}>{label}</Typography>
        </Link>
      )}
      {withIcon && !tooltipText && (
        <Box display="flex" alignItems="center">
          {label && <Typography {...props}>{label}</Typography>}
          <IconButton size="small" onClick={onClick} aria-label="download">
            <VerticalAlignBottomIcon fontSize="inherit" />
          </IconButton>
        </Box>
      )}
    </>
  );
};

export default memo(DownloadLink);
