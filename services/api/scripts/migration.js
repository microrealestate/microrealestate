const logger = require('winston');
const mongoosedb = require('@microrealestate/common/models/db');
const Template = require('@microrealestate/common/models/template');
const Document = require('@microrealestate/common/models/document');
const Tenant = require('@microrealestate/common/models/tenant');

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
