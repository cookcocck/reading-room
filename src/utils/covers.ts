/**
 * Cover URL utilities — DEPRECATED
 *
 * Cover URL upgrading is now handled at sync time (sync.py: upgrade_cover_url)
 * and via a one-time migration script (scripts/migrate_covers.py).
 *
 * These functions are retained for reference but should not be called at runtime.
 * If needed again, prefer calling upgradeCoverURL on individual URLs rather than
 * the recursive upgradeCovers which traverses entire object trees.
 */

/** Replace WeRead t<N>_ or s_ thumbnail URLs with t7_ (~400px) for sharp rendering. */
export function upgradeCoverURL(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return url || '';
  return url.replace(/\/[st]\d*_/g, '/t7_');
}

/** @deprecated Use upgradeCoverURL on individual URLs instead. Cover upgrading is handled at sync time. */
export function upgradeCovers<T>(obj: T): T {
  if (!obj) return obj;

  if (Array.isArray(obj)) {
    for (const item of obj) upgradeCovers(item);
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key of Object.keys(obj as object)) {
      const val = (obj as Record<string, unknown>)[key];
      if (key === 'cover' && typeof val === 'string') {
        (obj as Record<string, unknown>)[key] = upgradeCoverURL(val);
      } else if (typeof val === 'object') {
        upgradeCovers(val);
      }
    }
  }
  return obj;
}
