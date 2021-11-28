module.exports = {
  all: jest.fn().mockImplementation((req, res) => res.sendStatus(200)),
  one: jest.fn().mockImplementation((req, res) => res.sendStatus(200)),
  add: jest.fn().mockImplementation((req, res) => res.sendStatus(200)),
  update: jest.fn().mockImplementation((req, res) => res.sendStatus(200)),
  remove: jest.fn().mockImplementation((req, res) => res.sendStatus(200)),
};
