import axios from 'axios';

const TOKEN_KEY = 'subtrack_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/*
 * One configured Axios instance for the whole app.
 * In development Vite proxies "/api" to the Express server (see vite.config.js).
 * For a separate production API host, set VITE_API_URL in client/.env.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says our session is no longer valid, sign the user out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthAttempt = /\/auth\/(login|register)$/.test(error.config?.url || '');
    if (error.response?.status === 401 && !isAuthAttempt && tokenStorage.get()) {
      tokenStorage.clear();
      window.dispatchEvent(new Event('subtrack:unauthorized'));
    }
    return Promise.reject(error);
  },
);

/** Turns any request error into { message, fieldErrors } for display. */
export function parseApiError(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response) {
    const data = error.response.data || {};
    return {
      message: data.message || fallback,
      fieldErrors: data.errors || {},
      status: error.response.status,
    };
  }
  if (error?.code === 'ECONNABORTED') {
    return { message: 'The server took too long to respond. Please try again.', fieldErrors: {} };
  }
  if (error?.request) {
    return {
      message: "Can't reach the SubTrack server. Check that it's running and try again.",
      fieldErrors: {},
    };
  }
  return { message: fallback, fieldErrors: {} };
}

export default api;
