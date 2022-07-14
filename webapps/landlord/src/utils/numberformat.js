export const formatNumber = (
  locale = 'en',
  currency = 'EUR',
  value,
  minimumFractionDigits = 2
) => {
  return Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits,
  }).format(value);
};
