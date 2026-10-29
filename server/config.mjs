export function callLimit(raw = '20') {
  const value = Number(raw);
  if (String(raw).trim() === '' || !Number.isSafeInteger(value) || value < 0 || value > 100) throw new Error('META_MAX_CALLS must be an integer from 0 to 100');
  return value;
}
