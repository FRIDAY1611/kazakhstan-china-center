/**
 * 中哈政务商务服务中心 · 静态站点服务器（零依赖）
 * 供 Hostinger Node.js「Git 自动部署」使用：npm start 即启动。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

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
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  // 防止路径穿越
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  // 不对外暴露源码/配置/隐藏文件
  const rel = path.relative(ROOT, filePath).split(path.sep).join('/');
  const blocked = BLOCKED_FILES.has(rel)
    || rel.split('/').some(seg => seg.startsWith('.'))
    || /\.(mjs|log)$/i.test(rel);
  if (blocked) { res.writeHead(404); res.end('Not Found'); return; }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CHK Service Center running on port ${PORT}`);
});
