import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { SITE } from './config.mjs';
import { fetchFeeds, loadMockSources } from './sources.mjs';
import { generateArticle, loadMockArticle, validateArticle, resolveProvider } from './llm.mjs';
import {
  loadLayout, renderArticle, updateInsightsPage,
  renderArchive, renderRss, updateSitemap, postPath, formatDateCN,
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

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log('用法：node newsbot/run.mjs [--mock] [--render-only] [--date=YYYY-MM-DD] [--root=目录] [--force] [--dry]');
    console.log('  --render-only  不抓取来源、不调用模型，仅按 news/manifest.json 重建归档/RSS/列表/站点地图');
    return;
  }

  const date = opts.date || todayInShanghai();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`日期格式错误：${date}`);
  console.log(`\n=== ${SITE.name} · 每日中亚简报 · ${date} ===`);

  const manifest = loadManifest(opts.root);

  if (opts.renderOnly) {
    const posts = sortPosts(manifest.posts);
    console.log('1/2 读取已发布的资讯清单');
    console.log(`  共 ${posts.length} 篇`);
    console.log('2/2 渲染归档、RSS、资讯列表与站点地图');
    const layout = loadLayout(opts.root);
    const archiveHtml = renderArchive(posts, layout);
    const rss = renderRss(posts);
    const insightsFile = path.join(opts.root, 'insights.html');
    const insightsHtml = updateInsightsPage(readFileSync(insightsFile, 'utf8'), posts);
    const sitemapFile = path.join(opts.root, 'sitemap.xml');
    const sitemap = updateSitemap(readFileSync(sitemapFile, 'utf8'), posts, date);

    write(opts.root, 'insights/archive.html', archiveHtml, opts);
    write(opts.root, 'insights.xml', rss, opts);
    write(opts.root, 'insights.html', insightsHtml, opts);
    write(opts.root, 'sitemap.xml', sitemap, opts);
    const manifestFile = path.join(opts.root, 'news', 'manifest.json');
    if (!existsSync(manifestFile)) {
      write(opts.root, 'news/manifest.json', `${JSON.stringify({ posts }, null, 2)}\n`, opts);
    }
    console.log(`\n完成：${SITE.origin}/insights/archive.html`);
    return;
  }

  const existing = manifest.posts.find((p) => p.kind === 'daily' && p.date === date);
  if (existing && !opts.force) {
    console.log(`今天已有简报《${existing.title}》，跳过（使用 --force 可重写）。`);
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

  console.log('2/4 生成与校验成稿');
  let content;
  if (opts.mock) {
    content = validateArticle(loadMockArticle(opts.root), sources);
  } else {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const { raw } = await generateArticle(sources, formatDateCN(date), { log: console.log });
        content = validateArticle(raw, sources);
        break;
      } catch (err) {
        const retriable = /成稿校验未通过|模型未返回 JSON/.test(err.message);
        console.log(`  第 ${attempt} 次成稿未通过：${err.message}`);
        if (!retriable || attempt === 2) throw err;
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }
  console.log(`  标题：${content.title}`);
  console.log(`  引用来源：${content.cited_source_ids.join('、')}`);

  const slug = `${date}-central-asia-brief`;
  const post = {
    slug,
    title: content.title,
    summary: content.summary,
    date,
    kind: 'daily',
    tags: content.tags,
    url: `insights/${slug}.html`,
  };
  const posts = sortPosts([
    post,
    ...manifest.posts.filter((p) => !(p.kind === 'daily' && p.date === date)),
  ]);

  console.log('3/4 渲染页面与订阅文件');
  const layout = loadLayout(opts.root);
  const articleHtml = renderArticle({ post, content, sources, layout });
  const archiveHtml = renderArchive(posts, layout);
  const rss = renderRss(posts);
  const insightsFile = path.join(opts.root, 'insights.html');
  const insightsHtml = updateInsightsPage(readFileSync(insightsFile, 'utf8'), posts);
  const sitemapFile = path.join(opts.root, 'sitemap.xml');
  const sitemap = updateSitemap(readFileSync(sitemapFile, 'utf8'), posts, date);

  console.log('4/4 写入文件');
  write(opts.root, postPath(post), articleHtml, opts);
  write(opts.root, 'insights/archive.html', archiveHtml, opts);
  write(opts.root, 'insights.xml', rss, opts);
  write(opts.root, 'insights.html', insightsHtml, opts);
  write(opts.root, 'sitemap.xml', sitemap, opts);
  write(opts.root, 'news/manifest.json', `${JSON.stringify({ posts }, null, 2)}\n`, opts);

  console.log(`\n完成：${SITE.origin}/${postPath(post)}`);
}

main().catch((err) => {
  console.error(`\n[newsbot] 失败：${err.message}`);
  process.exit(1);
});
