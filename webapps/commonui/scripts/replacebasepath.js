const fs = require('fs');
const path = require('path');

replaceBasePath();

/**
 * Replaces /__MRE_BASE_PATH__ with the env BASE_PATH in all files in the .next directory.
 * This is necessary because the BASE_PATH is not known at build time.
 * Workaround of issue https://github.com/vercel/next.js/discussions/41769
 */
function replaceBasePath() {
  const BASE_PATH = process.env.BASE_PATH || '';
  // get all files in the .next directory
  const nextDir = path.join(__dirname, '.next');
  // add server.js to the list of files to replace
  const nextDirFiles = [path.join(__dirname, 'server.js')]; 
  // crawl nextDir and return all files
  _crawl(nextDir, nextDirFiles);

  // filter files which end with .js, .json, .html, .css, .map and trace file
  const nextDirFilesToReplace = nextDirFiles.filter(f => {
    const ext = path.extname(f);
    if (['.js', '.json', '.html', '.css', '.map'].includes(ext)) {
      return true;
    }
    const filename = path.basename(f);
    return filename === 'trace';
  });

  // replace /__MRE_BASE_PATH__ with the env BASE_PATH in all files in the .next directory
  nextDirFilesToReplace.forEach(f => {
    const fileContents = fs.readFileSync(f, 'utf8');
    let replaced = fileContents.replace(/\/__MRE_BASE_PATH__/g, BASE_PATH || '');
    replaced = replaced.replace(/%2F__MRE_BASE_PATH__/g, BASE_PATH || '');
    fs.writeFileSync(f, replaced);
  });
}

/**
 * Recursively crawls a directory and returns all files in the directory.
 * @param {string} dir 
 * @param {Array} nextDirFiles 
 */
function _crawl(dir, nextDirFiles) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      _crawl(filePath, nextDirFiles);
    } else {
      nextDirFiles.push(filePath);
    }
  });
}
