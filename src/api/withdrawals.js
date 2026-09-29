import { apiClient } from './client';

export async function requestWithdrawal(payload) {
  return apiClient.post('/withdrawals', payload);
}

export async function fetchMyWithdrawals() {
  const data = await apiClient.get('/withdrawals');
  return data.withdrawals;
}
