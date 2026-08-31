import crypto from 'node:crypto';
import {
  Collections,
  Cookies,
  formatError,
  logger,
  Middlewares,
  Service,
  ServiceError
} from '@microrealestate/common';
import { isStrongPassword } from '@microrealestate/shared';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as Utils from './utils';

async function isSignUpAvailable() {
  return (await Collections.Account.countDocuments({})) === 0;
}

export const signUp = Middlewares.asyncWrapper(async (req, res) => {
  const { firstname, lastname, email, password } = req.body;
  if (
    [firstname, lastname, email, password]
      .map((el) => (el || '').trim())
      .some((el) => !!el === false)
  ) {
    throw new ServiceError('missing fields', 422);
  }
  if (!isStrongPassword(password)) {
    throw new ServiceError('weak password', 400);
  }
  if (!(await isSignUpAvailable())) {
    throw new ServiceError('signup is closed', 403);
  }

  try {
    await Collections.Account.create({
      firstname,
      lastname,
      email,
      password
    });
  } catch (error) {
    if (error?.code === 11000) {
      // lost the race against a concurrent first signup
      throw new ServiceError('signup is closed', 403);
    }
    throw error;
  }

  // the owner signs in, signup does not open a session
  res.sendStatus(201);
});

export const signUpStatus = Middlewares.asyncWrapper(async (_req, res) => {
  res.json({ available: await isSignUpAvailable() });
});

export const signIn = Middlewares.asyncWrapper(async (req, res) => {
  if (!req.body.email) {
    throw new ServiceError('missing fields', 422);
  }

  return await userSignIn(req, res);
});

export const refreshToken = Middlewares.asyncWrapper(async (req, res) => {
  const { REFRESH_TOKEN_SECRET } = Service.getInstance().envConfig.getValues();
  const cookieAttrs = Cookies.getTokenCookieAttributes(req);

  logger.debug('give a new refresh token');

  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken) {
    logger.error('missing the original refresh token');
    throw new ServiceError('invalid credentials', 403);
  }

  const oldAccessToken =
    await Service.getInstance().redisClient.get(oldRefreshToken);
  if (!oldAccessToken) {
    logger.error('original refresh token not found in database');
    throw new ServiceError('invalid credentials', 403);
  }

  let account;
  try {
    const payload = jwt.verify(oldRefreshToken, REFRESH_TOKEN_SECRET);
    account = payload?.account;
  } catch (_exc) {
    logger.error('invalid or expired original refresh token');
    await Utils.clearTokens(oldRefreshToken);
    res.clearCookie('refreshToken', cookieAttrs);
    throw new ServiceError('invalid credentials', 403);
  }

  if (!account) {
    logger.error('account not found in original refresh token');
    await Utils.clearTokens(oldRefreshToken);
    res.clearCookie('refreshToken', cookieAttrs);
    throw new ServiceError('invalid credentials', 403);
  }

  // the account may have been removed since the token was issued, a revoked
  // collaborator must not be able to keep refreshing their session
  const dbAccount = await Collections.Account.findOne({
    email: account.email.toLowerCase()
  }).lean();
  if (!dbAccount) {
    logger.error('account of the original refresh token no longer exists');
    await Utils.clearTokens(oldRefreshToken);
    res.clearCookie('refreshToken', cookieAttrs);
    throw new ServiceError('invalid credentials', 403);
  }

  const { refreshToken, accessToken } = await Utils.generateTokens({
    email: dbAccount.email,
    firstname: dbAccount.firstname,
    lastname: dbAccount.lastname
  });

  if (!refreshToken) {
    res.clearCookie('refreshToken', cookieAttrs);
    await Utils.clearTokens(oldRefreshToken);
    throw new ServiceError('invalid credentials', 403);
  }

  await Utils.clearTokens(oldRefreshToken, 10);

  res.cookie('refreshToken', refreshToken, cookieAttrs);
  res.json({
    accessToken
  });
});

