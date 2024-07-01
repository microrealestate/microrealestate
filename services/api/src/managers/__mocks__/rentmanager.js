export const updateByTerm = jest
  .fn()
  .mockImplementation((req, res) => res.sendStatus(200));
export const rentsOfOccupant = jest
  .fn()
  .mockImplementation((req, res) => res.sendStatus(200));
export const rentOfOccupantByTerm = jest
  .fn()
  .mockImplementation((req, res) => res.sendStatus(200));
export const all = jest
  .fn()
  .mockImplementation((req, res) => res.sendStatus(200));
