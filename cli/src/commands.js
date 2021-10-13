const fs = require('fs');
const path = require('path');
const clear = require('clear');
const chalk = require('chalk');
const figlet = require('figlet');
const inquirer = require('inquirer');
const { generateRandomToken, runCompose } = require('./utils');

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
      ['build', '--no-cache'],
      { runMode: 'prod' },
      {},
      'building containers...'
    );

    console.log(chalk.green('build completed'));
  } catch (error) {
    console.log(chalk.red(error));
  }
};

const start = async () => {
  try {
    initDirectories();
    await runCompose(
      ['up', '-d', '--force-recreate', '--remove-orphans'],
      { runMode: 'prod' },
      {},
      'starting the application...'
    );

    console.log(
      chalk.green(
        `Front-end ready and accessible on http://localhost:${process.env.NGINX_PORT}/app`
      )
    );
  } catch (error) {
    console.log(chalk.red(error));
  }
};

const stop = async (runConfig = { runMode: 'prod' }) => {
  try {
    await runCompose(
      ['rm', '--stop', '--force'],
      { runMode: runConfig.runMode },
      {},
      'stopping current running application...'
    );
  } catch (error) {
    console.log(chalk.red(error));
  }
};

const dev = async () => {
  try {
    initDirectories();
    await runCompose(
      ['up', '--build', '--remove-orphans'],
      {
        runMode: 'dev',
      },
      {
        logErrorsDuringExecution: true,
      }
    );
  } catch (error) {
    console.log(chalk.red(error));
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
    console.log(chalk.red(error));
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
    console.log(chalk.red(error));
  }
};

const displayHelp = () => {
  console.log(
    chalk.white('Usage: mre [option...] {dev|build|status|start|stop|config}')
  );
};

const askForEnvironmentVariables = () => {
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
  ];
  return inquirer.prompt(questions);
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

const writeDotEnv = (config) => {
  const cipherKey = generateRandomToken(32);
  const cipherIvKey = generateRandomToken(32);
  const tokenDbPassword = generateRandomToken(64);
  const accessTokenSecret = generateRandomToken(64);
  const refreshTokenSecret = generateRandomToken(64);
  const resetTokenSecret = generateRandomToken(64);
  const mailgunApiKey = config.mailgunApiKey || '';
  const mailgunDomain = config.mailgunDomain || '';
  const mailgunFromEmail = config.mailgunFromEmail || '';
  const mailgunReplyToEmail = config.mailgunReplyToEmail || '';
  const mailgunBccEmails = config.mailgunBccEmails || '';
  const demoMode = config.dbData === 'demo_data';
  const restoreDb = demoMode;
  const dbName = demoMode ? 'demodb' : 'mre';
  const sendEmails = !!config.mailgunConfig;
  const content = `
## mongo
BASE_DB_URL=mongodb://mongo/${dbName}
CIPHER_KEY=${cipherKey}
CIPHER_IV_KEY=${cipherIvKey}

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
`;
  fs.writeFileSync('.env', content);
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
  writeDotEnv,
};
