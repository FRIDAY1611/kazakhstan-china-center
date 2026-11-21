import { readFileSync } from 'node:fs';
import path from 'node:path';
import { SITE, THEME_BY_ID } from './config.mjs';
import { createEmphasisState, emphasizeHtml } from './emphasis.mjs';

export const esc = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export const postPath = (post) => `insights/${post.slug}.html`;
export const postUrl = (post) => `${SITE.origin}/${postPath(post)}`;

export const KIND_LABEL = { daily: '每日简报', guide: '落地手册' };

export function formatDateCN(date) {
  const [y, m, d] = date.split('-').map(Number);
  return `${y} 年 ${m} 月 ${d} 日`;
}

const dotDate = (date) => date.replace(/-/g, '.');

function rebase(html) {
  return html.replace(/\b(href|src)="(?!https?:|mailto:|tel:|#|\/|\.\.\/)([^"]*)"/g, '$1="../$2"');
}

export function loadLayout(root) {
  const insights = readFileSync(path.join(root, 'insights.html'), 'utf8');
  const header = insights.match(/<a class="skip-link"[\s\S]*?(?=<main id="main")/);
  const footer = insights.match(/<footer class="footer">[\s\S]*?<\/footer>/);
  const scripts = insights.match(/<script src="site\.js"><\/script>[\s\S]*?(?=<\/body>)/);
  if (!header || !footer || !scripts) {
    throw new Error('无法从 insights.html 提取页头/页脚，请检查文件结构');
  }
  return {
    header: rebase(header[0].trimEnd()),
    footer: rebase(footer[0]),
    scripts: rebase(scripts[0].trimEnd()),
  };
}

function head({ title, description, canonical, ogType = 'article', date, imageAlt, image, schemaType = 'Article' }) {
  const isArticle = schemaType === 'Article';
  const absoluteImage = image && /^https?:/i.test(image) ? image : image ? `${SITE.origin}/${image.replace(/^\//, '')}` : `${SITE.origin}/og-image.png`;
  const ogImage = /\.(png|jpe?g|webp)$/i.test(absoluteImage) ? absoluteImage : `${SITE.origin}/og-image.png`;
  const ld = isArticle ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished: date,
    dateModified: date,
    inLanguage: 'zh-CN',
    image: [absoluteImage],
    author: { '@type': 'Organization', name: SITE.name },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: { '@type': 'ImageObject', url: `${SITE.origin}/icon-192.png` },
    },
    mainEntityOfPage: canonical,
  } : {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: title,
    description,
    url: canonical,
    inLanguage: 'zh-CN',
    isPartOf: { '@type': 'WebSite', name: SITE.name, url: `${SITE.origin}/` },
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: `${SITE.origin}/` },
      { '@type': 'ListItem', position: 2, name: '资讯', item: `${SITE.origin}/insights.html` },
      { '@type': 'ListItem', position: 3, name: title, item: canonical },
    ],
  };
  const publishedMeta = isArticle && date
    ? `<meta property="article:published_time" content="${date}" />`
    : '';
  return `<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="color-scheme" content="light" />
<title>${esc(title)} | ${esc(SITE.name)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${canonical}" />
<link rel="alternate" hreflang="zh-CN" href="${canonical}" />
<link rel="alternate" hreflang="x-default" href="${canonical}" />
<link rel="alternate" type="application/rss+xml" title="中亚市场资讯 RSS" href="../insights.xml" />
<link rel="icon" href="../favicon.svg" type="image/svg+xml" />
<link rel="icon" href="../favicon-32.png" type="image/png" sizes="32x32" />
<link rel="apple-touch-icon" href="../apple-touch-icon.png" />
<link rel="manifest" href="../site.webmanifest" />
<meta name="theme-color" content="#2C3E5C" />
<meta property="og:type" content="${ogType}" />
<meta property="og:site_name" content="${esc(SITE.name)}" />
<meta property="og:locale" content="zh_CN" />
<meta property="og:url" content="${canonical}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${esc(imageAlt || title)}" />
${publishedMeta}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${ogImage}" />
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(crumbs, null, 2)}
</script>
<link rel="stylesheet" href="../pages.css" />`;
}

function cite(text, ids, emState) {
  return emphasizeHtml(esc(text), emState, 2).html.replace(/\[(\d{1,2})\]/g, (match, num) => {
    const id = Number(num);
    return ids.has(id)
      ? `<sup class="src-ref"><a href="#src-${id}" aria-label="查看来源 ${id}">[${id}]</a></sup>`
      : match;
  });
}

function readingMinutes(content) {
  const chars = content.sections.reduce((n, s) => n + s.paragraphs.join('').length, 0);
  return Math.max(3, Math.round(chars / 450));
}

