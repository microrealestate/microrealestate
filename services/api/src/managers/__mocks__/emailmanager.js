export const send = jest
  .fn()
  .mockImplementation((req, res) => res.sendStatus(200));
