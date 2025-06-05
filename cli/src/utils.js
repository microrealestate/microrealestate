const crypto = require('crypto');
const fs = require('fs');
const chalk = require('chalk');
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const which = require('which');
const https = require('https');
const http = require('http');

function generateRandomToken(size = 64) {
  return crypto.randomBytes(size).toString('hex');
}

function loadEnv(args) {
  const { ignoreBaseEnv = false, ignoreProcessEnv = false } = args || {};

  let baseEnv = {};
  if (!ignoreBaseEnv) {
    const baseEnvFile = path.resolve(process.cwd(), 'base.env');
    baseEnv = dotenv.parse(fs.readFileSync(baseEnvFile));
  }

  const envFile = path.resolve(process.cwd(), '.env');
  const env = dotenv.parse(fs.readFileSync(envFile));

  return dotenvExpand.expand({
    ignoreProcessEnv,
    parsed: { ...baseEnv, ...env }
  }).parsed;
}

async function runCommand(cmd, parameters = []) {
  return new Promise((resolve, reject) => {
    try {
      const shellCommand = spawn(cmd, parameters, {
        stdio: 'inherit'
      });

      shellCommand.on('close', (exitCode) => {
        if (exitCode !== 0) {
          reject(exitCode);
        } else {
          resolve(exitCode);
        }
      });
    } catch (error) {
      console.error(chalk.red(error.stack || error));
      reject(1);
    }
  });
}

async function findCRI() {
  // Resolve the CRI to be used
  if (await which('docker-compose', { nothrow: true })) {
    return ['docker-compose'];
  }

  if (await which('docker', { nothrow: true })) {
    return ['docker', 'compose'];
  }

  if (await which('podman-compose', { nothrow: true })) {
    return ['podman-compose'];
  }

  if (await which('podman', { nothrow: true })) {
    return ['podman', 'compose'];
  }

  throw new Error('Cannot find a valid runtime to run containers');
}

function getBackupPath() {
  // Path when run from npm
  let backupPath = path.resolve(__dirname, '..', '..', 'backup');
  if (!fs.existsSync(backupPath)) {
    // Path when run from the mre binary
    backupPath = path.resolve(process.execPath, '..', 'backup');
  }
  if (!fs.existsSync(backupPath)) {
    throw new Error(
      'Cannot find backup path check if the backup folder exists. Ensure you are running the command from the root of the project.'
    );
  }
  return backupPath;
}

function getComposeActions(cri, action) {
  // default docker compose action commands
  const composeActions = {
    start: ['up', '-d', '--force-recreate', '--remove-orphans'],
    ci: ['up', '-d', '--force-recreate', '--remove-orphans'],
    dev: ['up', '--build', '--force-recreate', '--remove-orphans'],
    build: ['build', '--no-cache'],
    stop: ['down', '--remove-orphans', '--volumes'],
    status: ['ps'],
    config: ['config'],
    run: ['run']
  };

  // Not useful for now
  // overloading actions when different in podman
  // if (['podman', 'podman-compose'].includes(cri)) {
  //   composeActions['build'] = ['build', '--no-cache'];
  // }

  return composeActions[action];
}

async function runCompose(
  composeAction,
  composeArgs,
  composeOptions = { runMode: 'dev' }
) {
  const prodComposeArgs = [
    '-f',
    'docker-compose.microservices.base.yml',
    '-f',
    'docker-compose.microservices.prod.yml'
  ];
  const devComposeArgs = [
    '-f',
    'docker-compose.microservices.base.yml',
    '-f',
    'docker-compose.microservices.dev.yml'
  ];
  const ciComposeArgs = [
    '-f',
    'docker-compose.microservices.base.yml',
    '-f',
    'docker-compose.microservices.test.yml'
  ];

  let composeFilesArgs = devComposeArgs;
  if (composeOptions.runMode === 'prod') {
    composeFilesArgs = prodComposeArgs;
  } else if (composeOptions.runMode === 'ci') {
    composeFilesArgs = ciComposeArgs;
  }

  // set BUILDKIT environment variable
  if (['build', 'dev'].includes(composeAction)) {
    process.env.BUILDKIT_PROGRESS = 'plain';
  }

  // set NODE_ENV environment variable according to runMode
  process.env.NODE_ENV = 'development';
  if (composeOptions.runMode === 'prod') {
    process.env.NODE_ENV = 'production';
  } else if (composeOptions.runMode === 'ci') {
    process.env.NODE_ENV = 'test';
  }

  const baseCmd = await findCRI();

  const actionArgs = getComposeActions(baseCmd[0], composeAction);
  if (!actionArgs) {
    return;
  }

  await runCommand(baseCmd[0], [
    ...baseCmd.slice(1),
    ...composeFilesArgs,
    ...actionArgs,
    ...composeArgs
  ]);
}

function validEmail(email) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

function destructUrl(baseUrl) {
  const url = new URL(baseUrl);
  let subDomain;
  let domain = url.hostname;

  if (!/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/.test(url.hostname)) {
    // avoid the split if hostname is an IP address
    const canonicalHostname = url.hostname.split('.');
    if (canonicalHostname.length >= 3) {
      subDomain = canonicalHostname.slice(0, -2).join('.');
      domain = `${canonicalHostname.at(-2)}.${canonicalHostname.at(-1)}`;
    }
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
    basePath
  };
}

function buildUrl({ protocol, subDomain, domain, port, basePath }) {
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
}

/**
 * Temporary minimum fetch function
 */
async function fetch(endpoint) {
  const url = new URL(endpoint);
  const requester = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    requester
      .get(endpoint, (res) => {
        const data = [];

        res.on('data', (chunk) => {
          data.push(chunk);
        });

        res.on('end', () => {
          const response = {
            status: res.statusCode,
            statusText: Buffer.concat(data).toString()
          };
          if (res.statusCode !== 200) {
            reject(response);
          } else {
            resolve(response);
          }
        });
      })
      .on('error', (err) => {
        reject({ status: 400, statusText: err.message });
      });
  });
}

async function consoleMoveCursorToPrevLine(countLine) {
  if (!process.stdout) {
    return;
  }

  for (let count = 0; count < countLine; count++) {
    await new Promise((resolve) => process.stdout.moveCursor(0, -1, resolve));
    await new Promise((resolve) => process.stdout.clearLine(0, resolve));
  }
}

module.exports = {
  generateRandomToken,
  loadEnv,
  runCompose,
  validEmail,
  getBackupPath,
  destructUrl,
  buildUrl,
  fetch,
  consoleMoveCursorToPrevLine
};
