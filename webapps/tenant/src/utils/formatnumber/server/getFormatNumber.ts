import {
  authOptions,
  getServerSession,
} from '@/mocks/session/server/getServerSession';
import { DEFAULT_CURRENCY, formatNumber } from '@/utils/formatnumber/common';
import getTranslation from '@/utils/i18n/server/getTranslation';

export async function getFormatNumber() {
  const { locale } = await getTranslation();
  const session = await getServerSession(authOptions);

  return ({
    value,
    minimumFractionDigits = 2,
    percent = false,
  }: {
    value: number;
    minimumFractionDigits?: number;
    percent?: boolean;
  }) => {
    return formatNumber(
      locale,
      session?.user?.currency || DEFAULT_CURRENCY,
      value,
      minimumFractionDigits,
      percent
    );
  };
}
