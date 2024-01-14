const chalk = require('chalk');
const fs = require('fs');
const minimist = require('minimist');
const path = require('path');
const {
  status,
  dev,
  stop,
  start,
  build,
  displayHelp,
  displayHeader,
  askRunMode,
  showConfig,
  askForEnvironmentVariables,
  writeDotEnv,
  restoreDB,
  dumpDB,
  askBackupFile,
  displayConfigWarningsAndErrors,
  ci,
} = require('./commands');
const { loadEnv } = require('./utils');

function getArgs() {
  const argv = minimist(process.argv.slice(2));
  const command = argv._.length ? argv._[0] : '';
  const helpArg = argv.h || argv.help;
  const serviceArg = argv.service || argv.s;

  // checks that serviceArg is passed only with the build command
  if (command !== 'build' && serviceArg) {
    console.error(
      chalk.red('The --service option is only available with the build command')
    );
    process.exit(1);
  }

  if (
    ![
      'build',
      'start',
      'stop',
      'dev',
      'ci',
      'status',
      'showconfig',
      'configure',
      'restoredb',
      'dumpdb',
    ].includes(command)
  ) {
    displayHelp();
    return process.exit(1);
  }

  return {
    command,
    helpArg,
    serviceArg,
  };
}

function migrateEnvConfig(envConfig) {
  if (envConfig?.BASE_DB_URL) {
    envConfig.MONGO_URL = envConfig.BASE_DB_URL;
    delete envConfig.BASE_DB_URL;
  }

  if (envConfig?.AUTHENTICATOR_TOKEN_DB_URL) {
    envConfig.REDIS_URL = envConfig.AUTHENTICATOR_TOKEN_DB_URL;
    delete envConfig.AUTHENTICATOR_TOKEN_DB_URL;
  }

  if (envConfig?.AUTHENTICATOR_TOKEN_DB_PASSWORD) {
    envConfig.REDIS_PASSWORD = envConfig.AUTHENTICATOR_TOKEN_DB_PASSWORD;
    delete envConfig.AUTHENTICATOR_TOKEN_DB_PASSWORD;
  }

  if (envConfig?.NGINX_PORT) {
    envConfig.GATEWAY_PORT = envConfig.NGINX_PORT;
    delete envConfig.NGINX_PORT;
  }

  if (envConfig?.GATEWAY_URL) {
    envConfig.GATEWAY_URL = envConfig.GATEWAY_URL.replace(/\/api\/v2$/, '');
  }

  return envConfig;
}

async function main() {
  process.on('SIGINT', () => {
    // do nothing on SIGINT to let the child process (docker-compose) to handle the signal
  });

  const { command, helpArg, serviceArg } = getArgs();

  if (helpArg) {
    displayHelp();
    return process.exit(0);
  }

  displayHeader();

  let envConfig;
  if (fs.existsSync(path.resolve(process.cwd(), '.env'))) {
    envConfig = migrateEnvConfig(
      loadEnv({ ignoreBaseEnv: true, ignoreProcessEnv: true })
    );
  }
  const promptsConfig = await askForEnvironmentVariables(
    envConfig,
    command === 'configure'
  );
  writeDotEnv(promptsConfig, envConfig);

  if (command === 'configure') {
    // as the env file has been updated, nothing else to do
    displayConfigWarningsAndErrors();
    return process.exit(0);
  }

  try {
    switch (command) {
      case 'build':
        await build({ service: serviceArg });
        break;
      case 'start':
        await start();
        break;
      case 'stop':
        await stop({ runMode: 'prod' });
        break;
      case 'dev':
        await stop({ runMode: 'dev' });
        await dev();
        break;
      case 'ci':
        await ci();
        break;
      case 'status':
        await status();
        break;
      case 'showconfig': {
        const { runMode = 'prod' } = await askRunMode();
        await showConfig(runMode);
        break;
      }
      case 'restoredb': {
        const { backupFile } = await askBackupFile();
        await restoreDB(backupFile);
        break;
      }
      case 'dumpdb':
        await dumpDB();
        break;
      default: // do nothing
    }
  } catch (error) {
    console.error(chalk.red(error.stack || error));
    process.exit(1);
  }
  process.exit(0);
}

main();
