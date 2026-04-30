const crypto = require('crypto');
const express = require('express');
const open = require('open');
const axios = require('axios');
const ora = require('ora');
const { saveCredentials, getCredentials, clearCredentials } = require('../utils/storage');

const BACKEND_URL = process.env.INSIGHTA_API_URL || 'http://localhost:8080';

function base64Url(buffer) {
  return Buffer.from(buffer).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest();
}

async function login() {
  const app = express();
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });

  const port = server.address().port;
  const state = base64Url(crypto.randomBytes(24));
  const codeVerifier = base64Url(crypto.randomBytes(64));
  const codeChallenge = base64Url(sha256(codeVerifier));
  const redirectUri = `http://127.0.0.1:${port}/callback`;
  const spinner = ora('Opening GitHub...').start();

  app.get('/callback', async (req, res) => {
    const { code, state: returnedState } = req.query;

    if (!code || returnedState !== state) {
      spinner.fail('Invalid OAuth callback');
      res.status(400).send('Invalid login callback. You can close this window.');
      server.close();
      return;
    }

    try {
      spinner.text = 'Completing login...';
      const tokenRes = await axios.post(`${BACKEND_URL}/auth/github/cli/callback`, {
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri
      });

      saveCredentials(tokenRes.data);
      spinner.succeed(`Logged in as @${tokenRes.data.username || 'github-user'}`);
      res.send('Login successful. You can close this window.');
      server.close();
    } catch (err) {
      const message = err.response && err.response.data && err.response.data.message ? err.response.data.message : err.message;
      spinner.fail(`Login failed: ${message}`);
      res.status(500).send('Login failed. You can close this window.');
      server.close();
    }
  });

  try {
    const authRes = await axios.get(`${BACKEND_URL}/auth/github/cli`, {
      params: { state, code_challenge: codeChallenge, redirect_uri: redirectUri }
    });
    await open(authRes.data.url);
    spinner.text = 'Waiting for GitHub callback...';
  } catch (err) {
    spinner.fail(`Unable to start login: ${err.message}`);
    server.close();
  }
}

async function logout() {
  const creds = getCredentials();
  if (creds && creds.refresh_token) {
    try {
      await axios.post(`${BACKEND_URL}/auth/logout`, { refresh_token: creds.refresh_token });
    } catch (_) {}
  }
  clearCredentials();
  console.log('Logged out');
}

function whoami() {
  const creds = getCredentials();
  if (!creds) {
    console.log('Not logged in');
    return;
  }
  console.log(`Logged in as @${creds.username || 'github-user'} (${creds.role || 'analyst'})`);
}

module.exports = { login, logout, whoami };
