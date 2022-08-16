const crypto = require('crypto');
const clui = require('clui');
const fs = require('fs');
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

const parseEnv = (wd) => {
  const dotEnvFilePath = path.resolve(wd || process.cwd(), '.env');
  const env = dotenv.parse(fs.readFileSync(dotEnvFilePath));

  return dotenvExpand.expand({ ignoreProcessEnv: true, parsed: env }).parsed;
};

const loadEnv = (wd, runMode) => {
  dotenv.config(); // load .env config
  const env = dotenv.config({
    // complete environment variables with 'dev.env" or "prod.env"
    path: path.resolve(
      wd || process.cwd(),
      runMode === 'prod' ? 'prod.env' : 'dev.env'
    ),
  });
  dotenvExpand.expand(env); // expand env variables which reference env variable
};

const runCommand = async (cmd, parameters = [], options = {}) => {
  let spinner;
  if (options.waitLog) {
    spinner = new Spinner(options.waitLog);
    spinner.start();
  }
  return new Promise((resolve, reject) => {
    const errors = [];
    try {
      const shellCommand = spawn(cmd, parameters, {});

      shellCommand.stdout.on('data', (data) => {
        spinner?.stop();
        console.log(removeEndLineBreak(data.toString()));
        spinner?.start();
      });
      shellCommand.stderr.on('data', (data) => {
        if (options.noErrorsOnStdErr) {
          spinner?.stop();
          console.log(removeEndLineBreak(data.toString()));
          spinner?.start();
          return;
        }

        if (options.logErrorsDuringExecution) {
          spinner?.stop();
          console.error(chalk.red(removeEndLineBreak(data.toString())));
          spinner?.start();
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
        spinner?.stop();
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
      spinner?.stop();
      console.error(chalk.red(error));
    }
  });
};

const runCompose = async (
  composeCmd,
  composeOptions = { runMode: 'dev' },
  commandOptions = { logErrorsDuringExecution: false }
) => {
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
    '-f',
    'docker-compose.microservices.test.yml',
  ];

  loadEnv(composeOptions.wd, composeOptions.runMode);
  await runCommand(
    'docker-compose',
    [
      ...(composeOptions.runMode === 'prod' ? prodComposeArgs : devComposeArgs),
      ...composeCmd,
    ],
    { ...commandOptions, noErrorsOnStdErr: true } // noErrorsOnStdErr see https://github.com/docker/compose/issues/6078
  );
};

const destructUrl = (baseUrl) => {
  const url = new URL(baseUrl);
  const canonicalHostname = url.hostname.split('.');
  let subDomain;
  let domain = url.hostname;
  if (canonicalHostname.length >= 3) {
    subDomain = canonicalHostname.slice(0, -2).join('.');
    domain = `${canonicalHostname.at(-2)}.${canonicalHostname.at(-1)}`;
  }
  let basePath;
  if (url.pathname !== '/') {
    basePath = url.pathname;
  }

  return {
    protocol: url.protocol,
    subDomain,
    domain,
    port: url.port,
    basePath,
  };
};

const buildUrl = ({ protocol, subDomain, domain, port, basePath }) => {
  let url = `${protocol}//`;
  if (subDomain) {
    url += `${subDomain}.`;
  }
  url += `${domain}`;
  if (port) {
    url += `:${port}`;
  }
  if (basePath) {
    url += basePath;
  }
  return url;
};

module.exports = {
  generateRandomToken,
  loadEnv,
  parseEnv,
  runCompose,
  destructUrl,
  buildUrl,
};