export const getSession = Middlewares.asyncWrapper(async (req, res) => {
  const { REFRESH_TOKEN_SECRET } = Service.getInstance().envConfig.getValues();
  const refreshToken = req.cookies.refreshToken;
  const accessToken = await Service.getInstance().redisClient.get(refreshToken);
  if (!accessToken) {
    logger.error('cannot return session refresh token not found in database');
    throw new ServiceError('invalid session', 401);
  }

  let email;
  try {
    const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    if (payload?.account?.email) {
      email = payload.account.email;
    }
  } catch (exc) {
    logger.error(formatError(exc));
    throw new ServiceError('invalid session', 401);
  }

  if (!email) {
    logger.error('invalid session email not found in refresh token');
    throw new ServiceError('invalid session', 401);
  }

  const account = await Collections.Account.findOne({
    email: email.toLowerCase()
  }).lean();

  if (!account) {
    logger.error('invalid session account not found in database');
    throw new ServiceError('invalid session', 401);
  }

  // organization where user is a member
  const organization = await Collections.Realm.findOne({
    $or: [
      { 'member1.email': email.toLowerCase() },
      { 'member2.email': email.toLowerCase() }
    ]
  }).lean();

  res.json({
    accessToken,
    account: {
      firstname: account.firstname,
      lastname: account.lastname,
      email: account.email,
      mustChangePassword: !!account.mustChangePassword,
      organization: organization
        ? {
            _id: organization._id,
            name: organization.name,
            locale: organization.locale,
            webServer: {
              domain: organization.webServer?.domain,
              httpsEnabled: !!organization.webServer?.httpsEnabled
            }
          }
        : null
    }
  });
});

export const signOut = Middlewares.asyncWrapper(async (req, res) => {
  const cookieAttrs = Cookies.getTokenCookieAttributes(req);
  const refreshToken = req.cookies.refreshToken;
  logger.debug('remove a refresh token');
  if (!refreshToken) {
    return res.sendStatus(202);
  }

  res.clearCookie('refreshToken', cookieAttrs);
  await Utils.clearTokens(refreshToken);
  res.sendStatus(204);
});

export const forgotPassword = Middlewares.asyncWrapper(async (req, res) => {
  const { EMAILER_URL, RESET_TOKEN_SECRET } =
    Service.getInstance().envConfig.getValues();
  const { email } = req.body;
  if (!email) {
    logger.error('missing email field');
    throw new ServiceError('missing fields', 422);
  }
  // check if user exists
  const account = await Collections.Account.findOne({
    email: email.toLowerCase()
  });
  if (account) {
    // generate reset token valid for one hour
    const token = jwt.sign({ email }, RESET_TOKEN_SECRET, {
      expiresIn: '1h'
    });
    await Service.getInstance().redisClient.set(token, email);

    // send email
    try {
      await axios.post(
        `${EMAILER_URL}/resetpassword`,
        {
          templateName: 'reset_password',
          recordId: email,
          params: {
            token
          }
        },
        {
          headers: {
            'Accept-Language': req.rawLocale.code
          }
        }
      );
    } catch (error) {
      logger.error(
        `cannot send the reset password email: ${formatError(error)}`
      );
    }
  }
  res.sendStatus(204);
});

export const resetPassword = Middlewares.asyncWrapper(async (req, res) => {
  const { RESET_TOKEN_SECRET } = Service.getInstance().envConfig.getValues();
  const { resetToken, password } = req.body;
  if (
    [resetToken, password].map((el) => el.trim()).some((el) => !!el === false)
  ) {
    throw new ServiceError('missing fields', 422);
  }

  const email = await Service.getInstance().redisClient.get(resetToken);
  if (!email) {
    throw new ServiceError('invalid credentials', 403);
  }

  await Service.getInstance().redisClient.del(resetToken);

  try {
    jwt.verify(resetToken, RESET_TOKEN_SECRET);
  } catch (error) {
    throw new ServiceError(error, 403);
  }

  if (!isStrongPassword(password)) {
    throw new ServiceError('weak password', 400);
  }

  const account = await Collections.Account.findOne({
    email: email.toLowerCase()
  });
  account.password = password;
  await account.save();

  res.sendStatus(200);
});

export const changePassword = Middlewares.asyncWrapper(async (req, res) => {
  const cookieAttrs = Cookies.getTokenCookieAttributes(req);
  const { currentPassword, newPassword } = req.body;
  if (
    [currentPassword, newPassword]
      .map((el) => (el || '').trim())
      .some((el) => !!el === false)
  ) {
    throw new ServiceError('missing fields', 422);
  }

  const email = Middlewares.getCallerEmail(req);
  const account = await Collections.Account.findOne({
    email: email.toLowerCase()
  });

  if (!account) {
    throw new ServiceError('invalid current password', 400);
  }

  const validPassword = await bcrypt.compare(currentPassword, account.password);
  if (!validPassword) {
    throw new ServiceError('invalid current password', 400);
  }

  if (currentPassword === newPassword) {
    throw new ServiceError('same password', 400);
  }

  if (!isStrongPassword(newPassword)) {
    throw new ServiceError('weak password', 400);
  }

  account.password = newPassword;
  account.mustChangePassword = false;
  await account.save();

  // revoke the session the password was changed from, the user has to sign in again
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await Utils.clearTokens(refreshToken);
  }
  res.clearCookie('refreshToken', cookieAttrs);

  res.sendStatus(200);
});

