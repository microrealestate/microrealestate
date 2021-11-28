module.exports = {
  updateByTerm: jest.fn().mockImplementation((req, res) => res.sendStatus(200)),
  rentsOfOccupant: jest
    .fn()
    .mockImplementation((req, res) => res.sendStatus(200)),
  rentOfOccupantByTerm: jest
    .fn()
    .mockImplementation((req, res) => res.sendStatus(200)),
  all: jest.fn().mockImplementation((req, res) => res.sendStatus(200)),
};
