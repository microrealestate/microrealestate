import moment from 'moment';

export default function taskBase(
  contract,
  rentDate,
  previousRent,
  settlements,
  rent
) {
  const currentMoment = moment(rentDate, 'DD/MM/YYYY HH:mm');
  rent.term = Number(currentMoment.format('YYYYMMDDHH'));
  if (contract.frequency === 'months') {
    rent.term = Number(
      moment(currentMoment).startOf('month').format('YYYYMMDDHH')
    );
  }
  if (contract.frequency === 'days') {
    rent.term = Number(
      moment(currentMoment).startOf('day').format('YYYYMMDDHH')
    );
  }
  if (contract.frequency === 'hours') {
    rent.term = Number(
      moment(currentMoment).startOf('hour').format('YYYYMMDDHH')
    );
  }
  rent.month = currentMoment.month() + 1; // 0 based
  rent.year = currentMoment.year();

  contract.properties
    .filter((property) => {
      const entryMoment = moment(property.entryDate).startOf('day');
      const exitMoment = moment(property.exitDate).endOf('day');

      return currentMoment.isBetween(
        entryMoment,
        exitMoment,
        contract.frequency,
        '[]'
      );
    })
    .forEach(function (property) {
      if (property.property) {
        const name = property.property.name || '';
        const preTaxAmount = property.rent || 0;
        const expenses = property.expenses || [];

        rent.preTaxAmounts.push({
          description: name,
          amount: preTaxAmount
        });

        if (expenses.length) {
          rent.charges.push(
            ...expenses.map(({ title, amount }) => ({
              description: title,
              amount
            }))
          );
        }
      }
    });
  if (settlements) {
    rent.description = settlements.description || '';
  }
  return rent;
}
