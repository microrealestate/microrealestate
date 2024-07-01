export const get = jest
  .fn()
  .mockImplementation((req, res) => res.sendStatus(200));
export const update = jest
  .fn()
  .mockImplementation((req, res) => res.sendStatus(200));
