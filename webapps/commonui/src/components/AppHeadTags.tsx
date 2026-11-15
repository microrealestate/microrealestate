import { BRAND_COLOR } from '../styles/brand';

interface AppHeadTagsProps {
  basePath: string;
  appName: string;
  locale: string;
}

export default function AppHeadTags({
  basePath,
  appName,
  locale
}: AppHeadTagsProps) {
  return (
    <>
      <link
        rel="manifest"
        href={`${basePath}/manifest.webmanifest?locale=${encodeURIComponent(locale)}`}
      />
      <link rel="icon" href={`${basePath}/favicon.ico`} sizes="48x48" />
      <link rel="icon" href={`${basePath}/favicon.svg`} type="image/svg+xml" />
      <link rel="apple-touch-icon" href={`${basePath}/apple-touch-icon.png`} />
      <meta name="theme-color" content={BRAND_COLOR} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content={appName} />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    </>
  );
}
