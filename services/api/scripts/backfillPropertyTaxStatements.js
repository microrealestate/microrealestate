import {
  Collections,
  EnvironmentConfig,
  logger,
  MongoClient
} from '@microrealestate/common';
import { fileURLToPath } from 'url';

const DEFAULT_ESTIMATED_INCREASE = 3.5;
const UTILITY_TAX_TYPES = [
  'property_tax',
  'property-tax',
  'property taxes',
  'tax',
  'taxes'
];

function isRunningAsScript() {
  const __filename = fileURLToPath(import.meta.url);
  return __filename === process.argv[1];
}

function roundCurrency(value) {
  return Number((Number(value || 0) + Number.EPSILON).toFixed(2));
}

function parseArgs() {
  const args = process.argv.slice(2);

  const commit = args.includes('--commit');
  const fromUtilities = args.includes('--from-utilities');

  const increaseToken = args.find((arg) => arg.startsWith('--increase='));
  const increaseValue = increaseToken
    ? Number(increaseToken.split('=')[1])
    : DEFAULT_ESTIMATED_INCREASE;

  return {
    commit,
    fromUtilities,
    increase: Number.isFinite(increaseValue)
      ? increaseValue
      : DEFAULT_ESTIMATED_INCREASE
  };
}

function deriveTaxYearLabel(utility) {
  const billingMonth = String(utility.billingMonth || '');
  if (/^\d{4}-\d{2}$/.test(billingMonth)) {
    return billingMonth.slice(0, 4);
  }

  return billingMonth || 'unknown';
}

function buildDerivedFields(statement, defaultIncrease) {
  const totalAfterDiscount = Number(statement.totalAfterDiscount || 0);
  const estimatedIncreasePercentage = Number.isFinite(
    Number(statement.estimatedIncreasePercentage)
  )
    ? Number(statement.estimatedIncreasePercentage)
    : defaultIncrease;
  const estimatedNextYearTotal = roundCurrency(
    Number(statement.estimatedNextYearTotal || 0) > 0
      ? Number(statement.estimatedNextYearTotal)
      : totalAfterDiscount * (1 + estimatedIncreasePercentage / 100)
  );
  const estimatedMonthlyCost = roundCurrency(
    Number(statement.estimatedMonthlyCost || 0) > 0
      ? Number(statement.estimatedMonthlyCost)
      : estimatedNextYearTotal / 12
  );

  const priorYearEstimatedTotalRaw = statement.priorYearEstimatedTotal;
  const priorYearEstimatedTotal =
    priorYearEstimatedTotalRaw === null ||
    priorYearEstimatedTotalRaw === undefined ||
    priorYearEstimatedTotalRaw === ''
      ? null
      : Number(priorYearEstimatedTotalRaw);

  const priorYearVariance =
    priorYearEstimatedTotal === null ||
    !Number.isFinite(priorYearEstimatedTotal)
      ? null
      : roundCurrency(totalAfterDiscount - priorYearEstimatedTotal);

  return {
    estimatedIncreasePercentage,
    estimatedNextYearTotal,
    estimatedMonthlyCost,
    priorYearVariance
  };
}

async function backfillDerivedFields(options) {
  const statements = await Collections.PropertyTaxStatement.find({});
  let changed = 0;

  for (const statement of statements) {
    const derived = buildDerivedFields(statement, options.increase);
    const shouldUpdate =
      Number(statement.estimatedIncreasePercentage) !==
        Number(derived.estimatedIncreasePercentage) ||
      Number(statement.estimatedNextYearTotal) !==
        Number(derived.estimatedNextYearTotal) ||
      Number(statement.estimatedMonthlyCost) !==
        Number(derived.estimatedMonthlyCost) ||
      Number(statement.priorYearVariance) !== Number(derived.priorYearVariance);

    if (!shouldUpdate) {
      continue;
    }

    changed += 1;
    if (options.commit) {
      statement.estimatedIncreasePercentage =
        derived.estimatedIncreasePercentage;
      statement.estimatedNextYearTotal = derived.estimatedNextYearTotal;
      statement.estimatedMonthlyCost = derived.estimatedMonthlyCost;
      statement.priorYearVariance = derived.priorYearVariance;
      await statement.save();
    }
  }

  logger.info(
    `Derived fields ${options.commit ? 'updated' : 'would update'} for ${changed} property tax statements`
  );
}

