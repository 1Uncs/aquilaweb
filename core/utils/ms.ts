export function ms(size: number, width = 375): number {
  const scale = Math.min(Math.max(width / 375, 0.82), 1.15);
  return Math.round(size * scale);
}
