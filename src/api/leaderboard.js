import { apiClient } from './client';

export async function fetchLeaderboard() {
  const data = await apiClient.get('/leaderboard');
  return data.leaderboard;
}
