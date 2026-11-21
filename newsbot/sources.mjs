import { readFileSync } from 'node:fs';
import path from 'node:path';
import { FEEDS, WINDOW_HOURS, MAX_ITEMS } from './config.mjs';

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', mdash: '—', ndash: '–', hellip: '…',
};

export function decodeEntities(str = '') {
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z][a-z0-9]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

export function stripHtml(input = '') {
  return decodeEntities(
    input
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
}

function unwrapCdata(value = '') {
  const m = value.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return m ? m[1] : value;
}

function tag(block, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i');
  const m = block.match(re);
  return m ? unwrapCdata(m[1]).trim() : '';
}

function attr(block, name, attrName) {
  const re = new RegExp(`<${name}[^>]*\\b${attrName}="([^"]+)"[^>]*>`, 'i');
  const m = block.match(re);
  return m ? decodeEntities(m[1]) : '';
}

function firstLink(block) {
  const plain = tag(block, 'link');
  if (plain && !/\s/.test(plain)) return plain;
  const href = attr(block, 'link', 'href');
  if (href) return href;
  const guid = tag(block, 'guid');
  if (guid && !/\s/.test(guid)) return guid;
  return '';
}

function resolveUrl(link, base) {
  try {
    return new URL(decodeEntities(link), base).href;
  } catch {
    return '';
  }
}

function firstDate(block) {
  for (const name of ['pubDate', 'published', 'updated', 'dc:date']) {
    const raw = tag(block, name);
    if (!raw) continue;
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

function feedSourceName(block, fallback) {
  const source = stripHtml(tag(block, 'source'));
  return source || fallback;
}

const STRONG_TERMS = [
  'экономик', 'инвест', 'экспорт', 'импорт', 'транзит', 'логистич', 'тариф', 'налог',
  'банк', 'финанс', 'бюджет', 'ввп', 'инфляц', 'тендер', 'контракт', 'соглашен',
  'бизнес', 'предпринимат', 'производств', 'промышлен', 'технопарк', 'агропром', 'торгов',
  'поставк', 'нефт', 'газ', 'энерг', 'уран', 'металл', 'строй', 'недвижим', 'цифров',
  'сельск', 'транспортн',
  'стартап', 'кредит', 'бирж', 'приватизац', 'субсиди', 'пошлин', 'акциз', 'мсб',
  'валют', 'юань', 'грузооборот', 'перевозк', 'склад', 'таможен',
  'econom', 'investment', 'investor', 'export', 'import', 'transit', 'logistic', 'tariff',
  'banking', 'finance', 'budget', 'gdp', 'inflation', 'tender', 'contract', 'agreement',
  'business', 'entrepreneur', 'manufactur', 'industrial', 'agro', 'trade', 'supply chain',
  'oil', 'gas', 'energy', 'uranium', 'metal', 'construction', 'real estate', 'digital',
  'startup', 'credit', 'stock exchange', 'privatiz', 'subsid', 'customs', 'cargo',
  'freight', 'railway', 'warehouse',
  '经济', '投资', '出口', '进口', '过境', '物流', '关税', '税率', '银行', '金融', '预算',
  '通胀', '招标', '合同', '协议', '企业', '制造', '工业', '园区', '农业', '贸易', '供应',
  '石油', '天然气', '能源', '铀', '金属', '建筑', '房地产', '数字', '创业', '信贷',
  '股市', '私有化', '补贴', '海关', '口岸', '班列', '货运', '铁路', '仓储',
];

const MEDIUM_TERMS = [
  'транспорт', 'железн', 'авиа', 'трасс', 'рабоч', 'зарплат', 'безработ', 'миграц',
  'виза', 'разрешен', 'лиценз', 'регулир', 'компани', 'рынок', 'предприят', 'ставк',
  'правительств', 'министерств', 'поручен', 'совещани', 'реформ', 'законопроект', 'указ',
  'программ', 'нацпроект', 'министр', 'премьер', 'искусственн',
  'transport', 'rail ', 'aviation', 'road', 'labor', 'wage', 'unemploy', 'migration',
  'visa', 'permit', 'license', 'regulat', 'company', 'market', 'enterprise', 'rate',
  'government', 'ministry', 'parliament', 'reform', 'decree', 'policy', 'program',
  'prime minister', 'artificial intelligence',
  '交通', '公路', '航空', '劳动', '工资', '就业', '移民', '签证', '许可', '监管', '公司',
  '市场', '利率', '政府', '议会', '改革', '法令', '政策', '总统', '人工智能',
];

const GEO_TERMS = [
  'казахстан', 'алматы', 'астана', 'шымкент', 'актобе', 'атырау', 'караганда',
  'тараз', 'павлодар', 'усть-каменогорск', 'кызылорда', 'костанай', 'петропавловск',
  'туркестан', 'тенге', 'акимат', 'мажилис', 'сенат', 'нацбанк', 'казатомпром',
  'казмунайгаз', 'самрук', 'каспи', 'халык', 'эйр астана', 'центральная азия',
  'кыргызстан', 'узбекистан', 'таджикистан', 'туркменистан', 'китай', 'кнр', 'шос',
  'еаэс',
  'kazakhstan', 'almaty', 'astana', 'shymkent', 'aktobe', 'atyrau', 'karaganda',
  'tengiz', 'kashagan', 'tenge', 'central asia', 'kyrgyzstan', 'uzbekistan',
  'tajikistan', 'turkmenistan', 'china', 'chinese', 'sco', 'eaeu', 'khorgos',
  '哈萨克斯坦', '阿拉木图', '阿斯塔纳', '努尔苏丹', '奇姆肯特', '阿克托别', '阿特劳',
  '卡拉干达', '塔拉兹', '巴甫洛达尔', '厄斯克门', '克孜勒奥尔达', '科斯塔奈',
  '彼得罗巴甫洛夫斯克', '突厥斯坦', '坚戈', '马吉利斯', '国家银行', '中哈', '对华',
  '中亚', '吉尔吉斯斯坦', '乌兹别克斯坦', '塔吉克斯坦', '土库曼斯坦', '中国', '上合',
  '欧亚经济联盟', '霍尔果斯', '阿拉山口',
];

const NEGATIVE_TERMS = [
  'спорт', 'ufc', 'футбол', 'бокс', 'матч', 'олимпи', 'чемпионат', 'погод', 'синоптик',
  'умер', 'смерт', 'погиб', 'убийств', 'полиц', 'розыск', 'погон', 'дтп', 'авари',
  'крушение', 'катастроф', 'пожар', 'суицид', 'травл', 'сериал', 'звезд', 'актер',
  'певиц', 'певец', 'знаменит', 'шоу', 'концерт', 'гороскоп', 'кулинар', 'мода',
  'теракт', 'войн', 'военн',
  'sport', 'football', 'boxing', 'olympic', 'weather', 'died', 'death', 'killed',
  'murder', 'police', 'wanted', 'crash', 'accident', 'fire', 'celebrity', 'movie',
  'music', 'concert', 'crime', 'drug', 'war', 'terror',
  '体育', '足球', '篮球', '拳击', '比赛', '天气', '气象', '死亡', '遇难', '事故', '警方',
  '追捕', '车祸', '坠机', '火灾', '明星', '娱乐', '演唱会', '犯罪', '毒品', '战争', '恐袭',
];

function analyzeTitle(title = '') {
  const t = String(title).toLowerCase();
  const strong = STRONG_TERMS.filter((term) => t.includes(term)).length;
  const medium = MEDIUM_TERMS.filter((term) => t.includes(term)).length;
  const geo = GEO_TERMS.some((term) => t.includes(term));
  const negative = NEGATIVE_TERMS.some((term) => t.includes(term));
  return { score: strong * 3 + medium - (negative ? 5 : 0), strong, medium, geo, negative };
}

export function relevanceScore(title) {
  return analyzeTitle(title).score;
}

function passesFilter(item, filter) {
  if (!filter) return true;
  const a = analyzeTitle(item.title);
  if (filter.requireGeo && (!a.geo || (a.strong === 0 && a.medium === 0))) return false;
  if (a.negative && a.strong === 0) return false;
  return a.score >= filter.minScore;
}

export function parseFeed(xml, feed) {
  const blocks = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)].map((m) => m[2]);
  const items = [];
  for (const block of blocks) {
    const rawTitle = stripHtml(tag(block, 'title'));
    if (!rawTitle) continue;
    const source = feedSourceName(block, feed.name);
    const suffix = ` - ${source}`;
    const title = rawTitle.endsWith(suffix) ? rawTitle.slice(0, -suffix.length).trim() : rawTitle;
    const link = resolveUrl(firstLink(block), feed.url);
    if (!/^https?:\/\//i.test(link)) continue;
    const summary = stripHtml(tag(block, 'description') || tag(block, 'summary') || tag(block, 'content:encoded')).slice(0, 600);
    const published = firstDate(block);
    const haystack = `${title} ${summary}`.toLowerCase();
    if (feed.mustMatch && !feed.mustMatch.some((kw) => haystack.includes(kw.toLowerCase()))) continue;
    if (feed.filter && !passesFilter({ title }, feed.filter)) continue;
    items.push({
      source,
      feed: feed.name,
      lang: feed.lang,
      title: title.slice(0, 240),
      url: link,
      summary,
      published,
    });
  }
  return items;
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[\s\-–—|·:：,，.。!！?？"'“”‘’()（）【】[\]]+/g, '')
    .slice(0, 90);
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeTitle(item.title);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchFeeds({ log = console.log } = {}) {
  const cutoff = Date.now() - WINDOW_HOURS * 60 * 60 * 1000;
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; CHK-Newsbot/1.0)' },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      const items = parseFeed(xml, feed)
        .filter((item) => !item.published || new Date(item.published).getTime() >= cutoff)
        .slice(0, feed.limit || 10);
      return items;
    })
  );

  const collected = [];
  FEEDS.forEach((feed, i) => {
    const r = results[i];
    if (r.status === 'fulfilled') {
      log(`  ${feed.name}: ${r.value.length} 条`);
      collected.push(...r.value);
    } else {
      log(`  ${feed.name}: 跳过（${String(r.reason?.message || r.reason).slice(0, 60)}）`);
    }
  });

  const sorted = dedupe(collected).sort((a, b) => {
    const ta = a.published ? new Date(a.published).getTime() : 0;
    const tb = b.published ? new Date(b.published).getTime() : 0;
    return tb - ta;
  }).slice(0, MAX_ITEMS);

  return sorted.map((item, i) => ({ ...item, id: i + 1 }));
}

export function loadMockSources(root) {
  const file = path.join(root, 'newsbot', 'fixtures', 'sources.json');
  const data = JSON.parse(readFileSync(file, 'utf8'));
  return data.slice(0, MAX_ITEMS).map((item, i) => ({
    id: i + 1,
    source: item.source || '测试来源',
    feed: 'fixture',
    lang: item.lang || 'zh',
    title: item.title,
    url: item.url,
    summary: item.summary || '',
    published: item.published || new Date().toISOString(),
  }));
}

export function formatSourcesForPrompt(items) {
  return items
    .map((item) => {
      const when = item.published ? new Date(item.published).toISOString().slice(0, 16).replace('T', ' ') : '时间未知';
      const summary = item.summary ? `\n   摘要：${item.summary}` : '';
      return `[${item.id}] ${when} · ${item.source}\n   标题：${item.title}${summary}\n   链接：${item.url}`;
    })
    .join('\n\n');
}
