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
  config,
  askForEnvironmentVariables,
  writeDotEnv,
  restoreDB,
  dumpDB,
  askBackupFile,
} = require('./commands');

const argv = minimist(process.argv.slice(2));

const Main = async () => {
  process.on('SIGINT', () => {
    // do nothing on SIGINT to let the child process to handle the signal
  });

  const command = argv._.length ? argv._[0] : '';

  displayHeader();

  if (
    ![
      'build',
      'start',
      'stop',
      'dev',
      'status',
      'config',
      'restoredb',
      'dumpdb',
    ].includes(command)
  ) {
    return displayHelp();
  }

  if (fs.existsSync('.env')) {
    console.log('Found .env file and rely on it to run\n');
  } else {
    const envConfig = await askForEnvironmentVariables();
    writeDotEnv(envConfig);
  }

  switch (command) {
    case 'build':
      await stop();
      await build();
      break;
    case 'start':
      await start();
      break;
    case 'stop':
      await stop();
      break;
    case 'dev':
      await stop({ runMode: 'dev' });
      await dev();
      break;
    case 'status':
      await status();
      break;
    case 'config': {
      const { runConfig = 'prod' } = await askRunMode();
      await config(runConfig);
      break;
    }
    case 'restoredb': {
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
        console.error(chalk.red(error));
      }

      if (backupFiles.length === 0) {
        console.error(chalk.red('No dump files found in the backup directory'));
        return;
      }

      const { backupFile } = await askBackupFile(backupFiles);
      await restoreDB(backupFile);
      break;
    }
    case 'dumpdb':
      await dumpDB();
      break;
    default:
      displayHelp();
  }
};

Main();
