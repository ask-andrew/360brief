export function isAuthDebug(): boolean {
  if (typeof process === 'undefined') return false;
  const v = process.env.NEXT_PUBLIC_DEBUG_AUTH;
  return v === 'true' || v === '1';
}

export function mask(value: string | null | undefined, opts: { keepStart?: number; keepEnd?: number } = {}) {
  if (!value) return value;
  const keepStart = opts.keepStart ?? 4;
  const keepEnd = opts.keepEnd ?? 2;
  if (value.length <= keepStart + keepEnd) return '*'.repeat(value.length);
  return `${value.slice(0, keepStart)}...${value.slice(-keepEnd)}`;
}

export function snapshotStorage() {
  try {
    const lsKeys = typeof window !== 'undefined' ? Object.keys(localStorage || {}) : [];
    const ssKeys = typeof window !== 'undefined' ? Object.keys(sessionStorage || {}) : [];
    const lsPreview = lsKeys.slice(0, 25);
    const ssPreview = ssKeys.slice(0, 25);
    return { lsCount: lsKeys.length, ssCount: ssKeys.length, lsPreview, ssPreview };
  } catch {
    return { lsCount: 0, ssCount: 0, lsPreview: [], ssPreview: [] };
  }
}
