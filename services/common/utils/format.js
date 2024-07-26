function formatNumber(
  locale,
  value,
  style = 'decimal',
  minimumFractionDigits = 2
) {
  if (['decimal'].includes(style)) {
    return Intl.NumberFormat(locale, {
      style,
      minimumFractionDigits,
    }).format(value);
  }

  if (style === 'percent') {
    return Number(value).toLocaleString(locale, {
      style: 'percent',
      minimumFractionDigits,
    });
  }

  return value;
}

function formatCurrency(locale, currency, value, minimumFractionDigits = 2) {
  return Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
  }).format(value);
}

module.exports = {
  formatNumber,
  formatCurrency,
};
