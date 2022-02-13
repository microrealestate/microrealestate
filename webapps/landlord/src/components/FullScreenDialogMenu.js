import {
  AppBar,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Divider,
  Hidden,
  Toolbar,
  useTheme,
} from '@material-ui/core';
import { forwardRef, Fragment, useCallback, useMemo, useState } from 'react';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { hexToRgb } from '../styles/styles';
import Loading from './Loading';
import Slide from '@material-ui/core/Slide';
import Typography from '@material-ui/core/Typography';
import { useComponentMountedRef } from '../utils/hooks';
import useTranslation from 'next-translate/useTranslation';

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CardMenuItemContent = ({ illustration, label, description }) => {
  return (
    <Card>
      <CardActionArea>
        <CardContent>
          {illustration}
          <Box py={2}>
            <Typography align="center" variant="subtitle1">
              {label}
            </Typography>
          </Box>
          {!!description && (
            <Box height={50}>
              <Typography variant="body2" color="textSecondary">
                {description}
              </Typography>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const CardMenuItem = ({ value, illustration, label, description, onClick }) => {
  const onMenuClick = useCallback(() => {
    onClick(value);
  }, [value, onClick]);

  return (
    <>
      <Hidden smDown>
        <Box width={300} pr={2} pb={2} onClick={onMenuClick}>
          <CardMenuItemContent
            illustration={illustration}
            label={label}
            description={description}
          />
        </Box>
      </Hidden>
      <Hidden mdUp>
        <Box width="100%" pb={2} onClick={onMenuClick}>
          <CardMenuItemContent
            illustration={illustration}
            label={label}
            description={description}
          />
        </Box>
      </Hidden>
    </>
  );
};

const FullScreenDialogMenu = ({
  buttonLabel,
  dialogTitle,
  menuItems,
  onClick,
  ...props
}) => {
  const mountedRef = useComponentMountedRef();
  const [open, setOpen] = useState(false);
  const [runningAction, setRunningAction] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation('common');

  const handleClickOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleMenuClick = useCallback(
    async (value) => {
      setRunningAction(true);
      await onClick(value);
      if (mountedRef.current) {
        setOpen(false);
        setRunningAction(false);
      }
    },
    [onClick, mountedRef]
  );

  const categories = useMemo(() => {
    return Array.from(
      menuItems.reduce((acc, { category }) => {
        acc.add(category);
        return acc;
      }, new Set())
    );
  }, [menuItems]);

  return (
    <>
      <Button
        {...props}
        onClick={handleClickOpen}
        style={{ whiteSpace: 'nowrap' }}
      >
        {buttonLabel}
      </Button>
      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
      >
        <AppBar position="sticky">
          <Toolbar>
            <Box width="100%" display="flex" alignItems="center">
              <Box flexGrow={1}>
                <Typography>{dialogTitle}</Typography>
              </Box>
              <Box ml={4}>
                <Button color="inherit" onClick={handleClose}>
                  {t('Close')}
                </Button>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>
        <Box position="relative">
          <Box py={2} px={5}>
            {categories.map((category, index) => {
              return (
                <Fragment key={category}>
                  {!!category && (
                    <Box pt={index === 0 ? 0 : 3} pb={3}>
                      <Typography variant="subtitle1" gutterBottom>
                        {category}
                      </Typography>
                      <Divider />
                    </Box>
                  )}
                  <Box display="flex" flexWrap="wrap">
                    {menuItems
                      .filter((item) => item.category === category)
                      .map((menuItem, index) => {
                        const {
                          label,
                          description,
                          illustration,
                          badgeContent,
                          badgeColor,
                          value,
                        } = menuItem;

                        return (
                          <CardMenuItem
                            key={`${category}_${index}`}
                            value={value}
                            label={label}
                            description={description}
                            illustration={illustration}
                            badgeContent={badgeContent}
                            badgeColor={badgeColor}
                            onClick={handleMenuClick}
                          />
                        );
                      })}
                  </Box>
                </Fragment>
              );
            })}
          </Box>
          {runningAction && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                height: '100%',
                width: '100%',
                backgroundColor: `rgba(${hexToRgb(
                  theme.palette.background.paper
                )}, 0.5)`,
              }}
            >
              <Loading />
            </Box>
          )}
        </Box>
      </Dialog>
    </>
  );
};

export default FullScreenDialogMenu;
