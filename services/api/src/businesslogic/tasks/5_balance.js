export default function taskBalance(
  contract,
  rentDate,
  previousRent,
  settlements,
  rent
) {
  rent.balance = 0;
  if (previousRent) {
    rent.total.balance =
      previousRent.total.grandTotal - previousRent.total.payment;
  }
  return rent;
}
