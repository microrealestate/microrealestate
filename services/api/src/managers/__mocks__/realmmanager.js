export const all = jest
  .fn()
  .mockImplementation((req, res) => res.sendStatus(200));
export const one = jest
  .fn()
  .mockImplementation((req, res) => res.sendStatus(200));
export const add = jest
  .fn()
  .mockImplementation((req, res) => res.sendStatus(200));
export const update = jest
  .fn()
  .mockImplementation((req, res) => res.sendStatus(200));
