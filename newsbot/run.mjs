import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SITE, DAILY_TARGET } from './config.mjs';
import { fetchFeeds, loadMockSources } from './sources.mjs';
import { generateArticle, loadMockArticle, validateArticle, resolveProvider } from './llm.mjs';
import { assignThemeBuckets, selectDailyThemes, primaryThemeForPost } from './themes.mjs';
import { coverPath, coverAlt, renderCoverSvg } from './cover.mjs';
import {
  loadLayout, renderArticle, updateInsightsPage,
  renderArchive, renderRss, updateSitemap, postPath, formatDateCN, esc,
} from './render.mjs';

const EVERGREEN = {
  slug: 'aifc-vs-local-company',
  title: 'AIFC 架构还是本地公司？先回答这五个问题',
  summary: '适用法律、语言、银行开户、税务与业务范围——两种主体路径的差异，以及什么时候该找专业顾问做架构评估。',
  date: '2026-11-22',
  kind: 'guide',
  tags: ['政策与监管', '落地观察'],
  url: 'insights/aifc-vs-local-company.html',
};

function parseArgs(argv) {
  const opts = { mock: false, force: false, dry: false, renderOnly: false, date: null, root: process.cwd() };
  for (const arg of argv) {
    if (arg === '--mock') opts.mock = true;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--dry') opts.dry = true;
    else if (arg === '--render-only') opts.renderOnly = true;
    else if (arg.startsWith('--date=')) opts.date = arg.slice(7);
    else if (arg.startsWith('--root=')) opts.root = path.resolve(arg.slice(7));
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else throw new Error(`未知参数：${arg}`);
  }
  return opts;
}

function todayInShanghai() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function loadManifest(root) {
  const file = path.join(root, 'news', 'manifest.json');
  if (!existsSync(file)) return { posts: [EVERGREEN] };
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(data.posts)) throw new Error('news/manifest.json 格式错误：posts 必须是数组');
  return data;
}

function sortPosts(posts) {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function write(root, rel, content, { dry }) {
  const file = path.join(root, rel);
  const prev = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (prev === content) {
    console.log(`  无变化：${rel}`);
    return false;
  }
  if (!dry) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content, 'utf8');
  }
  console.log(`  ${dry ? '将写入' : '已写入'}：${rel}`);
  return true;
}

function prepareCovers(root, posts, opts) {
  for (const post of posts) {
    if (!post.cover) post.cover = coverPath(post);
    if (!post.coverAlt) post.coverAlt = coverAlt(post);
    if (post.cover.startsWith('insights/covers/')) {
      write(root, post.cover, renderCoverSvg(post), opts);
    }
  }
}

