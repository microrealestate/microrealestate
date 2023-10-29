import { DEFAULT_CURRENCY, formatNumber } from '@/utils/formatnumber/common';
import useSession from '@/mocks/session/client/useSession';
import useTranslation from '@/utils/i18n/client/useTranslation';

export function useFormatNumber() {
  const { locale } = useTranslation();
  const { data: session } = useSession();

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
