import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import { SeedClient } from './seed/client.js';

export { seedDemo, seedDev } from './seed/index.js';

export type ResetDataOptions = { url: string };

export async function resetData(options: ResetDataOptions) {
  const client = new SeedClient(options.url);

  console.log(chalk.dim(`target ${options.url}`));
  console.log(
    chalk.yellow(
      'Resetting the database: accounts, organizations, properties, tenants, leases, documents and every redis key are dropped. This is irreversible — no data will be seeded afterwards.'
    )
  );
  await client.reset();
  console.log(`${chalk.green('reset')} database emptied`);
}

export function displayHeader() {
  clear();
  console.log(
    figlet.textSync('MicroRealEstate', {
      horizontalLayout: 'fitted'
    })
  );
  console.log(
    chalk.dim(
      'The application designed to assist landlords in managing their properties and rentals'
    )
  );
  console.log('');
}

export function displayHelp() {
  const commands = [
    {
      name: 'seeddemo',
      description:
        'Create demo data (organization, contract, document templates, properties, tenants, lease documents, rent payments) through the api. Empties the database first unless --keep is passed. The application has to be started to run this command.'
    },
    {
      name: 'seeddev',
      description:
        'Same as seeddemo, then configure the organization to use the smtp4dev service of the DEV environment. The application has to be started in DEV mode to run this command.'
    },
    {
      name: 'resetdata',
      description:
        'Drop the database contents (accounts, organizations, properties, tenants, leases, documents and every redis key) through the api. Does not seed anything afterwards — the instance is left empty. The application has to be started (in DEV or CI mode) to run this command: the reset endpoint is only exposed when the gateway does not run in production mode.'
    }
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
  console.log(
    chalk.white(
      `  ${'--keep'.padEnd(20, ' ')}Do not empty the database before seeding`
    )
  );
  console.log(
    chalk.white(
      `  ${'--url=<url>'.padEnd(20, ' ')}Application url, defaults to http://localhost:8080`
    )
  );
  console.log('');
  console.log(chalk.white('Commands:'));
  console.log('');
  commands.forEach((command) => {
    // display the command name and description
    console.log(
      chalk.white(`  ${command.name.padEnd(20, ' ')}${command.description}`)
    );
  });
}
