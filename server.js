/**
 * 中哈政务商务服务中心 · 静态站点服务器（零依赖）
 * 供 Hostinger Node.js「Git 自动部署」使用：npm start 即启动。
 * 内置匿名访问统计：不存原始 IP、不使用 Cookie。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const STATS_TOKEN = process.env.STATS_TOKEN || '';

const DATA_DIR = path.join(ROOT, 'data');
const VISITS_FILE = path.join(DATA_DIR, 'visits.jsonl');
const RETENTION_DAYS = 90;
// 每次进程启动生成新盐：哈希不可跨重启关联，也不可还原
const SALT = crypto.randomBytes(16).toString('hex');

const BLOCKED_FILES = new Set([
  'server.js',
  'package.json',
  'package-lock.json',
  'README.md',
  '.gitignore',
]);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}

/* ---------------- 匿名统计 ---------------- */

const BOT_RE = /bot|crawler|spider|slurp|bingpreview|headless|facebookexternalhit/i;

function recordVisit(req, urlPath) {
  try {
    const ua = String(req.headers['user-agent'] || '').slice(0, 300);
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
      || req.socket.remoteAddress || '';
    const uid = crypto.createHash('sha256')
      .update(SALT + '|' + ip + '|' + ua)
      .digest('hex')
      .slice(0, 16);
    let ref = '';
    try {
      const r = new URL(String(req.headers.referer || ''));
      ref = r.host.slice(0, 120);
    } catch {}
    const line = JSON.stringify({
      t: new Date().toISOString(),
      p: urlPath.slice(0, 200),
      r: ref,
      u: uid,
      b: BOT_RE.test(ua) ? 1 : 0,
    }) + '\n';
    fs.appendFile(VISITS_FILE, line, () => {});
  } catch {}
}

let lastCleanup = 0;
function cleanupVisits() {
  const now = Date.now();
  if (now - lastCleanup < 86400000) return;
  lastCleanup = now;
  fs.readFile(VISITS_FILE, 'utf8', (err, data) => {
    if (err) return;
    const cutoff = now - RETENTION_DAYS * 86400000;
    const kept = [];
    data.split('\n').forEach((line) => {
      if (!line) return;
      try {
        if (new Date(JSON.parse(line).t).getTime() >= cutoff) kept.push(line);
      } catch {}
    });
    fs.writeFile(VISITS_FILE, kept.join('\n') + (kept.length ? '\n' : ''), () => {});
  });
}

