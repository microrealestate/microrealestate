import {
  Box,
  Card,
  CardActionArea,
  Divider,
  Typography,
  Toolbar as UIToolbar,
} from '@material-ui/core';
import { Children, memo, useMemo } from 'react';

import Hidden from './HiddenSSRCompatible';
import IconTypography from './IconTypography';

const _variantToBgColor = (variant) => {
  switch (variant) {
    case 'success':
      return 'success.main';
    case 'warning':
      return 'warning.main';
    case 'danger':
      return 'error.light';
    default:
      return 'info.light';
  }
};

export const CardRow = memo(function CardRow({ children, ...props }) {
  return (
    <Box
      display="flex"
      alignItems="center"
      {...props}
      color="text.secondary"
      fontSize="body1.fontSize"
    >
      {Children.toArray(children).map((child, index) => (
        <Box key={index} flexGrow={index === 0 ? 1 : 0}>
          {child}
        </Box>
      ))}
    </Box>
  );
});

export const PageCard = memo(function PageCard({
  variant,
  Icon,
  title,
  info,
  children,
}) {
  const bgColor = useMemo(() => _variantToBgColor(variant), [variant]);
  return (
    <Box
      position="relative"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      p={1}
      bgcolor={bgColor}
      color="primary.contrastText"
      width="100%"
      borderRadius="borderRadius"
    >
      <Box fontSize="caption.fontSize">{title}</Box>
      <Hidden smDown>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="h3.fontSize"
        >
          <Box display="flex" mr={1}>
            <Icon fontSize="inherit" />
          </Box>
          <Box py={1}>{children}</Box>
        </Box>
      </Hidden>
      <Hidden only={['xs', 'md', 'lg', 'xl']}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="h5.fontSize"
        >
          <Box display="flex" mr={1}>
            <Icon fontSize="inherit" />
          </Box>
          <Box py={1}>{children}</Box>
        </Box>
      </Hidden>
      <Hidden only={['sm', 'md', 'lg', 'xl']}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="subtitle1.fontSize"
        >
          <Box display="flex" mr={1}>
            <Icon fontSize="inherit" />
          </Box>
          <Box py={1}>{children}</Box>
        </Box>
      </Hidden>
      {!!info && <Box fontSize="caption.fontSize">{info}</Box>}
    </Box>
  );
});

const CardContent = ({ Toolbar, info, minHeight, children }) => (
  <Box pt={1.8}>
    {!!Toolbar && (
      <>
        <UIToolbar>
          <Box width="100%" display="flex" justifyContent="flex-end">
            {Toolbar}
          </Box>
        </UIToolbar>
        <Box pb={1}>
          <Divider variant="middle" />
        </Box>
      </>
    )}

    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      px={1.8}
      minHeight={minHeight}
    >
      {children}
    </Box>

    {info && (
      <>
        <Divider />
        <Box p={1}>
          <Typography component="div" color="textSecondary" variant="caption">
            {info}
          </Typography>
        </Box>
      </>
    )}
  </Box>
);

export const DashboardCard = memo(function DashboardCard({
  variant,
  Icon,
  title,
  info,
  Toolbar,
  minHeight = 'none',
  onClick,
  children,
}) {
  return (
    <Box position="relative">
      {onClick ? (
        <Card onClick={onClick}>
          <CardActionArea>
            <CardContent info={info} Toolbar={Toolbar}>
              {children}
            </CardContent>
          </CardActionArea>
        </Card>
      ) : (
        <Card>
          <CardContent info={info} Toolbar={Toolbar} minHeight={minHeight}>
            {children}
          </CardContent>
        </Card>
      )}
      <Box
        display="flex"
        alignItems="center"
        position="absolute"
        top={-12}
        left={10}
        right={10}
        p={0.5}
        borderRadius={3}
        color="primary.contrastText"
        bgcolor={_variantToBgColor(variant)}
      >
        <IconTypography Icon={Icon} noWrap>
          {title}
        </IconTypography>
      </Box>
    </Box>
  );
});

export const PageInfoCard = memo(function PageInfoCard({
  variant,
  Icon,
  title,
  info,
  Toolbar,
  onClick,
  children,
}) {
  return (
    <DashboardCard
      variant={variant}
      Icon={Icon}
      title={title}
      info={info}
      Toolbar={Toolbar}
      minHeight={200}
      onClick={onClick}
    >
      {children}
    </DashboardCard>
  );
});
