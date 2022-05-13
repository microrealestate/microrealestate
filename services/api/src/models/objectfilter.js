const sugar = require('sugar');
const moment = require('moment');
const logger = require('winston');
sugar.extend();

module.exports = class ObjectFilter {
  constructor(schema) {
    this.schema = schema;
  }

  filter(data) {
    return Object.keys(this.schema).reduce((filteredData, key) => {
      const type = this.schema[key];
      const value = data[key];

      if (typeof value != 'undefined') {
        if (type === Date) {
          filteredData[key] = null;
          if (typeof value == 'string') {
            const m = moment(value, 'DD/MM/YYYY');
            if (m.isValid()) {
              filteredData[key] = m.toDate();
            }
          } else if (value instanceof Date) {
            filteredData[key] = value;
          }
        } else if (type === Boolean) {
          if (
            typeof value == 'string' &&
            (value === 'true' || value === 'false')
          ) {
            filteredData[key] = value === 'true';
          } else if (typeof value == 'boolean') {
            filteredData[key] = value;
          }
        } else if (type === Number) {
          let number = value;
          if (typeof value == 'string') {
            number = Number(value.replace(',', '.'));
          }
          if (!isNaN(number)) {
            filteredData[key] = number;
          } else {
            filteredData[key] = 0;
          }
        } else if (type === Array) {
          if (Array.isArray(value)) {
            filteredData[key] = value;
          }
        } else if (type === Object) {
          if (typeof value == 'object') {
            filteredData[key] = value;
          }
        } else if (type === String) {
          if (key === '_id' && typeof value == 'object') {
            filteredData[key] = value.toString();
          } else if (typeof value == 'string') {
            filteredData[key] = value;
          }
        } else {
          logger.error(
            'type unsupported ' +
              type +
              ' for schema ' +
              JSON.stringify(this.schema)
          );
          //throw new Error('Cannot valid schema type unsupported ' + type);
        }
      } else {
        logger.silly(
          'undefined value for key ' +
            key +
            ' of schema ' +
            JSON.stringify(this.schema)
        );
      }
      return filteredData;
    }, {});
  }
};
