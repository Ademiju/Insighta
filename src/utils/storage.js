const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const DIR = path.join(os.homedir(), '.insighta');
const FILE = path.join(DIR, 'credentials.json');

function saveCredentials(data) {
  if (!data || !data.access_token || !data.refresh_token) {
    throw new Error('Invalid credentials received');
  }

  fs.ensureDirSync(DIR);

  // Write to temp file first (prevents corruption)
  const tempFile = `${FILE}.tmp`;

  fs.writeJsonSync(tempFile, data, { spaces: 2 });

  // Move into place atomically
  fs.moveSync(tempFile, FILE, { overwrite: true });

  // Restrict permissions (important!)
  try {
    fs.chmodSync(FILE, 0o600); // owner read/write only
  } catch (err) {
    // Windows may ignore this, that's fine
  }
}

function getCredentials() {
  try {
    if (!fs.existsSync(FILE)) return null;

    const data = fs.readJsonSync(FILE);

    // basic validation
    if (!data?.access_token || !data?.refresh_token) {
      throw new Error('Invalid credentials format');
    }

    return data;
  } catch (err) {
    // corrupted or invalid → clean up
    try {
      fs.removeSync(FILE);
    } catch {}

    return null;
  }
}

function clearCredentials() {
  try {
    if (fs.existsSync(FILE)) {
      fs.removeSync(FILE);
    }
  } catch (err) {
    // optional: log or ignore
  }
}

module.exports = { saveCredentials, getCredentials, clearCredentials, FILE };
