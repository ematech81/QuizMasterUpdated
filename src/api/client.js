import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@quizmaster_auth_token';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function getToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export async function setToken(token) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new ApiError(
      'Could not reach the server. Check your connection and try again.',
      0
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // no JSON body
  }

  if (!response.ok) {
    throw new ApiError(data?.message || 'Something went wrong. Please try again.', response.status);
  }

  return data;
}

export const apiClient = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
};
