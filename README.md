# 中哈政务商务服务中心官网

中国企业出海哈萨克斯坦一站式服务官网（静态多页站点）。

## 页面

```
index.html                       首页
services.html                    核心业务（六大模块的交付内容、流程、参考周期、FAQ）
cases.html                       成功案例（结构化：背景 / 执行 / 结果）
about.html                       关于我们（主体资质、团队构成、服务准则）
insights.html                    洞察（文章列表、栏目规划）
insights/aifc-vs-local-company.html   文章：AIFC 架构与本地公司选择
privacy.html                     隐私政策
404.html                         404 页面（由 server.js 在文件不存在时返回 404 状态）
```

## 技术说明

- 多页静态站点，无运行时外部依赖（不依赖 Google Fonts / Google Maps）。
- 首页样式内联在 `index.html`；内页共用 `pages.css` + `site.js`。
- 首页 Tailwind 由 `input.css` 编译为静态 `styles.css`（改首页类名后需重新编译）。
- 联系表单使用 FormSubmit（`formsubmit.co`）提交到 `wang13689993888@outlook.com`，含隐私政策同意勾选。
- `site.webmanifest`：PWA 清单（名称、主题色、图标），各页通过 `rel="manifest"` 引用。
- 结构化数据：首页 ProfessionalService；内页 BreadcrumbList；服务页 FAQPage；文章页 Article。

## 部署（Hostinger Node.js + Git 自动部署）

启动命令：`npm start`（即 `node server.js`，读取 `PORT` 环境变量）。

Git push 到 `main` 后 Hostinger 自动部署，约 40 秒生效。

## 访问统计（内置，无第三方、无 Cookie）

- 服务端记录匿名 PV：`{时间, 页面, 来源域名, 匿名哈希}`，**不保存原始 IP**。
- 匿名哈希每次进程启动更换盐，不可还原、不可跨重启关联。
- 原始日志保留 90 天后自动清理。
- 查看后台：`/admin/stats?token=你的令牌`
- 需在 Hostinger 环境变量中设置 `STATS_TOKEN`；未设置时后台返回 404。

## 安全

`server.js` 不对外暴露：`server.js`、`package.json`、`README.md`、隐藏文件、`.mjs/.log/.jsonl`、`data/` 目录；
路径穿越请求返回 403。响应头含 `X-Content-Type-Options`、`Referrer-Policy`、`X-Frame-Options`、`Permissions-Policy`。

## 待替换素材

- `img/casestudy-*.svg`、`img/centralasia-office.svg`：实拍照片
- `img/wechat-qr.svg`：真实微信二维码（替换后无需改代码）
- 合作伙伴：替换为具体机构名称 / 授权 logo
- 团队页：成员姓名、照片、履历（需本人授权）

## 目录

```
index.html          首页
pages.css           内页样式
site.js             内页脚本
styles.css          首页编译后的 Tailwind
server.js           静态服务器 + 匿名统计（零依赖）
img/*.svg           图片（部分为占位图）
```
