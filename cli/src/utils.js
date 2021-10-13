const crypto = require('crypto');
const clui = require('clui');
const chalk = require('chalk');
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

const Spinner = clui.Spinner;

const generateRandomToken = (size = 64) => {
  return crypto.randomBytes(size).toString('hex');
};

const removeEndLineBreak = (log) => {
  return log.replace(/\s$/g, '');
};

const runCommand = async (cmd, parameters = [], options = {}, waitLog = '') => {
  let spinner;
  if (waitLog) {
    spinner = new Spinner(waitLog);
    spinner.start();
  }
  return new Promise((resolve, reject) => {
    const errors = [];
    try {
      const shellCommand = spawn(cmd, parameters, {});

      shellCommand.stdout.on('data', (data) => {
        spinner && spinner.stop();
        console.log(removeEndLineBreak(data.toString()));
        spinner && spinner.start();
      });
      shellCommand.stderr.on('data', (data) => {
        if (options.logErrorsDuringExecution) {
          console.error(chalk.red(removeEndLineBreak(data.toString())));
        } else {
          errors.push(removeEndLineBreak(data.toString()));
        }
      });
      shellCommand.on('error', (data) => {
        if (options.logErrorsDuringExecution) {
          console.error(chalk.red(removeEndLineBreak(data.toString())));
        } else {
          errors.push(removeEndLineBreak(data.toString()));
        }
      });
      shellCommand.on('close', (exitCode) => {
        spinner && spinner.stop();
        if (exitCode !== 0 && errors.length) {
          errors.forEach((error) => console.error(chalk.red(error)));
        }

        if (exitCode !== 0) {
          reject(exitCode);
        } else {
          resolve(exitCode);
        }
      });
    } catch (error) {
      spinner && spinner.stop();
      console.error(chalk.red(error));
    }
  });
};

const runCompose = async (
  composeCmd,
  composeOptions = { runMode: 'dev' },
  commandOptions = { logErrorsDuringExecution: false },
  waitLog = ''
) => {
  dotenv.config(); // load .env config
  const env = dotenv.config({
    // complete environment variables with 'dev.env" or "prod.env"
    path: path.resolve(
      composeOptions.wd || process.cwd(),
      composeOptions.runMode === 'prod' ? 'prod.env' : 'dev.env'
    ),
  });
  dotenvExpand(env); // expand env variables which reference env variable

  const prodComposeArgs = [
    '-f',
    'docker-compose.microservices.base.yml',
    '-f',
    'docker-compose.microservices.prod.yml',
  ];
  const devComposeArgs = [
    '-f',
    'docker-compose.microservices.base.yml',
    '-f',
    'docker-compose.microservices.dev.yml',
  ];

  await runCommand(
    'docker-compose',
    [
      ...(composeOptions.runMode === 'prod' ? prodComposeArgs : devComposeArgs),
      ...composeCmd,
    ],
    commandOptions,
    waitLog
  );
};

module.exports = {
  generateRandomToken,
  runCompose,
};
