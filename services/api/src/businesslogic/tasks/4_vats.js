export default function taskVATs(
  contract,
  rentDate,
  previousRent,
  settlements,
  rent
) {
  if (contract.vatRate) {
    const rate = contract.vatRate || 0;

    rent.preTaxAmounts.forEach((preTaxAmount) => {
      rent.vats.push({
        origin: 'contract',
        description: `${preTaxAmount.description} T.V.A. (${rate * 100}%)`,
        amount: preTaxAmount.amount * rate,
        rate
      });
    });

    rent.charges.forEach((charges) => {
      rent.vats.push({
        origin: 'contract',
        description: `${charges.description} T.V.A. (${rate * 100}%)`,
        amount: charges.amount * rate,
        rate
      });
    });

    rent.debts.forEach((debt) => {
      rent.vats.push({
        origin: 'debts',
        description: `${debt.description} T.V.A. (${rate * 100}%)`,
        amount: debt.amount * rate,
        rate
      });
    });

    rent.discounts.forEach((discount) => {
      rent.vats.push({
        origin: discount.origin,
        description: `${discount.description} T.V.A. (${rate * 100}%)`,
        amount: discount.amount * rate * -1,
        rate
      });
    });
  }

  return rent;
}
