const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const DIR = path.join(os.homedir(), '.insighta');
const FILE = path.join(DIR, 'credentials.json');

function saveCredentials(data) {
  fs.ensureDirSync(DIR);
  fs.writeJsonSync(FILE, data, { spaces: 2 });
}

function getCredentials() {
  if (!fs.existsSync(FILE)) return null;
  return fs.readJsonSync(FILE);
}

function clearCredentials() {
  if (fs.existsSync(FILE)) fs.removeSync(FILE);
}

module.exports = { saveCredentials, getCredentials, clearCredentials, FILE };
