# 中哈政务商务服务中心官网

中国企业出海哈萨克斯坦一站式服务官网（静态多页站点）。

## 页面

```
index.html                       首页
services.html                    核心业务（六大模块的交付内容、流程、参考周期、FAQ）
cases.html                       成功案例（结构化：背景 / 执行 / 结果）
about.html                       关于我们（主体资质、团队构成、服务准则）
insights.html                    资讯（文章列表、栏目规划）
insights/archive.html            资讯归档（按月份分组，自动生成）
insights.xml                     RSS 订阅（自动生成）
insights/aifc-vs-local-company.html   文章：AIFC 架构与本地公司选择
faq.html                         常见问题（25 条，按主题分组 + FAQPage 结构化数据）
data.html                        哈萨克斯坦营商关键数据（可引用数字：税率/市场/AIFC/物流）
privacy.html                     隐私政策
en/index.html                    英文首页（对应 index.html）
en/services.html                 英文服务页（对应 services.html）
en/cases.html                    英文案例（对应 cases.html）
en/faq.html                      英文常见问题（对应 faq.html）
en/data.html                     英文营商关键数据（对应 data.html）
ru/index.html                    俄文首页（对应 index.html）
ru/services.html                 俄文服务页（对应 services.html）
llms.txt / llms-full.txt         AI 爬虫站点说明（GEO）
404.html                         404 页面（由 server.js 在文件不存在时返回 404 状态）
```

## 技术说明

- 多页静态站点，无运行时外部依赖（不依赖 Google Fonts / Google Maps）。
- 首页样式内联在 `index.html`；内页共用 `pages.css` + `site.js`。
- 首页 Tailwind 由 `input.css` 编译为静态 `styles.css`（改首页类名后需重新编译）。
- 联系表单使用 FormSubmit（`formsubmit.co`）提交到 `wang13689993888@outlook.com`，含隐私政策同意勾选。
- `site.webmanifest`：PWA 清单（名称、主题色、图标），各页通过 `rel="manifest"` 引用。
- 结构化数据：首页 ProfessionalService；内页 BreadcrumbList；服务页与 faq.html 为 FAQPage；文章页 Article。
- 中英俄三语：中文页导航含 `EN` / `РУ` 切换，英文页（`/en/`）含 `中文` / `РУ`，俄文页（`/ru/`）含 `中文` / `EN`；对应页面互相声明 `hreflang`（zh-CN / en / ru / x-default），并在 sitemap 中标注 alternate。
- 英文、俄文版目前覆盖首页与服务页；导航中的案例/关于/资讯/隐私仍指向中文页。

## 资讯自动发布（每日三篇中亚简报）

每天北京时间 08:17（UTC 00:17），GitHub Actions 自动执行 `newsbot/run.mjs`：

1. 抓取哈萨克斯坦与中亚的公开 RSS（Google News、Kursiv、Tengrinews、Akorda、Astana Times、人民网、中新网等）；
2. 按经济/投资/物流/政策相关度过滤、去重，限定最近 72 小时；
3. 把来源分配到政策与监管、市场与产业、中哈合作、金融与物流四个主题，自动选取当天最合适的 3 个主题；
4. 每个主题独立调用大模型成稿，强制标注来源编号并逐篇做成稿校验，避免三篇互相重复；
5. 为每篇文章生成品牌化 SVG 封面，接入文章头图、列表缩略图与 RSS enclosure；正文要点改为卡片式版式；正文与列表摘要自动加粗关键实体、关键数字与引号术语（分段限量，避免满屏粗体）；
6. 生成文章页、更新资讯列表、归档页、RSS 与站点地图；
7. 有变更时自动提交并 push，Hostinger 随即自动部署。

封面由编辑部自动生成的抽象品牌视觉，不直接抓取新闻社图片，规避版权、防盗链和图片失效问题；文件位于 `insights/covers/`，会随文章一起提交。

### 一次性配置

在 GitHub 仓库 `FRIDAY1611/kazakhstan-china-center` 的
**Settings → Secrets and variables → Actions → New repository secret** 添加以下任一密钥：

- `DEEPSEEK_API_KEY`（推荐，`deepseek-chat`，成本低）
- `ANTHROPIC_API_KEY`（`claude-sonnet-5`）
- `OPENAI_API_KEY`（`gpt-4o-mini`）

可选仓库变量（Variables 标签页）：

- `NEWS_PROVIDER`：`deepseek` / `anthropic` / `openai`，未设置时按上面的密钥自动选择
- `NEWS_MODEL`：覆盖默认模型
- `OPENAI_BASE_URL`：使用 OpenAI 兼容网关时设置

未配置任何密钥时，定时任务会正常结束并跳过生成，不会报错或发布空稿。

### 手动操作

- GitHub → Actions → `Daily Central Asia Brief` → Run workflow，可勾选 `force` 重写当天已有的主题稿。
- 本地预览生成：`node newsbot/run.mjs --mock`
- 仅按 `news/manifest.json` 重建列表/归档/RSS/站点地图：`node newsbot/run.mjs --render-only`
- 重新生成当天主题稿：`node newsbot/run.mjs --force`

`news/manifest.json` 是已发布文章的清单，请勿手工删除条目；文章正文按日期保存在 `insights/`。同日不足 3 篇时，下一次运行会自动补齐缺失主题；不会删除已发布的历史文章。

## 部署（Hostinger Node.js + Git 自动部署）

启动命令：`npm start`（即 `node server.js`，读取 `PORT` 环境变量）。

Git push 到 `main` 后 Hostinger 自动部署，约 40 秒生效。

## GEO 优化（生成式引擎优化）

面向 ChatGPT / 豆包 / Kimi / Perplexity / Gemini 等 AI 搜索引擎，让品牌更容易被引用与推荐：

- `llms.txt` / `llms-full.txt`：供 AI 爬虫消费的站点说明（关键页面 + 一句话描述 / 全量摘要）。
- `robots.txt`：明确放行 GPTBot、PerplexityBot、ClaudeBot、Google-Extended、CCBot 等生成式引擎爬虫。
- 首页/英文首页 Organization 结构化数据补全：`identifier`（AIFC 注册号）、`geo`、`contactPoint`、`slogan`、`hasMap`。
- `data.html` / `en/data.html`：哈萨克斯坦营商关键数据页（可被引用的数字资产）。
- 服务/案例/关于/FAQ/资讯页：顶部「一句话结论」直接答案块 + `Speakable` 结构化数据（`cssSelector: .direct-answer`）。
- 文章页：`Speakable` 指向正文导语（`.brief-lead`），提升 AI 语音/摘要抓取。
- 英文补全：`en/cases.html`、`en/faq.html`、`en/data.html`（多语言引用权重）。
- 站外执行清单与监测清单：见 `GEO-站外执行清单.md`、`GEO-监测清单.md`。

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

- `img/casestudy-*.svg`：已替换为实拍照片 `img/casestudy-*.jpg`（2026-11-22：汽配考察团 / 农机落地阿拉木图 / 跨境物流通道）
- `img/centralasia-office.svg`：已替换为实拍照片 `img/centralasia-office.jpg`（2026-11-22，关于我们/首页团队图）
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
