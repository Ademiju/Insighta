const axios = require('axios');
const { getCredentials, saveCredentials, clearCredentials } = require('../utils/storage');

const BASE_URL = process.env.INSIGHTA_API_URL;

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  headers: { 'X-API-Version': '1' }
});

api.interceptors.request.use((config) => {
  const creds = getCredentials();
  if (creds && creds.access_token) {
    config.headers.Authorization = `Bearer ${creds.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config || {};
    const status = err.response && err.response.status;

    if ((status === 401 || status === 403) && !original._retry) {
      const creds = getCredentials();
      if (!creds || !creds.refresh_token) {
        clearCredentials();
        throw new Error('Authentication required. Run: insighta login');
      }

      original._retry = true;
      try {
        const refresh = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: creds.refresh_token
        });
        saveCredentials({ ...creds, ...refresh.data });
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${refresh.data.access_token}`;
        original.headers['X-API-Version'] = '1';
        return api(original);
      } catch (refreshErr) {
        clearCredentials();
        throw new Error('Session expired. Run: insighta login');
      }
    }

    const message = err.response && err.response.data && err.response.data.message
      ? err.response.data.message
      : err.message;
    throw new Error(message);
  }
);

api.BASE_URL = BASE_URL;
module.exports = api;
