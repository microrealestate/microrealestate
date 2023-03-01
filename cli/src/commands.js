const fs = require('fs');
const path = require('path');
const clear = require('clear');
const chalk = require('chalk');
const figlet = require('figlet');
const inquirer = require('inquirer');
const moment = require('moment');
const {
  generateRandomToken,
  runCompose,
  buildUrl,
  destructUrl,
  loadEnv,
} = require('./utils');

const initDirectories = () => {
  const mongoDir = path.join('.', 'data', 'mongodb');
  if (!fs.existsSync(mongoDir)) {
    fs.mkdirSync(mongoDir, { recursive: true });
  }
};

const displayHeader = () => {
  clear();
  console.log(
    chalk.white(
      figlet.textSync('MicroRealEstate', {
        horizontalLayout: 'full',
      })
    )
  );
  console.log(
    chalk.white(
      'The application which helps the landlords to manage their property rents'
    )
  );
  console.log('');
};

const build = async () => {
  try {
    await runCompose(
      ['build', '--no-cache', '--force-rm', '--quiet'],
      { runMode: 'prod' },
      { waitLog: 'building containers...' }
    );

    console.log(chalk.green('build completed'));
  } catch (error) {
    console.error(chalk.red(error));
  }
};

const start = async () => {
  try {
    initDirectories();
    await runCompose(
      ['up', '-d', '--force-recreate', '--remove-orphans'],
      { runMode: 'prod' },
      { waitLog: 'starting the application...' }
    );

    console.log(
      chalk.green(
        `Landlord front-end ready and accessible on ${
          process.env.APP_URL || process.env.LANDLORD_APP_URL
        }`
      )
    );
    console.log(
      chalk.green(
        `Tenant front-end ready and accessible on ${process.env.TENANT_APP_URL}`
      )
    );
  } catch (error) {
    console.error(chalk.red(error));
  }
};

const stop = async (runConfig = { runMode: 'prod' }) => {
  try {
    await runCompose(
      ['rm', '--stop', '--force'],
      { runMode: runConfig.runMode },
      { waitLog: 'stopping current running application...' }
    );
  } catch (error) {
    console.error(chalk.red(error));
  }
};

const dev = async () => {
  try {
    initDirectories();
    await runCompose(
      ['up', '--build', '--force-recreate', '--remove-orphans', '--no-color'],
      {
        runMode: 'dev',
      },
      {
        logErrorsDuringExecution: true,
      }
    );
  } catch (error) {
    console.error(chalk.red(error));
  }
};

const status = async () => {
  try {
    await runCompose(
      ['ps'],
      {
        runMode: 'prod',
      },
      {
        logErrorsDuringExecution: true,
      }
    );
  } catch (error) {
    console.error(chalk.red(error));
  }
};

const config = async (runMode) => {
  try {
    await runCompose(
      ['config'],
      {
        runMode,
      },
      {
        logErrorsDuringExecution: true,
      }
    );
  } catch (error) {
    console.error(chalk.red(error));
  }
};

const restoreDB = async (backupFile) => {
  loadEnv();
  try {
    const connectionString = process.env.MONGO_URL || process.env.BASE_DB_URL;
    const archiveFile = `/backup/${backupFile}`;

    await runCompose(
      [
        'run',
        'mongo',
        'mongorestore',
        '--uri',
        connectionString,
        '--drop',
        '--gzip',
        `--archive=${archiveFile}`,
      ],
      {},
      {
        logErrorsDuringExecution: true,
        waitLog: 'restoring database...',
      }
    );
  } catch (error) {
    console.error(chalk.red(error));
  }
};

const dumpDB = async () => {
  loadEnv();
  try {
    const connectionString = process.env.MONGO_URL || process.env.BASE_DB_URL;
    const dbUrl = new URL(connectionString);
    const dbName = dbUrl.pathname.slice(1);
    const timeStamp = moment().format('YYYYMMDDHHmm');
    const archiveFile = `/backup/${dbName}-${timeStamp}.dump`;

    await runCompose(
      [
        'run',
        'mongo',
        'mongodump',
        '--uri',
        connectionString,
        '--gzip',
        `--archive=${archiveFile}`,
      ],
      {
        root: true,
      },
      {
        logErrorsDuringExecution: true,
        waitLog: 'dumping database...',
      }
    );
  } catch (error) {
    console.error(chalk.red(error));
  }
};

const displayHelp = () => {
  console.log(
    chalk.white(
      'Usage: mre [option...] {dev|build|status|start|stop|config|restoredb|dumpdb}'
    )
  );
};

