const fs = require('fs');
const minimist = require('minimist');
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
} = require('./commands');

const argv = minimist(process.argv.slice(2));

const Main = async () => {
  process.on('SIGINT', () => {
    // do nothing on SIGINT to let the child process to handle the signal
  });

  const command = argv._.length ? argv._[0] : '';

  displayHeader();

  if (
    !['build', 'start', 'stop', 'dev', 'status', 'config'].includes(command)
  ) {
    return displayHelp();
  }

  if (fs.existsSync('.env')) {
    console.log('Found .env file and rely on it to run\n');
  } else {
    const envConfig = await askForEnvironmentVariables();
    writeDotEnv(envConfig);
  }
  let runConfig = { runMode: 'prod' };

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
    case 'config':
      runConfig = await askRunMode();
      await config(runConfig);
      break;
    default:
      displayHelp();
  }
};

Main();
