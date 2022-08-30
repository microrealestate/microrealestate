import 'moment/locale/fr';
import 'moment/locale/pt';
import 'moment/locale/de';

import CssBaseline from '@material-ui/core/CssBaseline';
import getConfig from 'next/config';
import Head from 'next/head';
import theme from '../styles/theme';
import { ThemeProvider } from '@material-ui/core/styles';
import { useEffect } from 'react';

const {
  publicRuntimeConfig: { APP_NAME, DEMO_MODE },
} = getConfig();

const APP_TITLE = [APP_NAME, 'Tenant'];
if (process.env.NODE_ENV === 'development') {
  APP_TITLE.push('DEV');
} else if (DEMO_MODE) {
  APP_TITLE.push('DEMO');
}

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <>
      <Head>
        <title>{APP_TITLE.join(' - ')}</title>
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}

export default MyApp;