function tokenOk(provided) {
  if (!STATS_TOKEN) return false;
  const a = Buffer.from(STATS_TOKEN);
  const b = Buffer.from(String(provided || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

function dayKey(d) {
  const x = new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}

function renderStats(rows) {
  const human = rows.filter((v) => !v.b);
  const now = Date.now();
  const today = dayKey(now);
  const weekAgo = now - 7 * 86400000;

  const todayRows = human.filter((v) => dayKey(v.t) === today);
  const weekRows = human.filter((v) => new Date(v.t).getTime() >= weekAgo);

  const uniq = (arr) => new Set(arr.map((v) => v.u)).size;
  const countBy = (arr, keyFn) => {
    const m = new Map();
    arr.forEach((v) => {
      const k = keyFn(v);
      if (!k) return;
      m.set(k, (m.get(k) || 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  };

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = dayKey(now - i * 86400000);
    days.push([d, human.filter((v) => dayKey(v.t) === d).length]);
  }

  const topPages = countBy(weekRows.length ? weekRows : human, (v) => v.p).slice(0, 10);
  const topRefs = countBy(weekRows.length ? weekRows : human, (v) => v.r || '直接访问').slice(0, 10);

  const rowsHtml = (arr) => arr.map(([k, n]) => `<tr><td>${esc(k)}</td><td class="n">${n}</td></tr>`).join('');
  const max = Math.max(1, ...days.map((d) => d[1]));
  const bars = days.map(([d, n]) => {
    const h = Math.max(2, Math.round((n / max) * 120));
    return `<div class="bar" title="${d}: ${n}"><i style="height:${h}px"></i><span>${d.slice(5)}</span></div>`;
  }).join('');

  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>访问统计 · 中哈政务商务服务中心</title>
<style>
body{margin:0;background:#F5F6F8;color:#101828;font-family:-apple-system,'Segoe UI','Microsoft YaHei',sans-serif;line-height:1.6}
.wrap{max-width:960px;margin:0 auto;padding:40px 24px}
h1{font-size:20px;margin:0 0 4px}.sub{color:#8A94A3;font-size:12.5px;margin-bottom:28px}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
.card{background:#fff;border:1px solid rgba(16,24,40,.08);border-radius:14px;padding:18px 20px}
.card b{display:block;font-size:26px;letter-spacing:-.02em}
.card span{font-size:12px;color:#8A94A3}
h2{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#8A94A3;margin:32px 0 12px}
.chart{display:flex;align-items:flex-end;gap:6px;height:150px;background:#fff;border:1px solid rgba(16,24,40,.08);border-radius:14px;padding:16px}
.bar{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px;height:100%}
.bar i{width:100%;max-width:28px;background:linear-gradient(180deg,#7C97BC,#3E5B85);border-radius:4px 4px 0 0;display:block}
.bar span{font-size:9px;color:#AEB6C2;white-space:nowrap}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid rgba(16,24,40,.08);border-radius:14px;overflow:hidden;font-size:13.5px}
td{padding:9px 16px;border-bottom:1px solid rgba(16,24,40,.05);word-break:break-all}
td.n{text-align:right;width:80px;color:#4A5567}
tr:last-child td{border-bottom:0}
.two{display:grid;grid-template-columns:1fr 1fr;gap:20px}
@media(max-width:700px){.cards{grid-template-columns:1fr 1fr}.two{grid-template-columns:1fr}}
</style></head><body><div class="wrap">
<h1>访问统计</h1>
<div class="sub">匿名统计 · 不记录原始 IP / 无 Cookie · 数据保留 ${RETENTION_DAYS} 天 · 更新于 ${new Date().toLocaleString('zh-CN')}</div>
<div class="cards">
<div class="card"><b>${human.length}</b><span>累计浏览（PV）</span></div>
<div class="card"><b>${todayRows.length}</b><span>今日浏览</span></div>
<div class="card"><b>${weekRows.length}</b><span>近 7 天浏览</span></div>
<div class="card"><b>${uniq(weekRows)}</b><span>近 7 天访客</span></div>
</div>
<h2>近 14 天浏览</h2>
<div class="chart">${bars}</div>
<div class="two">
<div><h2>热门页面（近 7 天）</h2><table>${rowsHtml(topPages) || '<tr><td>暂无数据</td><td class="n">0</td></tr>'}</table></div>
<div><h2>来源（近 7 天）</h2><table>${rowsHtml(topRefs) || '<tr><td>暂无数据</td><td class="n">0</td></tr>'}</table></div>
</div>
</div></body></html>`;
}

/* ---------------- HTTP 服务 ---------------- */

function send(res, code, type, body) {
  res.writeHead(code, {
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  res.end(body);
}

let NOT_FOUND_BODY = null;
try { NOT_FOUND_BODY = fs.readFileSync(path.join(ROOT, '404.html')); } catch {}

function sendNotFound(res, req) {
  if (!NOT_FOUND_BODY) {
    send(res, 404, 'text/plain; charset=utf-8', 'Not Found');
    return;
  }
  res.writeHead(404, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, follow',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  });
  res.end(req.method === 'HEAD' ? undefined : NOT_FOUND_BODY);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'text/plain; charset=utf-8', 'Method Not Allowed');
    return;
  }

  let parsed;
  try {
    parsed = new URL(req.url || '/', 'http://localhost');
  } catch {
    send(res, 400, 'text/plain; charset=utf-8', 'Bad Request');
    return;
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent(parsed.pathname);
  } catch {
    send(res, 400, 'text/plain; charset=utf-8', 'Bad Request');
    return;
  }
  if (urlPath === '/') urlPath = '/index.html';

  /* 统计后台：仅在设置 STATS_TOKEN 时可访问，否则 404 */
  if (parsed.pathname === '/admin/stats') {
    if (!tokenOk(parsed.searchParams.get('token'))) {
      send(res, 404, 'text/plain; charset=utf-8', 'Not Found');
      return;
    }
    cleanupVisits();
    fs.readFile(VISITS_FILE, 'utf8', (err, data) => {
      const rows = [];
      if (!err) {
        data.split('\n').forEach((line) => {
          if (!line) return;
          try { rows.push(JSON.parse(line)); } catch {}
        });
      }
      const html = renderStats(rows);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : html);
    });
    return;
  }

  // 防止路径穿越
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
    return;
  }

  // 不对外暴露源码 / 配置 / 隐藏文件 / 统计数据
  const rel = path.relative(ROOT, filePath).split(path.sep).join('/');
  const blocked = BLOCKED_FILES.has(rel)
    || rel === 'data' || rel.startsWith('data/')
    || rel.split('/').some((seg) => seg.startsWith('.'))
    || /\.(mjs|log|jsonl)$/i.test(rel);
  if (blocked) {
    send(res, 404, 'text/plain; charset=utf-8', 'Not Found');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendNotFound(res, req);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.html') {
      cleanupVisits();
      recordVisit(req, parsed.pathname);
    }
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html'
        ? 'public, max-age=0, must-revalidate'
        : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CHK Service Center running on port ${PORT}`);
});