export function renderArticle({ post, content, sources, layout }) {
  const ids = new Set(content.cited_source_ids);
  const citedSources = sources.filter((s) => ids.has(s.id));
  const url = postUrl(post);
  const kind = KIND_LABEL[post.kind] || '资讯';
  const themeLabel = post.theme && THEME_BY_ID[post.theme] ? THEME_BY_ID[post.theme].label : '';
  const kicker = themeLabel ? `${themeLabel} · ${kind}` : '';
  const displayTags = post.tags?.length ? post.tags : content.tags;
  const tags = displayTags.map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  const articleCover = post.cover
    ? (/^https?:/i.test(post.cover) ? post.cover : post.cover.replace(/^insights\//, ''))
    : '';
  const coverAlt = post.coverAlt || `${themeLabel || kind}封面：${content.title}`;
  const coverBlock = articleCover ? `
    <figure class="article-cover">
      <img src="${esc(articleCover)}" alt="${esc(coverAlt)}" width="1200" height="630" loading="eager" decoding="async" />
      <figcaption><span>${esc(themeLabel || kind)} · 编辑部制图</span><span>${formatDateCN(post.date)}</span></figcaption>
    </figure>` : '';
  const emState = createEmphasisState();
  const lead = emphasizeHtml(esc(content.dek), emState, 2).html;

  const keyPoints = content.key_points
    .map((p) => `<li>${cite(p, ids, emState)}</li>`)
    .join('\n');

  const sections = content.sections.map((sec) => {
    const paras = sec.paragraphs.map((p) => `<p>${cite(p, ids, emState)}</p>`).join('\n');
    return `<h2>${esc(sec.heading)}</h2>\n${paras}`;
  }).join('\n\n');

  const implications = content.implications
    .map((p) => `<li>${cite(p, ids, emState)}</li>`)
    .join('\n');

  const sourceItems = citedSources.map((s) => {
    const when = s.published ? ` · ${dotDate(s.published.slice(0, 10))}` : '';
    return `<li id="src-${s.id}"><span class="src-num">[${s.id}]</span> <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer nofollow">${esc(s.source)} — ${esc(s.title)}</a><span class="src-date">${when}</span></li>`;
  }).join('\n');

  const main = `<div class="article-head">
  <div class="wrap">
    <div class="breadcrumb"><a href="../index.html">首页</a><span class="sep">/</span><a href="../insights.html">资讯</a><span class="sep">/</span><span>${esc(kind)}</span></div>
    ${kicker ? `<p class="article-kicker">${esc(kicker)}</p>` : ''}
    <h1>${esc(content.title)}</h1>
    <div class="article-meta">
      <time datetime="${post.date}">${formatDateCN(post.date)}</time>
      <span>${esc(kind)} · 约 ${readingMinutes(content)} 分钟阅读</span>
      <span>${esc(SITE.name)}</span>
    </div>
    <div class="article-tags">${tags}</div>
  </div>
</div>

<article class="wrap">
  <div class="prose">
    <p class="brief-lead">${lead}</p>
${coverBlock}

    <div class="brief-points">
      <h2>今日要点</h2>
      <ul>
${keyPoints}
      </ul>
    </div>

${sections}

    <h2>对企业意味着什么</h2>
    <ul class="impl">
${implications}
    </ul>

    <section class="sources">
      <h2>信息来源</h2>
      <ol class="sources-list">
${sourceItems}
      </ol>
    </section>

    <p class="note">
      本文由${esc(SITE.name)}编辑部基于公开来源整理，引用编号对应文末信息来源；仅作一般性信息参考，不构成法律、税务或投资建议。
      涉及具体政策、费率与许可要求，请以哈萨克斯坦官方最新规定及持牌专业机构意见为准。
    </p>
  </div>
</article>

<section class="cta-band">
  <div class="wrap">
    <div>
      <h2>想把今天的信号变成具体动作？</h2>
      <p>告诉我们你的行业与目标市场，我们按业务场景给出进入路径、时间表与合规清单。</p>
    </div>
    <a class="btn btn--gold" href="../index.html#contact">预约咨询</a>
  </div>
</section>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
${head({ title: content.title, description: content.summary, canonical: url, date: post.date, image: post.cover, imageAlt: coverAlt })}
</head>

<body>
${layout.header}

<main id="main" tabindex="-1">

${main}

</main>

${layout.footer}

${layout.scripts}
</body>
</html>
`;
}

function postKind(post) {
  return KIND_LABEL[post.kind] ? `<span class="post__kind">${KIND_LABEL[post.kind]}</span>` : '';
}

export function renderPostList(posts, limit = 10, hrefBase = 'insights/', coverPrefix = '') {
  return posts.slice(0, limit).map((post) => {
    const cover = post.cover
      ? (/^https?:/i.test(post.cover) ? post.cover : `${coverPrefix}${post.cover}`)
      : '';
    const thumb = cover
      ? `<img class="post__thumb" src="${esc(cover)}" alt="" width="150" height="84" loading="lazy" decoding="async" />`
      : '';
    return `<a class="post${cover ? ' post--media' : ''}" href="${esc(`${hrefBase}${post.slug}.html`)}" data-reveal>
  <time datetime="${post.date}">${dotDate(post.date)}</time>
  <div class="post__main">
    ${thumb}
    <div class="post__text">
      ${postKind(post)}
      <h2>${esc(post.title)}</h2>
      <p>${emphasizeHtml(esc(post.summary), createEmphasisState(), 1).html}</p>
    </div>
  </div>
  <span class="arrow">→</span>
</a>`;
  }).join('\n');
}

export function updateInsightsPage(html, posts) {
  const re = /(<!-- NEWS:BEGIN -->)[\s\S]*?(<!-- NEWS:END -->)/;
  if (!re.test(html)) throw new Error('insights.html 缺少 NEWS 标记');
  return html.replace(re, `$1\n${renderPostList(posts)}\n$2`);
}

export function renderArchive(posts, layout) {
  const groups = new Map();
  for (const post of posts) {
    const month = post.date.slice(0, 7);
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(post);
  }
  const sections = [...groups.entries()].map(([month, list]) => {
    const [y, m] = month.split('-').map(Number);
    return `<section class="archive-group">
  <h2 class="archive-month">${y} 年 ${m} 月</h2>
  <div class="post-list">
${renderPostList(list, list.length, '', '../')}
  </div>
</section>`;
  }).join('\n\n');

  const canonical = `${SITE.origin}/insights/archive.html`;
  const title = '资讯归档';
  const description = '中哈政务商务服务中心资讯归档：每日中亚市场简报与落地手册，按时间倒序排列。';

  const main = `<section class="page-hero">
  <div class="wrap">
    <div class="breadcrumb"><a href="../index.html">首页</a><span class="sep">/</span><a href="../insights.html">资讯</a><span class="sep">/</span><span>归档</span></div>
    <h1>资讯归档</h1>
    <p class="lead">每日中亚市场简报与落地手册，按发布时间倒序排列。共 ${posts.length} 篇。</p>
  </div>
</section>

<section class="section">
  <div class="wrap" style="max-width:900px">
${sections}
    <p class="archive-back"><a class="btn btn--ghost" href="../insights.html">返回资讯首页</a></p>
  </div>
</section>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
${head({ title, description, canonical, ogType: 'website', date: posts[0]?.date, imageAlt: title, schemaType: 'CollectionPage' })}
</head>

<body>
${layout.header}

<main id="main" tabindex="-1">

${main}

</main>

${layout.footer}

${layout.scripts}
</body>
</html>
`;
}

function rfc822(date) {
  return new Date(`${date}T08:00:00+08:00`).toUTCString();
}

function cdata(value = '') {
  return `<![CDATA[${String(value).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

export function renderRss(posts) {
  const latest = posts[0]?.date;
  const items = posts.map((post) => {
    const url = postUrl(post);
    const categories = (post.tags || []).map((t) => `      <category>${esc(t)}</category>`).join('\n');
    const cover = post.cover
      ? (/^https?:/i.test(post.cover) ? post.cover : `${SITE.origin}/${post.cover}`)
      : '';
    const enclosure = cover
      ? `\n      <enclosure url="${esc(cover)}" type="${/\.png$/i.test(cover) ? 'image/png' : /\.jpe?g$/i.test(cover) ? 'image/jpeg' : 'image/svg+xml'}" length="0" />`
      : '';
    return `    <item>
      <title>${esc(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(post.date)}</pubDate>
${categories}
      <description>${cdata(post.summary)}</description>${enclosure}
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)} · 中亚市场资讯</title>
    <link>${SITE.origin}/insights.html</link>
    <atom:link href="${SITE.origin}/insights.xml" rel="self" type="application/rss+xml" />
    <description>哈萨克斯坦与中亚市场的政策、产业、合作与落地观察，面向中国企业家每日更新。</description>
    <language>zh-cn</language>
    <lastBuildDate>${latest ? rfc822(latest) : new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

export function updateSitemap(xml, posts, today) {
  const blocks = [...xml.matchAll(/\s*<url>[\s\S]*?<\/url>/g)].map((m) => m[0]);
  const kept = [];
  for (const block of blocks) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1] || '';
    if (/\/insights\/[^/]+\.html$/.test(loc)) continue;
    if (/\/insights\/archive\.html$/.test(loc)) continue;
    if (/\/insights\.html$/.test(loc)) {
      kept.push(block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${today}</lastmod>`));
      continue;
    }
    kept.push(block);
  }
  const seen = new Set();
  const deduped = kept.filter((block) => {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1] || '';
    if (seen.has(loc)) return false;
    seen.add(loc);
    return true;
  });

  const generated = posts.map((post) => `  <url>
    <loc>${postUrl(post)}</loc>
    <lastmod>${post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
  generated.push(`  <url>
    <loc>${SITE.origin}/insights/archive.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`);

  const header = xml.slice(0, xml.indexOf('<url>')).trimEnd();
  const keptXml = deduped.map((block) => block.trim()).join('\n');
  return `${header}\n${keptXml}\n\n${generated.join('\n')}\n</urlset>\n`;
}
