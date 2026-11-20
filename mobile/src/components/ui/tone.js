// Resolves a semantic tone ('primary', 'success', …) or a raw color to a color string.
export function toneColor(colors, tone) {
  if (!tone) return colors.primary;
  return colors[tone] || tone;
}

// '#RRGGBB' + alpha → 'rgba(r,g,b,a)'. Other formats are returned unchanged.
export function alpha(color, a) {
  if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) return color;
  const n = parseInt(color.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
