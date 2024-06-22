export const verify = jest.fn().mockImplementation((token) => {
  if ([undefined, null, 'invalid'].includes(token)) {
    throw new Error('invalid token');
  }
  return { account: { email: 'test@test.com' } };
});