async function backfillFromUtilities(options) {
  const utilities = await Collections.Utility.find({
    type: { $in: UTILITY_TAX_TYPES }
  }).lean();

  if (!utilities.length) {
    logger.info('No utility records found for configured tax categories');
    return;
  }

  const existingStatements = await Collections.PropertyTaxStatement.find(
    {},
    { realmId: 1, propertyId: 1, taxYearLabel: 1 }
  ).lean();

  const existingByKey = new Set(
    existingStatements.map(
      (statement) =>
        `${statement.realmId}::${statement.propertyId}::${statement.taxYearLabel}`
    )
  );

  const grouped = new Map();
  for (const utility of utilities) {
    const taxYearLabel = deriveTaxYearLabel(utility);
    const key = `${utility.realmId}::${utility.propertyId}::${taxYearLabel}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        realmId: utility.realmId,
        propertyId: utility.propertyId,
        taxYearLabel,
        accountNumber: utility.accountNumber || '',
        totalAfterDiscount: 0,
        taxBeforeDiscount: 0,
        attachmentIds: [],
        notes: []
      });
    }

    const item = grouped.get(key);
    item.totalAfterDiscount += Number(utility.amount || 0);
    item.taxBeforeDiscount += Number(utility.amount || 0);
    if (utility.accountNumber && !item.accountNumber) {
      item.accountNumber = utility.accountNumber;
    }
    if (Array.isArray(utility.attachmentIds)) {
      item.attachmentIds.push(...utility.attachmentIds.map((id) => String(id)));
    }
    if (utility.notes) {
      item.notes.push(String(utility.notes).trim());
    }
  }

  let created = 0;
  for (const [key, item] of grouped.entries()) {
    if (existingByKey.has(key)) {
      continue;
    }

    const estimatedNextYearTotal = roundCurrency(
      item.totalAfterDiscount * (1 + options.increase / 100)
    );
    const payload = {
      realmId: item.realmId,
      propertyId: item.propertyId,
      taxYearLabel: item.taxYearLabel,
      accountNumber: item.accountNumber,
      taxBeforeDiscount: roundCurrency(item.taxBeforeDiscount),
      delinquentTaxes: 0,
      totalAfterDiscount: roundCurrency(item.totalAfterDiscount),
      estimatedIncreasePercentage: options.increase,
      estimatedNextYearTotal,
      estimatedMonthlyCost: roundCurrency(estimatedNextYearTotal / 12),
      attachmentIds: Array.from(new Set(item.attachmentIds)),
      notes: ['Backfilled from utility records', ...item.notes.filter(Boolean)]
        .join(' | ')
        .slice(0, 2000)
    };

    created += 1;
    if (options.commit) {
      await new Collections.PropertyTaxStatement(payload).save();
    }
  }

  logger.info(
    `${options.commit ? 'Created' : 'Would create'} ${created} property tax statements from utility records`
  );
}

async function runBackfill() {
  const options = parseArgs();
  let failure = false;
  let db;

  try {
    if (isRunningAsScript()) {
      db = MongoClient.getInstance(new EnvironmentConfig());
      await db.connect();
      logger.info('Database connected');
    }

    logger.info(
      `Running property tax backfill (commit=${options.commit}, fromUtilities=${options.fromUtilities}, increase=${options.increase})`
    );

    await backfillDerivedFields(options);

    if (options.fromUtilities) {
      await backfillFromUtilities(options);
    }

    logger.info('Property tax backfill completed');
  } catch (error) {
    failure = true;
    logger.error(String(error));
  } finally {
    if (isRunningAsScript()) {
      if (db) {
        try {
          await db.disconnect();
        } catch (error) {
          logger.error(String(error));
          failure = true;
        }
      }
      process.exit(failure ? 1 : 0);
    }
  }
}

if (isRunningAsScript()) {
  runBackfill();
}

export default runBackfill;
