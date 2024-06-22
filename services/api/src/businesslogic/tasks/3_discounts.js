export default function taskDiscounts(
  contract,
  rentDate,
  previousRent,
  settlements,
  rent
) {
  if (contract.discount) {
    rent.discounts.push({
      origin: 'contract',
      description: 'Remise exceptionnelle',
      amount: contract.discount
    });
  }

  if (settlements && settlements.discounts) {
    settlements.discounts.forEach((discount) => {
      rent.discounts.push({
        origin: 'settlement',
        description: discount.description,
        amount: discount.amount
      });
    });
  }
  return rent;
}
