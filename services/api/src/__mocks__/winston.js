module.exports = {
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
  add: jest.fn(),
  remove: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  silly: jest.fn(),
};
