// Points are always whole numbers server-side, but guard against stray
// decimals from older cached state and format consistently everywhere.
export function formatPoints(value) {
  return Math.round(value || 0);
}
