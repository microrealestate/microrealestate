const fs = require('fs');
const path = require('path');

/**
 * Creates a runtime environment file for the browser.
 * Filters out environment variables that start with "NEXT_PUBLIC" from the process environment object,
 * and then writes them to a file named "__ENV.js" in the "public" directory.
 * The environment variables are written as a JSON object assigned to the "window.__ENV" property.
 */
function createRuntimeEnvFile() {
  const browserEnvVars = Object.keys(process.env)
    .filter((key) => key.startsWith('NEXT_PUBLIC'))
    .reduce(
      (acc, key) => ({
        ...acc,
        [key]: process.env[key],
      }),
      {}
    );

  fs.writeFileSync(
    path.join(process.cwd(), 'public', '__ENV.js'),
    `window.__ENV = ${JSON.stringify(browserEnvVars)}`
  );
}

createRuntimeEnvFile();