const askForEnvironmentVariables = (envConfig) => {
  const questions = [
    {
      name: 'dbData',
      type: 'list',
      message: 'Do you want the database to be populated with?',
      choices: [
        { name: 'empty data', value: 'empty_data' },
        { name: 'demonstration data', value: 'demo_data' },
      ],
      default: 'empty_data',
    },
    {
      name: 'mailgunConfig',
      type: 'confirm',
      message:
        'Have you created a mailgun account for sending emails (https://www.mailgun.com/)?',
    },
    {
      name: 'mailgunApiKey',
      type: 'input',
      message: 'Enter the mailgun API key:',
      when: (answers) => answers.mailgunConfig,
    },
    {
      name: 'mailgunDomain',
      type: 'input',
      message: 'Enter the mailgun domain:',
      when: (answers) => answers.mailgunConfig,
    },
    {
      name: 'mailgunFromEmail',
      type: 'input',
      message: 'Enter the sender email address (from):',
      when: (answers) => answers.mailgunConfig,
    },
    {
      name: 'mailgunReplyToEmail',
      type: 'input',
      message: 'Enter the reply to email address (reply to):',
      when: (answers) => answers.mailgunConfig,
    },
    {
      name: 'landlordAppUrl',
      type: 'input',
      message: 'Enter the URL to access the landlord front-end:',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch (error) {
          return false;
        }
      },
      default: 'http://localhost:8080/landlord',
    },
    {
      name: 'tenantAppUrl',
      type: 'input',
      message:
        'Enter the URL to access the tenant front-end (it should share the same domain and port as the landlord front-end URL):',
      validate: (input, answers) => {
        try {
          const { domain: tenantDomain, port: tenantPort } = destructUrl(input);
          const { domain: landlordDomain, port: landlordPort } = destructUrl(
            answers.landlordAppUrl
          );

          return tenantDomain === landlordDomain && tenantPort === landlordPort;
        } catch (error) {
          return false;
        }
      },
      default: (answers) => {
        try {
          const { protocol, subDomain, domain, port, basePath } = destructUrl(
            answers.landlordAppUrl
          );
          if (basePath) {
            return buildUrl({
              protocol,
              subDomain,
              domain,
              port,
              basePath: '/tenant',
            });
          }
          return buildUrl({
            protocol,
            subDomain: 'tenant',
            domain,
            port,
          });
        } catch (error) {
          return 'http://localhost:8080/tenant';
        }
      },
    },
  ];
  return inquirer.prompt(questions, {
    dbData: envConfig?.DEMO_MODE === 'true' ? 'demo_data' : 'empty_data',
    mailgunConfig: envConfig?.ALLOW_SENDING_EMAILS,
    mailgunApiKey: envConfig?.MAILGUN_API_KEY,
    mailgunDomain: envConfig?.MAILGUN_DOMAIN,
    mailgunFromEmail: envConfig?.EMAIL_FROM,
    mailgunReplyToEmail: envConfig?.EMAIL_REPLY_TO,
    landlordAppUrl: envConfig?.APP_URL || envConfig?.LANDLORD_APP_URL,
    tenantAppUrl: envConfig?.TENANT_APP_URL,
  });
};

const askRunMode = () => {
  const questions = [
    {
      name: 'runMode',
      type: 'list',
      message: 'How do you want to run?',
      choices: [
        { name: 'production mode', value: 'prod' },
        { name: 'development mode', value: 'dev' },
      ],
      default: 'prod',
    },
  ];
  return inquirer.prompt(questions);
};

const askBackupFile = (backupFiles) => {
  const questions = [
    {
      name: 'backupFile',
      type: 'list',
      message: 'Select a backup:',
      choices: backupFiles.map((file) => ({
        name: file,
        value: file,
      })),
    },
  ];
  return inquirer.prompt(questions);
};

