import { apiClient } from './client';

export async function watchAdForReward() {
  return apiClient.post('/rewards/watch-ad');
}

// Daily login bonus disabled ("No daily login rewards") - endpoint is
// commented out server-side too. Kept here, not deleted, in case it's
// re-enabled later.
// export async function claimDailyStreak() {
//   return apiClient.post('/rewards/daily-streak');
// }
