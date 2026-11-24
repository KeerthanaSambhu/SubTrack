/**
 * API endpoints — every call goes to the Express backend (and so to MongoDB)
 * through the shared Axios client in ./client.js.
 *
 * The server always replies { success, data, message? }. Each function returns
 * just `data`, so components receive e.g. { user, token } or { subscriptions }.
 * Errors are thrown as Axios errors; turn them into messages with parseApiError().
 * There is deliberately no offline fallback: if the API is down, the UI shows
 * an error instead of fake data.
 */
import api from './client';

const unwrap = (response) => response.data.data;

export const authApi = {
  register: (details) => api.post('/auth/register', details).then(unwrap),
  login: (credentials) => api.post('/auth/login', credentials).then(unwrap),
  me: () => api.get('/auth/me').then(unwrap),
};

export const userApi = {
  updateProfile: (updates) => api.patch('/users/me', updates).then(unwrap),
  changePassword: (passwords) => api.patch('/users/me/password', passwords).then(unwrap),
};

export const subscriptionApi = {
  list: () => api.get('/subscriptions').then(unwrap),
  get: (id) => api.get(`/subscriptions/${id}`).then(unwrap),
  create: (payload) => api.post('/subscriptions', payload).then(unwrap),
  update: (id, payload) => api.patch(`/subscriptions/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/subscriptions/${id}`).then(unwrap),
};
