import {
  Collections,
  Crypto,
  formatError,
  logger,
  Middlewares,
  Service,
  ServiceError
} from '@microrealestate/common';
import type { API, Member, RealmType } from '@microrealestate/shared';
import axios from 'axios';
import * as WebServer from './webserver';

const SECRET_PLACEHOLDER = '**********';

type ThirdParties = API.Landlord.Realm.RealmThirdParties;
type MemberSlots = { member1?: Member | null; member2?: Member | null };

/** Fields of an update body applied as they come, once the caller is allowed. */
const UPDATABLE_KEYS = [
  'name',
  'addresses',
  'bankInfo',
  'contacts',
  'isCompany',
  'companyInfo',
  'locale',
  'currency'
] as const;

function _normalizeEmail(email?: string | null): string {
  return email?.trim().toLowerCase() || '';
}

function _memberEmail(member?: Member | null): string {
  return _normalizeEmail(member?.email);
}

async function _resolveMemberAccounts(
  realm: MemberSlots
): Promise<Map<string, string>> {
  const emails = [realm.member1, realm.member2]
    .map(_memberEmail)
    .filter(Boolean);
  if (!emails.length) {
    return new Map();
  }

  const accounts = await Collections.Account.find({
    email: { $in: emails }
  }).lean();

  return new Map(
    accounts.map((account) => [
      _normalizeEmail(account.email),
      `${account.firstname} ${account.lastname}`
    ])
  );
}

async function _normalizeMembers(
  realm: MemberSlots
): Promise<{ member1: Member | null; member2: Member | null }> {
  const names = await _resolveMemberAccounts(realm);
  const toMember = (member?: Member | null): Member | null => {
    const email = _memberEmail(member);
    return email ? { email, name: names.get(email) || '' } : null;
  };

  const members = {
    member1: toMember(realm.member1),
    member2: toMember(realm.member2)
  };
  if (members.member2 && members.member2.email === members.member1?.email) {
    throw new ServiceError('members must have distinct emails', 422);
  }
  return members;
}

function _mapSecrets(
  thirdParties: ThirdParties | undefined,
  transform: (secret: string) => string
): ThirdParties | undefined {
  if (!thirdParties) {
    return thirdParties;
  }

  const { smtp } = thirdParties;
  return {
    ...thirdParties,
    ...(smtp?.password && {
      smtp: { ...smtp, password: transform(smtp.password) }
    })
  };
}

async function _toRealmApiBody(
  r: RealmType
): Promise<API.Landlord.Realm.RealmData> {
  const names = await _resolveMemberAccounts(r);

  return {
    ...r,
    member1: { ...r.member1, registered: names.has(_memberEmail(r.member1)) },
    member2: r.member2
      ? { ...r.member2, registered: names.has(_memberEmail(r.member2)) }
      : r.member2,
    bankInfo: r.bankInfo ?? { name: '', iban: '' },
    companyInfo: r.companyInfo ?? undefined,
    thirdParties: _mapSecrets(r.thirdParties, () => SECRET_PLACEHOLDER)
  };
}

function _hasRequiredFields(realm: {
  name?: string;
  member1?: API.Landlord.Realm.RealmData['member1'] | null;
  currency?: string;
  locale?: API.Landlord.Realm.RealmData['locale'];
}): void {
  [
    { name: 'name', provided: !!realm.name },
    { name: 'member1', provided: !!realm.member1?.email },
    { name: 'currency', provided: !!realm.currency },
    { name: 'locale', provided: !!realm.locale }
  ].forEach((field) => {
    if (!field.provided) {
      logger.error(`missing landlord ${field.name}`);
      throw new ServiceError('missing fields', 422);
    }
  });
}

export const add: Middlewares.AsyncRequestHandler<
  API.Landlord.Realm.PostAddRealm.RequestParams,
  API.Landlord.Realm.PostAddRealm.ResponseBody,
  API.Landlord.Realm.PostAddRealm.RequestBody
> = async (req, res) => {
  _hasRequiredFields(req.body);

  const realmCount = await Collections.Realm.countDocuments({});
  if (realmCount > 0) {
    throw new ServiceError('an organization already exists', 409);
  }

  let webServer = req.body.webServer
    ? WebServer.validateWebServer(req.body.webServer)
    : null;
  if (webServer) {
    webServer = WebServer.keepIpAccess(webServer, null);
  }

  const newRealm = new Collections.Realm({
    ...req.body,
    ...(await _normalizeMembers(req.body)),
    thirdParties: _mapSecrets(req.body.thirdParties, Crypto.encrypt),
    webServer
  });

  // reload before persisting: a failed reload must leave no stale DB state
  if (webServer) {
    await WebServer.reloadCaddy(webServer);
  }

  const savedRealm = await newRealm.save();

  res.json(await _toRealmApiBody(savedRealm.toObject() as RealmType));
};