// unambiguous alphabet: no I/l/1, no O/0
const TEMPORARY_PASSWORD_LENGTH = 16;
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';

function pickChar(alphabet) {
  return alphabet[crypto.randomInt(alphabet.length)];
}

/**
 * Generates the one-time password a provisioned collaborator signs in with.
 * One character of each class up front so the result always satisfies
 * isStrongPassword, then shuffled so their position carries no information.
 */
function generateTemporaryPassword() {
  const every = LOWERCASE + UPPERCASE + DIGITS;
  const chars = [pickChar(LOWERCASE), pickChar(UPPERCASE), pickChar(DIGITS)];
  while (chars.length < TEMPORARY_PASSWORD_LENGTH) {
    chars.push(pickChar(every));
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/**
 * Loads the organization the caller belongs to and asserts they own it. Only
 * member1 may provision or revoke a collaborator. The lookup is filtered on the
 * caller rather than taking the first realm, so a database left over from a
 * multi-organization install resolves the same realm the caller signed in to.
 */
async function getOwnedRealm(callerEmail) {
  const realm = await Collections.Realm.findOne({
    $or: [{ 'member1.email': callerEmail }, { 'member2.email': callerEmail }]
  }).lean();
  if (!realm) {
    throw new ServiceError('organization not found', 404);
  }
  if (realm.member1?.email?.toLowerCase() !== callerEmail) {
    throw new ServiceError(
      'only the organization owner can manage members',
      403
    );
  }
  return realm;
}

function realmMemberEmails(realm) {
  return [realm.member1?.email, realm.member2?.email]
    .filter(Boolean)
    .map((email) => email.toLowerCase());
}

export const provisionMember = Middlewares.asyncWrapper(async (req, res) => {
  const callerEmail = Middlewares.getCallerEmail(req).toLowerCase();
  const { firstname, lastname, email } = req.body;
  if (
    [firstname, lastname, email]
      .map((el) => (el || '').trim())
      .some((el) => !!el === false)
  ) {
    throw new ServiceError('missing fields', 422);
  }

  const memberEmail = email.trim().toLowerCase();
  const realm = await getOwnedRealm(callerEmail);

  // the email must already occupy a member slot: provisioning can never
  // create an account for an address the organization does not know
  if (!realmMemberEmails(realm).includes(memberEmail)) {
    throw new ServiceError('not a member of the organization', 422);
  }

  if (await Collections.Account.exists({ email: memberEmail })) {
    throw new ServiceError('account already exists', 409);
  }

  const temporaryPassword = generateTemporaryPassword();
  try {
    await Collections.Account.create({
      firstname,
      lastname,
      email: memberEmail,
      password: temporaryPassword,
      mustChangePassword: true
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ServiceError('account already exists', 409);
    }
    throw error;
  }

  res.status(201).json({ temporaryPassword });
});

export const deleteMember = Middlewares.asyncWrapper(async (req, res) => {
  const callerEmail = Middlewares.getCallerEmail(req).toLowerCase();
  const memberEmail = (req.params.email || '').trim().toLowerCase();
  if (!memberEmail) {
    throw new ServiceError('missing fields', 422);
  }
  if (memberEmail === callerEmail) {
    throw new ServiceError('cannot delete your own account', 403);
  }

  const realm = await getOwnedRealm(callerEmail);

  // the organization must release the slot first, otherwise it would point
  // at an account that no longer exists
  if (realmMemberEmails(realm).includes(memberEmail)) {
    throw new ServiceError('still a member of the organization', 422);
  }

  await Collections.Account.deleteOne({ email: memberEmail });
  res.sendStatus(204);
});

async function userSignIn(req, res) {
  const cookieAttrs = Cookies.getTokenCookieAttributes(req);
  const { email, password } = req.body;
  if ([email, password].map((el) => el.trim()).some((el) => !!el === false)) {
    logger.error('login failed some fields are missing');
    throw new ServiceError('missing fields', 422);
  }

  const account = await Collections.Account.findOne({
    email: email.toLowerCase()
  }).lean();

  if (!account) {
    logger.info(`login failed for ${email} account not found`);
    throw new ServiceError('invalid credentials', 401);
  }

  const validPassword = await bcrypt.compare(password, account.password);
  if (!validPassword) {
    logger.info(`login failed for ${email} bad password`);
    throw new ServiceError('invalid credentials', 401);
  }

  const { refreshToken, accessToken } = await Utils.generateTokens({
    firstname: account.firstname,
    lastname: account.lastname,
    email: account.email
  });

  logger.debug('created a new refresh token');
  res.cookie('refreshToken', refreshToken, cookieAttrs);
  res.json({
    accessToken
  });
}
