import chalk from 'chalk';
import minimist from 'minimist';
import {
  displayHeader,
  displayHelp,
  resetData,
  seedDemo,
  seedDev
} from './commands.js';

const DEFAULT_APP_URL = 'http://localhost:8080';

function getArgs(): {
  command: string;
  helpArg: boolean;
  keep: boolean;
  url: string;
} {
  const argv = minimist(process.argv.slice(2));
  const command = argv._.length ? argv._[0] || '' : '';
  const helpArg: boolean = !!(argv.h || argv.help);

  if (!['seeddemo', 'seeddev', 'resetdata'].includes(command)) {
    displayHelp();
    return process.exit(1);
  }

  return {
    command,
    helpArg,
    keep: !!argv.keep,
    url: typeof argv.url === 'string' ? argv.url : DEFAULT_APP_URL
  };
}

async function main() {
  const { command, helpArg, keep, url } = getArgs();

  if (helpArg) {
    displayHelp();
    return process.exit(0);
  }

  displayHeader();

  try {
    switch (command) {
      case 'seeddemo':
        await seedDemo({ url, keep });
        break;
      case 'seeddev':
        await seedDev({ url, keep });
        break;
      case 'resetdata':
        await resetData({ url });
        break;
      default: // do nothing
    }
  } catch (err) {
    const error = err as Error;
    console.error(chalk.red(error.message), chalk.red(error.stack));
    process.exit(1);
  }
  process.exit(0);
}

main();