export const update: Middlewares.AsyncRequestHandler<
  API.Landlord.Realm.PatchUpdateRealm.RequestParams,
  API.Landlord.Realm.PatchUpdateRealm.ResponseBody,
  API.Landlord.Realm.PatchUpdateRealm.RequestBody
> = async (req, res) => {
  const currentRealm = req.realm;
  if (!currentRealm) {
    throw new ServiceError('Realm not found', 500);
  }

  if (currentRealm._id !== req.body?._id) {
    throw new ServiceError('only the current organization can be updated', 403);
  }

  // retrieve the document from mongo & update it
  const previousRealm = await Collections.Realm.findOne({
    _id: req.body._id
  });
  if (!previousRealm) {
    throw new ServiceError('landlord not found', 404);
  }

  const previous = previousRealm.toObject();
  const membersChanged =
    (req.body.member1 !== undefined &&
      _memberEmail(req.body.member1) !== _memberEmail(previous.member1)) ||
    (req.body.member2 !== undefined &&
      _memberEmail(req.body.member2) !== _memberEmail(previous.member2));
  if (membersChanged) {
    // an owner-less realm cannot be reached: member1 is required by the schema
    const callerEmail = _normalizeEmail(Middlewares.getCallerEmail(req));
    if (!callerEmail || _memberEmail(previous.member1) !== callerEmail) {
      throw new ServiceError(
        'only the organization owner can manage members',
        403
      );
    }
  }

  let webServer =
    req.body.webServer !== undefined
      ? WebServer.validateWebServer(req.body.webServer)
      : undefined;
  if (webServer) {
    webServer = WebServer.keepIpAccess(webServer, previous.webServer);
  }

  const submittedFields = Object.fromEntries(
    UPDATABLE_KEYS.filter((key) => req.body[key] !== undefined).map((key) => [
      key,
      req.body[key]
    ])
  );
  const memberSlots = {
    member1:
      req.body.member1 !== undefined ? req.body.member1 : previous.member1,
    member2:
      req.body.member2 !== undefined
        ? req.body.member2 || null
        : previous.member2
  };

  _hasRequiredFields({ ...previous, ...submittedFields, ...memberSlots });

  const members = await _normalizeMembers(memberSlots);

  const { smtp } = req.body.thirdParties ?? {};
  logger.debug(`realm update with third party emailer: smtp=${!!smtp}`);

  let smtpPassword = previous.thirdParties?.smtp?.password;
  if (smtp?.passwordUpdated) {
    if (typeof smtp.password !== 'string') {
      logger.error('missing smtp password');
      throw new ServiceError('missing fields', 422);
    }
    smtpPassword = Crypto.encrypt(smtp.password);
  }

  const updatedRealm = {
    ...previous,
    ...submittedFields,
    ...members,
    ...(req.body.thirdParties && {
      thirdParties: {
        ...req.body.thirdParties,
        ...(smtp && { smtp: { ...smtp, password: smtpPassword } })
      }
    }),
    ...(webServer !== undefined && { webServer })
  };

  if (webServer && !WebServer.sameWebServer(webServer, previous.webServer)) {
    await WebServer.reloadCaddy(webServer);
  }

  previousRealm.set(updatedRealm);
  const savedRealm = await previousRealm.save();

  res.json(
    await _toRealmApiBody({
      ...savedRealm.toObject(),
      _id: String(savedRealm._id)
    } as RealmType)
  );
};

type TestSmtpRequestBody = {
  smtp?: {
    server?: string;
    port?: number;
    encryption?: string;
    authentication?: boolean;
    username?: string;
    password?: string;
    passwordUpdated?: boolean;
  };
};

export const testSmtp: Middlewares.AsyncRequestHandler<
  { id: string },
  { status: string },
  TestSmtpRequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) {
    throw new ServiceError('Realm not found', 500);
  }

  const { EMAILER_URL } = Service.getInstance().envConfig.getValues();
  if (!EMAILER_URL) {
    throw new ServiceError('EMAILER_URL is not configured', 500);
  }

  try {
    await axios.post(
      `${EMAILER_URL}/test-smtp`,
      { smtp: req.body?.smtp },
      {
        headers: {
          authorization: req.headers.authorization
        },
        timeout: 15000
      }
    );
  } catch (error) {
    logger.error(formatError(error as Error));
    const response = axios.isAxiosError(error) ? error.response : undefined;
    if (response?.status === 422) {
      throw new ServiceError(
        response.data?.message ?? 'SMTP connection failed',
        422
      );
    }
    throw new ServiceError('SMTP connection failed', 502);
  }
  res.json({ status: 'ok' });
};

export const get: Middlewares.AsyncRequestHandler<
  API.Landlord.Realm.GetRealm.RequestParams,
  API.Landlord.Realm.GetRealm.ResponseBody,
  API.Landlord.Realm.GetRealm.RequestBody
> = async (req, res) => {
  res.json(req.realm ? await _toRealmApiBody(req.realm) : null);
};
