export default function taskPayments(
  contract,
  rentDate,
  previousRent,
  settlements,
  rent
) {
  if (settlements && settlements.payments) {
    settlements.payments.forEach((payment) => {
      rent.payments.push(payment);
    });
  }
  return rent;
}
