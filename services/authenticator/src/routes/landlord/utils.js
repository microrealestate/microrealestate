import crypto from 'node:crypto';
import { Service } from '@microrealestate/common';
import jwt from 'jsonwebtoken';

export function refreshTokenSeconds() {
  const { PRODUCTION } = Service.getInstance().envConfig.getValues();
  return PRODUCTION ? 600 : 12 * 60 * 60;
}

export async function generateTokens(dbAccount) {
  const { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET } =
    Service.getInstance().envConfig.getValues();
  const { _id, ...account } = dbAccount;
  delete account.password;
  const refreshToken = jwt.sign(
    { type: 'landlord', account },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: refreshTokenSeconds(),
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
  await Service.getInstance().redisClient.expire(
    refreshToken,
    refreshTokenSeconds()
  );

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
