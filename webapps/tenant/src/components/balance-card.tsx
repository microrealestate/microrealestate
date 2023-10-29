import { Card, CardContent } from '@/components/ui/card';
import { AmountValue } from '@/components/amount-value';
import getTranslation from '@/utils/i18n/server/getTranslation';

export async function BalanceCard() {
  const { t } = await getTranslation();

  return (
    <Card>
      <CardContent className="flex justify-between mt-6">
        <AmountValue label={t('Deposit')} amount={900} />
        <AmountValue variant="colored" label={t('Balance')} amount={4000} />
      </CardContent>
    </Card>
  );
}
