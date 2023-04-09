import 'moment/locale/fr';
import 'moment/locale/pt';
import 'moment/locale/de';

import config from '../config';
import CssBaseline from '@material-ui/core/CssBaseline';
import Head from 'next/head';
import { Roboto } from 'next/font/google';
import theme from '../styles/theme';
import { ThemeProvider } from '@material-ui/core/styles';
import { useEffect } from 'react';

const APP_TITLE = [config.NEXT_PUBLIC_APP_NAME, 'Tenant'];
if (config.NODE_ENV === 'development') {
  APP_TITLE.push('DEV');
} else if (config.NEXT_PUBLIC_DEMO_MODE) {
  APP_TITLE.push('DEMO');
}

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  subsets: ['latin', 'latin-ext'],
});

export default function MyApp({ Component, pageProps }) {
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
        {/* PWA primary color */}
        <meta name="theme-color" content={theme.palette.primary.main} />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
        <link
          rel="shortcut icon"
          href={`${config.NEXT_PUBLIC_BASE_PATH}/favicon.svg`}
        />
      </Head>
      <main className={roboto.className}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Component {...pageProps} />
        </ThemeProvider>
      </main>
    </>
  );
}
