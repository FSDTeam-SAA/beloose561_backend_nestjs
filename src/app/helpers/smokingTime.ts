// Supports existing master values ("1 Hour") and app values ("60").
export function smokingTimeInMinutes(value?: string): number | undefined {
  if (!value) return undefined;
  const text = value.trim().toLowerCase();
  const number = text.match(/\d+(?:\.\d+)?/);
  if (!number) return undefined;
  const amount = Number(number[0]);
  return /hour|hr|\bh\b/.test(text) ? amount * 60 : amount;
}
