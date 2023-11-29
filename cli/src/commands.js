const fs = require('fs');
const path = require('path');
const clear = require('clear');
const chalk = require('chalk');
const figlet = require('figlet');
const inquirer = require('inquirer');
const moment = require('moment');
const { buildUrl, destructUrl } = require('@microrealestate/common/utils/url');
const { generateRandomToken, runCompose, loadEnv } = require('./utils');

function initDirectories() {
  const mongoDir = path.join('.', 'data', 'mongodb');
  if (!fs.existsSync(mongoDir)) {
    fs.mkdirSync(mongoDir, { recursive: true });
  }
}

function displayHeader() {
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
      'The application designed to assist landlords in managing their properties and rentals'
    )
  );
  console.log('');
}

async function build({ service = 'all' }) {
  const composeArgs = [];
  //composeArgs.push('--quiet'); // commented to display the build logs

  if (service !== 'all') {
    composeArgs.push(service);
  }

  await runCompose(
    'build',
    composeArgs,
    { runMode: 'prod' },
    {
      waitLog: 'building containers...',
    }
  );

  console.log(chalk.green('build completed'));
}

async function start() {
  loadEnv();

  initDirectories();

  await runCompose(
    'start',
    [],
    { runMode: 'prod' },
    {
      waitLog: 'starting the application...',
    }
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
}

async function stop({ runMode = 'prod' }) {
  loadEnv();

  await runCompose(
    'stop',
    [],
    { runMode },
    { waitLog: 'stopping current running application...' }
  );
}

async function dev() {
  loadEnv();

  initDirectories();

  await runCompose(
    'dev',
    [],
    {
      runMode: 'dev',
    },
    {
      logErrorsDuringExecution: true,
    }
  );
}

async function status() {
  loadEnv();

  await runCompose(
    'status',
    [],
    {
      runMode: 'prod',
    },
    {
      logErrorsDuringExecution: true,
    }
  );
}

async function config(runMode) {
  loadEnv();

  await runCompose(
    'config',
    [],
    {
      runMode,
    },
    {
      logErrorsDuringExecution: true,
    }
  );
}

async function restoreDB(backupFile) {
  loadEnv();

  const connectionString = process.env.MONGO_URL;
  const archiveFile = path.join('backup', backupFile);

  await runCompose(
    'run',
    [
      'mongo',
      '/usr/bin/mongorestore',
      `--uri=${connectionString}`,
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
}

async function dumpDB() {
  loadEnv();

  const connectionString = process.env.MONGO_URL;
  const dbUrl = new URL(connectionString);
  const dbName = dbUrl.pathname.slice(1);
  const timeStamp = moment().format('YYYYMMDDHHmm');
  const archiveFile = path.join('backup', `${dbName}-${timeStamp}.dump`);

  await runCompose(
    'run',
    [
      'mongo',
      '/usr/bin/mongodump',
      `--uri=${connectionString}`,
      '--gzip',
      `--archive=${archiveFile}`,
    ],
    {},
    {
      logErrorsDuringExecution: true,
      waitLog: 'dumping database...',
    }
  );
}

function displayHelp() {
  const commands = [
    {
      name: 'dev',
      description: 'Start the application in development mode',
    },
    {
      name: 'build',
      description: 'Build the application for production',
      options: [
        {
          name: '--service',
          description: 'Build only one service',
        },
      ],
    },
    {
      name: 'start',
      description:
        'Start the application in production mode (build command has to be run first)',
    },
    {
      name: 'stop',
      description: 'Stop the application running in production mode',
    },
    {
      name: 'status',
      description: 'Display the status of the application',
    },
    {
      name: 'config',
      description: 'Display the configuration of the application',
    },
    {
      name: 'restoredb',
      description:
        'Restore the database from a backup file located in /backup. The application has to be started to run this command.',
    },
    {
      name: 'dumpdb',
      description:
        'Dump the database to a backup file located in /backup. The application has to be started to run this command.',
    },
  ];

  console.log(
    chalk.white(
      `Usage: mre [option...] {${commands.map(({ name }) => name).join('|')}}`
    )
  );
  console.log('');
  console.log(chalk.white('Options:'));
  console.log('');
  console.log(
    chalk.white(`  ${'-h, --help'.padEnd(20, ' ')}Display help for command`)
  );
  console.log('');
  console.log(chalk.white('Commands:'));
  console.log('');
  commands.map((command) => {
    // display the command name and description
    console.log(
      chalk.white(`  ${command.name.padEnd(20, ' ')}${command.description}`)
    );

    // display the options for each command
    if (command.options) {
      command.options.map((option) => {
        console.log(
          chalk.white(`    ${option.name.padEnd(20, ' ')}${option.description}`)
        );
      });
    }
  });
}

function askForEnvironmentVariables(envConfig) {
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
}

function askRunMode() {
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
}

function askBackupFile() {
  const backupFiles = [];
  try {
    const files = fs.readdirSync(
      path.resolve(process.execPath, '..', 'backup')
    );
    files
      .filter((file) => file.endsWith('.dump'))
      .forEach((file) => {
        backupFiles.push(file);
      });
  } catch (error) {
    console.error(chalk.red(error.stack || error));
  }

  if (backupFiles.length === 0) {
    console.error(chalk.red('No dump files found in the backup directory'));
    return;
  }

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
}

function writeDotEnv(promptsConfig, envConfig) {
  // init variables that have to be overwritten
  const cipherKey = envConfig?.CIPHER_KEY || generateRandomToken(32);
  const cipherIvKey = envConfig?.CIPHER_IV_KEY || generateRandomToken(32);
  const tokenDbPassword = envConfig?.REDIS_PASSWORD || generateRandomToken(64);
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
  const dbUrl = envConfig?.MONGO_URL || `mongodb://mongo/${dbName}`;
  const gatewayPort = envConfig?.GATEWAY_PORT || port || '80';
  const corsEnabled = envConfig?.CORS_ENABLED === 'true';
  const domainUrl =
    envConfig?.DOMAIN_URL ||
    buildUrl({
      ...destructUrl(promptsConfig.landlordAppUrl),
      subDomain: null,
      port: null,
      basePath: null,
    });
  const gatewayUrl =
    envConfig?.GATEWAY_URL ||
    buildUrl({
      protocol,
      domain,
      port: gatewayPort !== '80' ? '${GATEWAY_PORT}' : null,
      basePath: '/api/v2',
    });
  const landlordAppUrl =
    envConfig?.LANDLORD_APP_URL ||
    buildUrl({
      ...destructUrl(promptsConfig.landlordAppUrl),
      port: gatewayPort !== '80' ? '${GATEWAY_PORT}' : null,
    });
  const tenantAppUrl =
    envConfig?.TENANT_APP_URL ||
    buildUrl({
      ...destructUrl(promptsConfig.tenantAppUrl),
      port: gatewayPort !== '80' ? '${GATEWAY_PORT}' : null,
    });

  // delete env variables already taken in account in prompts
  // to keep the ones set manually in the .env file (others)
  if (envConfig) {
    delete envConfig.MONGO_URL;
    delete envConfig.CIPHER_KEY;
    delete envConfig.CIPHER_IV_KEY;
    delete envConfig.REDIS_PASSWORD;
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
    delete envConfig.GATEWAY_URL;
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

  // .env file content
  const content = `
###############################################################################
##                                                                           ##
##  The environment variables below overwrite the ones in the base.env file. ##
##  The MRE application uses the merge of the base.env and .env files.       ##
##                                                                           ##
##  /!\\ The secrets and tokens have to be backed up otherwise you will not   ##
##  be able to log in to the application, to access data from third-parties  ##
##  (e.g. Mailgun, Blackblaze, etc.) or to decrypt data from the database.   ##
##                                                                           ##
##  /!\\ The .env file is not versioned and should not be committed as it     ##
##  contains sensitive data (e.g. passwords, API keys, etc.).                ##
##                                                                           ##
############################################################################### 

## Redis
REDIS_PASSWORD=${tokenDbPassword}

## Mongo
MONGO_URL=${dbUrl}

## CIPHER to encrypt/decrypt third-party tokens (e.g. Mailgun API key, Blackblaze API key, etc.)
CIPHER_KEY=${cipherKey}
CIPHER_IV_KEY=${cipherIvKey}

## gateway
GATEWAY_PORT=${gatewayPort}
CORS_ENABLED=${corsEnabled}
DOMAIN_URL=${domainUrl}
GATEWAY_URL=${gatewayUrl}

## authenticator
AUTHENTICATOR_ACCESS_TOKEN_SECRET=${accessTokenSecret}
AUTHENTICATOR_REFRESH_TOKEN_SECRET=${refreshTokenSecret}
AUTHENTICATOR_RESET_TOKEN_SECRET=${resetTokenSecret}

## emailer
# General Mailgun configuration to send emails for forgot password, welcome, etc.
ALLOW_SENDING_EMAILS=${sendEmails}
MAILGUN_API_KEY=${mailgunApiKey}
MAILGUN_DOMAIN=${mailgunDomain}
EMAIL_FROM=${mailgunFromEmail}
EMAIL_REPLY_TO=${mailgunReplyToEmail}
EMAIL_BCC=${mailgunBccEmails}

## api
DEMO_MODE=${demoMode}
RESTORE_DB=${restoreDb}

## landlord frontend
LANDLORD_BASE_PATH=${landlordBasePath || ''}
LANDLORD_APP_URL=${landlordAppUrl}

## tenant frontend
TENANT_BASE_PATH=${tenantBasePath || ''}
TENANT_APP_URL=${tenantAppUrl}

${others}
`;
  fs.writeFileSync(path.resolve(process.cwd(), '.env'), content);
}

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