function injectCover(root, post, opts) {
  if (!post.cover) return;
  const file = path.join(root, postPath(post));
  if (!existsSync(file)) return;
  let html = readFileSync(file, 'utf8');
  if (html.includes('class="article-cover"')) return;

  const src = /^https?:/i.test(post.cover) ? post.cover : post.cover.replace(/^insights\//, '');
  const theme = post.kind === 'guide' ? '落地观察' : (primaryThemeForPost(post)?.label || '资讯');
  const alt = post.coverAlt || `${theme}封面：${post.title}`;
  const figure = `<figure class="article-cover">
      <img src="${esc(src)}" alt="${esc(alt)}" width="1200" height="630" loading="eager" decoding="async" />
      <figcaption><span>${esc(theme)} · 编辑部制图</span><span>${formatDateCN(post.date)}</span></figcaption>
    </figure>`;

  const lead = /(<p class="brief-lead">[\s\S]*?<\/p>)/;
  if (lead.test(html)) {
    html = html.replace(lead, `$1\n\n    ${figure}`);
  } else if (html.includes('<div class="prose">')) {
    html = html.replace(/(<div class="prose">)/, `$1\n    ${figure}`);
  } else {
    return;
  }
  write(root, postPath(post), html, opts);
}

function titleKey(title) {
  return String(title).toLowerCase().replace(/[\s\-–—|·:：,，.。!！?？"'“”‘’()（）【】[\]]+/g, '');
}

function makePost(theme, content, date) {
  const slug = `${date}-${theme.id}`;
  return {
    slug,
    title: content.title,
    summary: content.summary,
    date,
    kind: 'daily',
    theme: theme.id,
    tags: [...new Set([theme.tag, ...content.tags])].slice(0, 3),
    url: `insights/${slug}.html`,
  };
}

async function generateTheme(theme, sources, dateLabel, opts, allSources) {
  if (opts.mock) {
    const content = validateArticle(loadMockArticle(opts.root), allSources);
    content.title = `${content.title}｜${theme.label}`;
    content.tags = [...new Set([theme.tag, ...content.tags])].slice(0, 3);
    return content;
  }

  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { raw } = await generateArticle(sources, dateLabel, { theme, log: console.log });
      return validateArticle(raw, sources);
    } catch (err) {
      last = err;
      const retriable = !err.status || err.status === 429 || err.status >= 500
        || /成稿校验未通过|JSON/.test(err.message);
      console.log(`  ${theme.label} 第 ${attempt} 次成稿未通过：${err.message}`);
      if (!retriable || attempt === 3) break;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  throw last;
}

function renderSite(root, posts, layout, date, opts) {
  const archiveHtml = renderArchive(posts, layout);
  const rss = renderRss(posts);
  const insightsFile = path.join(root, 'insights.html');
  const insightsHtml = updateInsightsPage(readFileSync(insightsFile, 'utf8'), posts);
  const sitemapFile = path.join(root, 'sitemap.xml');
  const sitemap = updateSitemap(readFileSync(sitemapFile, 'utf8'), posts, date);

  write(root, 'insights/archive.html', archiveHtml, opts);
  write(root, 'insights.xml', rss, opts);
  write(root, 'insights.html', insightsHtml, opts);
  write(root, 'sitemap.xml', sitemap, opts);
  write(root, 'news/manifest.json', `${JSON.stringify({ posts }, null, 2)}\n`, opts);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log('用法：node newsbot/run.mjs [--mock] [--render-only] [--date=YYYY-MM-DD] [--root=目录] [--force] [--dry]');
    console.log('  --render-only  不抓取来源、不调用模型，仅按 news/manifest.json 重建归档/RSS/列表/站点地图');
    return;
  }

  const date = opts.date || todayInShanghai();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`日期格式错误：${date}`);
  console.log(`\n=== ${SITE.name} · 每日中亚资讯（每天 ${DAILY_TARGET} 篇）· ${date} ===`);

  const manifest = loadManifest(opts.root);

  if (opts.renderOnly) {
    const posts = sortPosts(manifest.posts);
    console.log('1/2 读取已发布的资讯清单');
    console.log(`  共 ${posts.length} 篇`);
    console.log('2/2 补齐封面、渲染归档、RSS、资讯列表与站点地图');
    prepareCovers(opts.root, posts, opts);
    for (const post of posts) injectCover(opts.root, post, opts);
    const layout = loadLayout(opts.root);
    renderSite(opts.root, posts, layout, date, opts);
    console.log(`\n完成：${SITE.origin}/insights/archive.html`);
    return;
  }

  const existingDaily = manifest.posts.filter((p) => p.kind === 'daily' && p.date === date);
  if (existingDaily.length >= DAILY_TARGET && !opts.force) {
    console.log(`今天已有 ${existingDaily.length} 篇简报，跳过（使用 --force 可重写当天主题稿）。`);
    prepareCovers(opts.root, manifest.posts, opts);
    for (const post of manifest.posts) injectCover(opts.root, post, opts);
    write(opts.root, 'news/manifest.json', `${JSON.stringify({ posts: sortPosts(manifest.posts) }, null, 2)}\n`, opts);
    return;
  }

  if (!opts.mock && !resolveProvider(process.env)) {
    console.log('未配置 DEEPSEEK_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY，跳过本次生成。');
    console.log('在 GitHub 仓库 Settings → Secrets and variables → Actions 添加任一密钥后自动生效。');
    return;
  }

  console.log('1/4 获取来源');
  const sources = opts.mock ? loadMockSources(opts.root) : await fetchFeeds({ log: console.log });
  if (!sources.length) throw new Error('本次没有获取到任何来源，终止发布以免生成空稿');
  console.log(`  可用来源：${sources.length} 条`);

  const buckets = assignThemeBuckets(sources);
  const chosen = selectDailyThemes({ existingDaily, buckets, force: opts.force });
  if (!chosen.length) {
    console.log('今天的目标主题稿已齐，跳过生成。');
    return;
  }
  console.log(`  本期选择 ${chosen.length} 个栏目：${chosen.map((t) => t.label).join('、')}`);
  for (const theme of chosen) {
    console.log(`  ${theme.label}：${buckets[theme.id].length} 条来源`);
  }

  console.log('2/4 生成与校验成稿');
  const results = await Promise.allSettled(chosen.map((theme) => (
    generateTheme(theme, buckets[theme.id], formatDateCN(date), opts, sources)
  )));

  const contents = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      contents.push({ theme: chosen[i], content: result.value });
    } else {
      console.log(`  ${chosen[i].label} 生成失败：${result.reason?.message || result.reason}`);
    }
  });
  if (!contents.length) throw new Error('本期没有任何一篇成稿通过校验，终止发布');
  if (contents.length < chosen.length) {
    console.log(`  警告：本期仅 ${contents.length}/${chosen.length} 篇成功，缺失栏目将在下次运行时补齐。`);
  }

  const usedTitles = new Set(existingDaily.map((p) => titleKey(p.title)));
  const generated = contents.map(({ theme, content }) => {
    let title = content.title;
    if (usedTitles.has(titleKey(title))) title = `${title}｜${theme.label}`;
    usedTitles.add(titleKey(title));
    content.title = title;
    const post = makePost(theme, content, date);
    console.log(`  ${theme.label}：${content.title}（引用 ${content.cited_source_ids.join('、')}）`);
    return { post, content };
  });

  const newSlugs = new Set(generated.map(({ post }) => post.slug));
  const posts = sortPosts([
    ...generated.map(({ post }) => post),
    ...manifest.posts.filter((p) => !newSlugs.has(p.slug)),
  ]);

  console.log('3/4 生成封面、渲染页面与订阅文件');
  prepareCovers(opts.root, posts, opts);
  for (const post of posts) injectCover(opts.root, post, opts);

  const layout = loadLayout(opts.root);
  for (const { post, content } of generated) {
    write(opts.root, postPath(post), renderArticle({ post, content, sources, layout }), opts);
  }
  renderSite(opts.root, posts, layout, date, opts);

  console.log('4/4 完成');
  for (const { post } of generated) {
    console.log(`  ${SITE.origin}/${postPath(post)}`);
  }
}

main().catch((err) => {
  console.error(`\n[newsbot] 失败：${err.message}`);
  process.exit(1);
});
