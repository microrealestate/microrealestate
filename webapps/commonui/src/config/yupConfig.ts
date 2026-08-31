import moment from 'moment';
import * as Yup from 'yup';

Yup.addMethod(Yup.string, 'emails', function (message) {
  return this.test({
    name: 'emails',
    message,
    test: (value) => {
      if (value == null) {
        return true;
      }
      const schema = Yup.string().email();
      const emails = value.replace(/\s/g, '').split(',');
      return (
        emails.every((email) => schema.isValidSync(email)) &&
        emails.length === new Set(emails).size
      );
    }
  });
});

const DOMAIN_OR_IP_REGEX =
  /^(\d{1,3}(\.\d{1,3}){3}|([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,})$/i;

Yup.addMethod(Yup.string, 'domain', function () {
  return this.test({
    name: 'domain',
    message: 'Enter a valid domain',
    test: (value) => {
      if (value == null || value === '') {
        return true;
      }
      const cleaned = value
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .trim();
      return DOMAIN_OR_IP_REGEX.test(cleaned);
    }
  });
});

Yup.setLocale({
  string: {
    length: ({ length }) => ['Enter {length} characters', { length }],
    min: ({ min }) => ['Enter at least {min} characters', { min }],
    max: ({ max }) => ['Enter at most {max} characters', { max }],
    matches: 'Enter a valid value',
    url: 'Enter a valid URL',
    uuid: 'Enter a valid UUID',
    trim: 'Enter a valid value',
    lowercase: 'Enter a lowercase value',
    uppercase: 'Enter an uppercase value',
    email: 'Enter a valid email address'
    // emails: 'Enter one or more valid email addresses, separated by commas.'
  },
  mixed: {
    required: 'This field is required',
    oneOf: 'Select one of the options',
    notOneOf: 'Select one of the options',
    notType: 'Enter a valid value',
    defined: 'Enter a valid value'
  },
  number: {
    min: ({ min }) => ['Enter a value greater than or equal to {min}', { min }],
    max: ({ max }) => ['Enter a value less than or equal to {max}', { max }],
    lessThan: ({ less }) => ['Enter a value less than {less}', { less }],
    moreThan: ({ more }) => ['Enter a value greater than {more}', { more }],
    positive: 'Enter a positive number',
    negative: 'Enter a negative number',
    integer: 'Enter an integer'
  },
  date: {
    min: ({ min }) => [
      'Enter a date after {min}',
      { min: moment(min).format('L') }
    ],
    max: ({ max }) => [
      'Enter a date before {max}',
      { max: moment(max).format('L') }
    ]
  },
  boolean: {
    isValue: 'Enter a valid value'
  },
  object: {
    noUnknown: 'Enter a valid value'
  },
  array: {
    length: ({ length }) => ['Enter {length} items', { length }],
    min: ({ min }) => ['Enter at least {min} items', { min }],
    max: ({ max }) => ['Enter at most {max} items', { max }]
  }
});
