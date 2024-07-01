export default function taskDebts(
  contract,
  rentDate,
  previousRent,
  settlements,
  rent
) {
  if (settlements && settlements.debts) {
    settlements.debts.forEach((debt) => {
      rent.debts.push({
        description: debt.description,
        amount: debt.amount
      });
    });
  }
  return rent;
}
