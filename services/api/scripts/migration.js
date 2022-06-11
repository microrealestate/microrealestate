const logger = require('winston');
const mongoosedb = require('@mre/common/models/db');
const Template = require('@mre/common/models/template');
const Document = require('@mre/common/models/document');
const Tenant = require('@mre/common/models/tenant');

async function withDB(job) {
  let failure = false;
  try {
    await mongoosedb.connect();
    await job();
  } catch (error) {
    logger.error(error);
    failure = true;
  } finally {
    try {
      await mongoosedb.disconnect();
    } catch (error) {
      logger.error(error);
    }
  }
  return failure;
}

// Main
module.exports = async (processExitOnCompleted = false) => {
  let failure = false;
  try {
    failure = await withDB(async () => {
      await Promise.all([
        Tenant.updateMany(
          { leaseId: 'undefined' },
          { $set: { leaseId: null } }
        ),
        Template.updateMany({ type: 'contract' }, { $set: { type: 'text' } }),
        Document.updateMany({ type: 'contract' }, { $set: { type: 'text' } }),
      ]);
    });
  } catch (error) {
    logger.error(error);
    failure = true;
  } finally {
    if (processExitOnCompleted) {
      process.exit(failure ? 1 : 0);
    }
  }
};
