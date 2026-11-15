import { createManifest } from '@microrealestate/commonui/assets/manifest';
import type { NextRequest } from 'next/server';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get('locale');
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'common' });
  const appName = 'MicroRealEstate';

  return Response.json(
    createManifest({
      name: `${appName} Landlord`,
      shortName: appName,
      description: t(
        'Manage your rental properties, tenants, leases and rents.'
      ),
      lang: locale
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } }
  );
}
