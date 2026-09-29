import { apiClient, setToken, clearToken } from './client';

export async function signup({ email, username, password }) {
  const data = await apiClient.post('/auth/signup', { email, username, password }, { auth: false });
  await setToken(data.token);
  return data.user;
}

export async function login({ email, password }) {
  const data = await apiClient.post('/auth/login', { email, password }, { auth: false });
  await setToken(data.token);
  return data.user;
}

export async function fetchMe() {
  const data = await apiClient.get('/auth/me');
  return data.user;
}

export async function logout() {
  await clearToken();
}
