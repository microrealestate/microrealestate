const fs = require('fs');
const path = require('path');

createRuntimeEnvFile();

/**
 * Creates a runtime environment file for the browser.
 * Filters out environment variables that start with "NEXT_PUBLIC" from the process environment object,
 * and then writes them to a file named "__ENV.js" in the "public" directory.
 * The environment variables are written as a JSON object assigned to the "window.__ENV" property.
 */
function createRuntimeEnvFile() {
  const browserEnvVars = {
    NEXT_PUBLIC_APP_NAME: process.env.APP_NAME,
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_CORS_ENABLED: process.env.CORS_ENABLED,
    NEXT_PUBLIC_SIGNUP: process.env.SIGNUP,
    NEXT_PUBLIC_GATEWAY_URL: process.env.GATEWAY_URL,
    NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH,
    NEXT_PUBLIC_DEMO_MODE: process.env.DEMO_MODE,
  };

  let workingDir = process.cwd();
  // get working directory from command line
  const args = process.argv.slice(2);
  const pathIndex = args.indexOf('--path');
  if (pathIndex !== -1 && pathIndex + 1 < args.length) {
    workingDir = args[pathIndex + 1];
  }
  
  // write environment variables to file
  fs.writeFileSync(
    path.join(workingDir, 'public', '__ENV.js'),
    `window.__ENV = ${JSON.stringify(browserEnvVars, null, 2)}`
  );
}
