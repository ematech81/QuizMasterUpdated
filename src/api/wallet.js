import { apiClient } from './client';

export async function fetchWallet() {
  return apiClient.get('/wallet');
}

export async function fetchHistory(type, page = 1) {
  const params = [`page=${page}`];
  if (type) params.push(`type=${type}`);
  const data = await apiClient.get(`/wallet/history?${params.join('&')}`);
  return { attempts: data.attempts, hasMore: data.hasMore, total: data.total };
}
