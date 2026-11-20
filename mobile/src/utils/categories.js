// Icon and tint for each service category, matched on slug or name.
const META = {
  cleaning: { icon: 'sparkles', tone: 'teal' },
  plumbing: { icon: 'water', tone: 'primary' },
  electrical: { icon: 'flash', tone: 'warning' },
  gardening: { icon: 'leaf', tone: 'success' },
  moving: { icon: 'cube', tone: 'indigo' },
  painting: { icon: 'color-palette', tone: 'pink' },
  carpentry: { icon: 'hammer', tone: 'accent' },
  'appliance-repair': { icon: 'construct', tone: 'purple' },
  hvac: { icon: 'thermometer', tone: 'info' },
  landscaping: { icon: 'leaf', tone: 'success' },
  tutoring: { icon: 'school', tone: 'indigo' },
};

const FALLBACK = { icon: 'build', tone: 'primary' };

export function categoryMeta(slugOrName) {
  if (!slugOrName) return FALLBACK;
  const key = String(slugOrName).toLowerCase().trim().replace(/\s+/g, '-');
  return META[key] || FALLBACK;
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function money(value, { decimals = 0 } = {}) {
  const n = parseFloat(value) || 0;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
}