const writeDotEnv = (promptsConfig, envConfig) => {
  const cipherKey = envConfig?.CIPHER_KEY || generateRandomToken(32);
  const cipherIvKey = envConfig?.CIPHER_IV_KEY || generateRandomToken(32);
  const tokenDbPassword =
    envConfig?.AUTHENTICATOR_TOKEN_DB_PASSWORD || generateRandomToken(64);
  const accessTokenSecret =
    envConfig?.AUTHENTICATOR_ACCESS_TOKEN_SECRET || generateRandomToken(64);
  const refreshTokenSecret =
    envConfig?.AUTHENTICATOR_REFRESH_TOKEN_SECRET || generateRandomToken(64);
  const resetTokenSecret =
    envConfig?.AUTHENTICATOR_RESET_TOKEN_SECRET || generateRandomToken(64);
  const {
    protocol,
    domain,
    port,
    basePath: landlordBasePath,
  } = destructUrl(promptsConfig.landlordAppUrl);
  const { basePath: tenantBasePath } = destructUrl(promptsConfig.tenantAppUrl);
  const sendEmails = !!promptsConfig.mailgunConfig;
  const mailgunApiKey = promptsConfig.mailgunApiKey || '';
  const mailgunDomain = promptsConfig.mailgunDomain || '';
  const mailgunFromEmail = promptsConfig.mailgunFromEmail || '';
  const mailgunReplyToEmail = promptsConfig.mailgunReplyToEmail || '';
  const mailgunBccEmails = promptsConfig.mailgunBccEmails || '';
  const demoMode = promptsConfig.dbData === 'demo_data';
  const restoreDb = envConfig?.RESTORE_DB || demoMode;
  const dbName = demoMode ? 'demodb' : 'mre';
  const dbUrl = envConfig?.BASE_DB_URL || `mongodb://mongo/${dbName}`;
  const gatewayPort = envConfig?.GATEWAY_PORT || port || '8000';
  const corsEnabled = envConfig?.CORS_ENABLED === 'true';
  const domainUrl =
    envConfig?.DOMAIN_URL ||
    buildUrl({
      ...destructUrl(promptsConfig.landlordAppUrl),
      subDomain: null,
      port: null,
      basePath: null,
    });
  const apiUrl =
    envConfig?.API_URL ||
    buildUrl({
      protocol,
      domain,
      port: '${GATEWAY_PORT}',
      basePath: '/api/v2',
    });
  const landlordAppUrl =
    envConfig?.LANDLORD_APP_URL ||
    buildUrl({
      ...destructUrl(promptsConfig.landlordAppUrl),
      port: '${GATEWAY_PORT}',
    });
  const tenantAppUrl =
    envConfig?.TENANT_APP_URL ||
    buildUrl({
      ...destructUrl(promptsConfig.tenantAppUrl),
      port: '${GATEWAY_PORT}',
    });

  if (envConfig) {
    // delete env variables already taken in account in prompts
    delete envConfig.BASE_DB_URL;
    delete envConfig.CIPHER_KEY;
    delete envConfig.CIPHER_IV_KEY;
    delete envConfig.AUTHENTICATOR_TOKEN_DB_PASSWORD;
    delete envConfig.AUTHENTICATOR_ACCESS_TOKEN_SECRET;
    delete envConfig.AUTHENTICATOR_REFRESH_TOKEN_SECRET;
    delete envConfig.AUTHENTICATOR_RESET_TOKEN_SECRET;
    delete envConfig.ALLOW_SENDING_EMAILS;
    delete envConfig.MAILGUN_API_KEY;
    delete envConfig.MAILGUN_DOMAIN;
    delete envConfig.EMAIL_FROM;
    delete envConfig.EMAIL_REPLY_TO;
    delete envConfig.EMAIL_BCC;
    delete envConfig.DEMO_MODE;
    delete envConfig.RESTORE_DB;
    delete envConfig.GATEWAY_PORT;
    delete envConfig.CORS_ENABLED;
    delete envConfig.BASE_PATH;
    delete envConfig.APP_URL;
    delete envConfig.DOMAIN_URL;
    delete envConfig.API_URL;
    delete envConfig.LANDLORD_BASE_PATH;
    delete envConfig.LANDLORD_APP_URL;
    delete envConfig.TENANT_BASE_PATH;
    delete envConfig.TENANT_APP_URL;
  }

  const listCustomEnvVariables = envConfig ? Object.entries(envConfig) : [];
  const others = listCustomEnvVariables.length
    ? `## others
${Object.entries(envConfig)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n')}`
    : '';

  const content = `
## mongo
BASE_DB_URL=${dbUrl}
CIPHER_KEY=${cipherKey}
CIPHER_IV_KEY=${cipherIvKey}

## gateway
GATEWAY_PORT=${gatewayPort}
CORS_ENABLED=${corsEnabled}

## authenticator
AUTHENTICATOR_TOKEN_DB_PASSWORD=${tokenDbPassword}
AUTHENTICATOR_ACCESS_TOKEN_SECRET=${accessTokenSecret}
AUTHENTICATOR_REFRESH_TOKEN_SECRET=${refreshTokenSecret}
AUTHENTICATOR_RESET_TOKEN_SECRET=${resetTokenSecret}

## emailer
ALLOW_SENDING_EMAILS=${sendEmails}
MAILGUN_API_KEY=${mailgunApiKey}
MAILGUN_DOMAIN=${mailgunDomain}
EMAIL_FROM=${mailgunFromEmail}
EMAIL_REPLY_TO=${mailgunReplyToEmail}
EMAIL_BCC=${mailgunBccEmails}

## api
DEMO_MODE=${demoMode}
RESTORE_DB=${restoreDb}

## frontend
DOMAIN_URL=${domainUrl}
API_URL=${apiUrl}

## landlord frontend
LANDLORD_BASE_PATH=${landlordBasePath || ''}
LANDLORD_APP_URL=${landlordAppUrl}

## tenant frontend
TENANT_BASE_PATH=${tenantBasePath || ''}
TENANT_APP_URL=${tenantAppUrl}

${others}
`;
  fs.writeFileSync(path.resolve(process.cwd(), '.env'), content);
};

module.exports = {
  config,
  status,
  build,
  dev,
  start,
  stop,
  displayHeader,
  displayHelp,
  askForEnvironmentVariables,
  askRunMode,
  askBackupFile,
  writeDotEnv,
  restoreDB,
  dumpDB,
};
