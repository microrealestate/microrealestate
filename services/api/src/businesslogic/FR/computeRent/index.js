const fs = require('fs');
const path = require('path');

module.exports = function (contract, rentDate, previousRent, settlements) {
  const rent = {
    term: 0,
    month: 0,
    year: 0,
    preTaxAmounts: [
      // {
      //     description: '',
      //     amount: ''
      // }
    ],
    charges: [
      // {
      //     description: '',
      //     amount: ''
      // }
    ],
    discounts: [
      // {
      //     origin: '',  // 'contract', 'settlement'
      //     description: '',
      //     amount: ''
      // }
    ],
    debts: [
      // {
      //     description: '',
      //     amount: ''
      // }
    ],
    vats: [
      // {
      //     origin: '',  // 'contract', 'settlement'
      //     description: '',
      //     rate: 0,
      //     amount: 0
      // }
    ],
    payments: [
      // {
      //     date: '',
      //     amount: 0,
      //     type: '',
      //     reference: ''
      // }
    ],
    description: '',
    total: {
      balance: 0,
      preTaxAmount: 0,
      charges: 0,
      discount: 0,
      vat: 0,
      grandTotal: 0,
      payment: 0,
    },
  };
  const tasks_dir = path.join(__dirname, 'tasks');
  const taskFiles = fs.readdirSync(tasks_dir);
  return taskFiles.reduce((rent, taskFile) => {
    const task = require(path.join(tasks_dir, taskFile));
    return task(contract, rentDate, previousRent, settlements, rent);
  }, rent);
};
