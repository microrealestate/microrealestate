import {
  Collections,
  logger,
  type Middlewares,
  ServiceError
} from '@microrealestate/common';
import { type API, SETUP_TODO_TYPES, TODO_TYPE } from '@microrealestate/shared';

export const allTodos: Middlewares.AsyncRequestHandler<
  API.Landlord.Todo.GetAllTodos.RequestParams,
  API.Landlord.Todo.GetAllTodos.ResponseBody,
  API.Landlord.Todo.GetAllTodos.RequestBody
> = async (req, res) => {
  const realm = req.realm;
  if (!realm) throw new ServiceError('Realm not found', 500);

  const realmId = String(realm._id);

  const [leaseCount, propertyCount, tenantCount] = await Promise.all([
    Collections.Lease.countDocuments({ realmId }),
    Collections.Property.countDocuments({ realmId }),
    Collections.Tenant.countDocuments({ realmId })
  ]);

  const emailServiceConfigured = !!realm.thirdParties?.smtp?.server;

  const counts = {
    [TODO_TYPE.SETUP_CONTRACT]: leaseCount,
    [TODO_TYPE.SETUP_PROPERTY]: propertyCount,
    [TODO_TYPE.SETUP_TENANT]: tenantCount,
    [TODO_TYPE.SETUP_EMAIL]: emailServiceConfigured ? 1 : 0
  };

  const setupTodos = SETUP_TODO_TYPES.filter((type) => counts[type] === 0).map(
    (type) => ({
      _id: type,
      realmId,
      type,
      ...(type === TODO_TYPE.SETUP_TENANT
        ? { blocked: leaseCount === 0 || propertyCount === 0 }
        : {})
    })
  );

  logger.info(`Found ${setupTodos.length} setup todos for ${realmId}`);
  res.json(setupTodos);
};
