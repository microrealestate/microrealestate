import {
  Box,
  Container,
  IconButton,
  AppBar as MUIAppBar,
  Toolbar,
  Tooltip,
} from '@material-ui/core';
import { useCallback, useContext } from 'react';

import config from '../config';
import Hidden from './HiddenSSRCompatible';
import MobileMenu from './MobileMenu';
import OrganizationSwitcher from './organization/OrganizationSwitcher';
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';
import { StoreContext } from '../store';
import useTranslation from 'next-translate/useTranslation';

function EnvironmentBar() {
  const { t } = useTranslation('common');
  return config.DEMO_MODE || config.NODE_ENV === 'development' ? (
    <Box
      color="primary.contrastText"
      bgcolor={config.DEMO_MODE ? 'success.dark' : 'grey.700'}
      fontSize="caption.fontSize"
      textAlign="center"
      py={0.2}
    >
      {config.DEMO_MODE ? t('Demonstration mode') : t('Development mode')}
    </Box>
  ) : null;
}

function MainToolbar({ maxWidth, onSignOut }) {
  const { t } = useTranslation('common');
  const store = useContext(StoreContext);

  if (!store.user?.signedIn) {
    return null;
  }
  return (
    <>
      <Hidden smDown>
        <Box ml={7}>
          <Toolbar disableGutters>
            <Container maxWidth={maxWidth}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                width="100%"
              >
                <Box fontSize="h5.fontSize">{config.APP_NAME}</Box>
                <Box display="flex" alignItems="center">
                  <OrganizationSwitcher />
                  <Tooltip title={t('Sign out')} aria-label="sign out">
                    <IconButton
                      aria-label="sign out"
                      onClick={onSignOut}
                      color="default"
                      data-cy="signout"
                    >
                      <PowerSettingsNewIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Container>
          </Toolbar>
        </Box>
      </Hidden>
      <Hidden mdUp>
        <MobileMenu>
          <Toolbar disableGutters>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              width="100%"
            >
              <OrganizationSwitcher />
              <IconButton
                aria-label="sign out"
                onClick={onSignOut}
                color="inherit"
                data-cy="signout"
              >
                <PowerSettingsNewIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </MobileMenu>
      </Hidden>
    </>
  );
}

export default function AppBar() {
  const store = useContext(StoreContext);

  const handleSignOut = useCallback(
    async (event) => {
      event.preventDefault();
      await store.user.signOut();
      window.location.assign(config.BASE_PATH); // will be redirected to /signin
    },
    [store.user]
  );

  return (
    <>
      <Hidden smDown>
        <MUIAppBar elevation={3} position="sticky">
          <EnvironmentBar />
          <MainToolbar onSignOut={handleSignOut} />
        </MUIAppBar>
      </Hidden>
      <Hidden mdUp>
        <MUIAppBar elevation={0} position="fixed">
          <EnvironmentBar />
          <MainToolbar onSignOut={handleSignOut} />
        </MUIAppBar>
      </Hidden>
    </>
  );
}
