import type { MetadataRoute } from 'next';
import { BRAND_BACKGROUND_COLOR, BRAND_COLOR } from '../styles/brand';

interface ManifestOptions {
  name: string;
  shortName: string;
  description: string;
  lang: string;
}

export function createManifest({
  name,
  shortName,
  description,
  lang
}: ManifestOptions): MetadataRoute.Manifest {
  return {
    id: './',
    name,
    short_name: shortName,
    description,
    lang,
    start_url: './',
    scope: './',
    display: 'standalone',
    theme_color: BRAND_COLOR,
    background_color: BRAND_BACKGROUND_COLOR,
    icons: [
      {
        src: 'icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: 'icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}
