import crypto from 'node:crypto';
import { Service } from '@microrealestate/common';
import jwt from 'jsonwebtoken';

export async function generateTokens(dbAccount) {
  const { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET, PRODUCTION } =
    Service.getInstance().envConfig.getValues();
  const { _id, ...account } = dbAccount;
  delete account.password;
  const refreshToken = jwt.sign(
    { type: 'landlord', account },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: PRODUCTION ? '600s' : '12h',
      jwtid: crypto.randomUUID()
    }
  );
  const accessToken = jwt.sign(
    { type: 'landlord', account },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: '30s'
    }
  );

  // save tokens
  await Service.getInstance().redisClient.set(refreshToken, accessToken);

  return {
    refreshToken,
    accessToken
  };
}

export async function clearTokens(refreshToken, gracePeriodSeconds = 0) {
  if (gracePeriodSeconds > 0) {
    await Service.getInstance().redisClient.expire(
      refreshToken,
      gracePeriodSeconds
    );
  } else {
    await Service.getInstance().redisClient.del(refreshToken);
  }
}
