const fs = require('fs');

require('./replacebasepath');
if (fs.existsSync('generateruntimeenvfile.js')) {
  require('./generateruntimeenvfile');
}

// server.js file is generated at build time by nextjs (see .next/standalone/webapps/XXXXX/server.js)
require('./server');
