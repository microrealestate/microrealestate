import getConfig from 'next/config';
import Head from 'next/head';

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
  return (
    <>
      <Head>
        <title>{APP_TITLE.join(' - ')}</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
