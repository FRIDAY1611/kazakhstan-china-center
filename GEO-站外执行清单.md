# 站外 GEO 执行清单（公司实体层）

> 站内优化已由代码完成（llms.txt、robots 放行、结构化数据、关键数据页、直接答案块、英文 FAQ/案例/数据）。
> 下面是「公司做 GEO」需要你本人/团队在站外逐项完成的动作，按优先级排列。每项都给了可直接复制的文案。
> 核心原则：**所有平台上的名称、地址、电话、注册号必须一字不差**（NAP 一致性），AI 引擎靠「多个来源说同一件事」来判定实体可信。

---

## P0-1：注册正式域名（强烈建议 1–2 周内完成）

当前临时子域 `pleased-forestgreen-swan-56.hostingersite.com` 会拖低权威度，一切站内优化都在给它打工。

**推荐域名（按优先级）：**
1. `kh-kz.com`（中哈，好记，通用）
2. `kc-center.com`（Kazakhstan-China Center）
3. `kz-china.kz`（.kz 本地域名，对哈萨克本地用户信任度更高，但注册需本地主体资质）

**步骤：**
1. 在 Hostinger hPanel → Domains → 购买域名（或在阿里云/腾讯云买，再改 DNS）。
2. 在 Hostinger 把该域名绑定到当前网站（Add website → 选择现有网站 → 关联域名）。
3. 开启 HTTPS（Let's Encrypt 自动证书）。
4. 换域名后，把全站 `https://pleased-forestgreen-swan-56.hostingersite.com` 替换为新域名（我可以帮你一键替换并重新推送）。
5. 在 GitHub 仓库把部署/回调域名同步更新。

**买完告诉我新域名，我负责全站替换 + sitemap/llms.txt/robots 里的旧域名替换 + 重新部署。**

---

## P0-2：建地图 / 目录账号（免费，当天可完成）

每个平台都用这套**标准 NAP**：

```
名称（中文）：中哈政务商务服务中心
名称（英文）：Kazakhstan China Center for Government and Business Services
地址：010000, Kazakhstan, Astana, Esil district, 8/2 Turkistan
电话：+86 136 8999 3888
微信：13689993888
AIFC 注册号：261040900239
网站：https://kh-kz.com（或当前临时域）
业务分类：Business management consultant / Government & business services
```

| 平台 | 入口 | 说明 |
|---|---|---|
| Google Business Profile | business.google.com | 全球 AI 引擎拉实体数据的第一来源，务必建 |
| 2GIS | 2gis.kz | 哈萨克斯坦主流地图，本地用户与 AI 都认 |
| Yandex Business | business.yandex.ru | 俄语区/中亚权重高 |
| 百度地图商户 | lbc.baidu.com | 国内客户来源 |
| 微信位置（搜狗地图） | 微信公众平台/商户 | 国内客户在微信里搜得到 |

**业务简介（复制用，中英各一份）：**

> 中：中哈政务商务服务中心，为中国企业出海哈萨克斯坦及中亚提供政务对接、商务考察、公司注册、签证许可、法律财税与物流清关一站式服务，常驻阿拉木图与阿斯塔纳。
> EN：The Kazakhstan China Center for Government and Business Services provides one-stop market-entry support in Kazakhstan and Central Asia — government relations, business delegations, company formation, visas and work permits, legal and tax, and logistics and customs — delivered by a local team based in Almaty and Astana.

---

## P0-3：LinkedIn 公司主页 + 创始人个人页（半天）

1. 创建公司主页 `Kazakhstan China Center`（分类选 "Business Consulting and Services"）。
2. 简介粘贴上面的英文业务简介 + 网站链接。
3. 创始人个人页：标题写「Founder, Kazakhstan China Center — helping Chinese companies enter Central Asia」，在 "Experience" 里写清业务与地域。
4. 每周用公司/个人号发 1–2 条「中国企业出海哈萨克斯坦」的短内容（见文末内容日历）。

**LinkedIn 主页建好后，把主页 URL 发给我，我把它加进全站结构化数据的 `sameAs`。**

---

## P1：Wikidata 建实体条目（可选但值钱）

AI 知识图谱大量来自 Wikidata/Wikipedia。小公司难上维基，但 **Wikidata 中性条目**可行。

1. 打开 wikidata.org，用公司英文名创建新条目（Item）。
2. 关键声明（Statements）：
   - `instance of (P31)` = business / company
   - `industry (P452)` = consulting
   - `country (P17)` = Kazakhstan
   - `headquarters location (P159)` = Astana
   - `official website (P856)` = https://kh-kz.com
   - 如能引用公开来源（AIFC 注册信息、官网），每条声明都加 reference，否则条目会被质疑。
3. 保持中立、不写广告语，只写可核实的事实。

---

## P2：署名内容输出（持续，制造外部引用）

目标：让你的公司在「中国企业出海哈萨克斯坦」这个话题上被持续引用。渠道优先级：

| 渠道 | 内容形式 | 频率 |
|---|---|---|
| 知乎专栏 | 「中国企业出海哈萨克斯坦」系列问答/文章 | 每周 1 篇 |
| 脉脉 | 行业短评、案例片段（脱敏） | 每周 1–2 条 |
| LinkedIn | 英文短评 + 数据 | 每周 1–2 条 |
| 行业媒体投稿 | 汽配/农机/建材出海观察 | 每月 1 篇 |
| 微信公众号 | 转载每日简报精华 + 落地手册 | 随简报 |

**选题库（直接抄题目）：**
- 中国企业注册哈萨克斯坦公司：ТОО 还是 AIFC？
- 哈萨克斯坦工作许可怎么拿？外派人员全流程
- 去哈萨克斯坦做汽配生意，先搞清这三个问题
- 中欧班列 vs 跨境卡车：到中亚的货怎么走更划算
- 哈萨克斯坦企业所得税 20%、增值税 12%：一张表看懂税负

**内容要点：** 每篇都带一个具体数字、一个来源、一个「这意味着什么」的结论——这和站内简报的打法一致，正是 AI 引擎爱引用的形态。

---

## 已完成的站内部分（无需你再操作）

- `/llms.txt`、`/llms-full.txt`：给 AI 爬虫看的站点说明
- `robots.txt`：放行 GPTBot / PerplexityBot / ClaudeBot / Google-Extended 等
- 首页/英文首页：Organization 结构化数据补全（identifier=AIFC 注册号、geo、contactPoint、slogan）
- `/data.html`、`/en/data.html`：哈萨克斯坦营商关键数据页
- 服务/案例/关于/FAQ/资讯页：顶部「一句话结论」直接答案块 + Speakable 结构化数据
- `/en/faq.html`、`/en/cases.html`：英文 FAQ（25 条）与英文案例
