import { THEMES, THEME_BY_ID, DAILY_TARGET } from './config.mjs';

const norm = (value = '') => String(value).toLowerCase();

function scoreTheme(source, theme) {
  const title = norm(source.title);
  const summary = norm(source.summary);
  let score = 0;
  for (const keyword of theme.keywords) {
    const kw = norm(keyword);
    if (!kw) continue;
    if (title.includes(kw)) score += 3;
    else if (summary.includes(kw)) score += 1;
  }
  return score;
}

/** 把来源按主题分桶，尽量让每篇都有独立素材；高分主题优先，同时限制单桶过大。 */
export function assignThemeBuckets(sources, themes = THEMES) {
  const buckets = Object.fromEntries(themes.map((theme) => [theme.id, []]));
  if (!sources.length) return buckets;

  const cap = Math.max(2, Math.ceil(sources.length / themes.length) + 1);
  const scored = sources.map((source) => {
    const scores = Object.fromEntries(themes.map((theme) => [theme.id, scoreTheme(source, theme)]));
    return { source, scores, best: Math.max(...Object.values(scores)) };
  }).sort((a, b) => b.best - a.best || (a.source.published || '').localeCompare(b.source.published || ''));

  for (const item of scored) {
    const order = [...themes].sort((a, b) => (
      item.scores[b.id] - item.scores[a.id]
      || buckets[a.id].length - buckets[b.id].length
      || a.priority - b.priority
    ));
    const target = order.find((theme) => buckets[theme.id].length < cap) || order[0];
    buckets[target.id].push(item.source);
  }

  // 弱主题至少补到 2 条，避免一篇文章只有单一来源；不重复使用同一编号。
  for (const theme of themes) {
    while (buckets[theme.id].length < 2) {
      const used = new Set(buckets[theme.id].map((s) => s.id));
      const donor = themes
        .filter((t) => t.id !== theme.id)
        .sort((a, b) => buckets[b.id].length - buckets[a.id].length)[0];
      if (!donor) break;
      const pick = buckets[donor.id]
        .filter((s) => !used.has(s.id))
        .sort((a, b) => scoreTheme(b, theme) - scoreTheme(a, theme))[0];
      if (!pick) break;
      buckets[theme.id].push(pick);
    }
  }

  for (const theme of themes) {
    buckets[theme.id].sort((a, b) => {
      const ta = a.published ? new Date(a.published).getTime() : 0;
      const tb = b.published ? new Date(b.published).getTime() : 0;
      return tb - ta || a.id - b.id;
    });
  }
  return buckets;
}

export function themeIdsForPost(post) {
  if (post.theme && THEME_BY_ID[post.theme]) return [post.theme];
  const ids = new Set();
  for (const tag of post.tags || []) {
    const theme = THEMES.find((t) => t.tag === tag);
    if (theme) ids.add(theme.id);
  }
  return [...ids];
}

/**
 * 每天目标 3 篇。已有文章（含历史综合稿）先占位，再优先补未覆盖的栏目；
 * force 时只重写当天已有主题栏目，不删除历史文章。
 */
export function selectDailyThemes({ existingDaily = [], buckets, force = false, target = DAILY_TARGET }) {
  const covered = new Set();
  for (const post of existingDaily) {
    for (const id of themeIdsForPost(post)) covered.add(id);
  }

  const ranked = [...THEMES].sort((a, b) => (
    (buckets[b.id]?.length || 0) - (buckets[a.id]?.length || 0)
    || a.priority - b.priority
  ));
  const needed = Math.max(0, target - existingDaily.length);

  if (needed === 0) {
    if (!force) return [];
    const themed = [...new Set(existingDaily
      .map((post) => post.theme)
      .filter((id) => id && THEME_BY_ID[id]))];
    return themed.slice(0, target).map((id) => THEME_BY_ID[id]);
  }

  const missing = ranked.filter((theme) => !covered.has(theme.id));
  const fill = ranked.filter((theme) => covered.has(theme.id));
  return [...missing, ...fill].slice(0, needed);
}

export function primaryThemeForPost(post) {
  if (post.theme && THEME_BY_ID[post.theme]) return THEME_BY_ID[post.theme];
  if (post.kind === 'guide') return null;
  for (const id of ['cooperation', 'logistics', 'market', 'policy']) {
    if ((post.tags || []).includes(THEME_BY_ID[id].tag)) return THEME_BY_ID[id];
  }
  return null;
}
