const TERMS = [
  '哈萨克斯坦', '阿斯塔纳', '阿拉木图', '霍尔果斯', '阿拉山口',
  '上合组织', '欧亚经济联盟', '托卡耶夫',
  '中欧班列', '运输走廊', '班列', '铁路', '口岸', '通关', '过境', '物流', '供应链', '仓储', '货运',
  '银行', '贷款', '存款', '利率', '汇率', '坚戈', '融资', '支付', '资本市场',
  '出口', '进口', '关税', '增值税', '个人所得税', '投资', '产能', '招标', '许可',
  '农业', '农产品', '加工厂', '能源', '矿业', '基建', '汽车', '工程机械', '电商', '制造业',
  '中哈合作', '双边贸易', '经贸合作', '人员往来',
].sort((a, b) => b.length - a.length);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TERM_RE = new RegExp(TERMS.map(escapeRe).join('|'), 'g');
const NUM_RE = /\d+(?:\.\d+)?\s*(?:%|％|万亿|亿|万)(?:坚戈|美元|元|人民币|卢布)?|\d+(?:\.\d+)?\s*(?:坚戈|美元|人民币|卢布)/g;
const QUOTE_RE = /「[^」]{2,24}」/g;

export function createEmphasisState() {
  return { used: new Set() };
}

export function emphasizeHtml(text, state = createEmphasisState(), max = 2) {
  const candidates = [];
  const add = (priority, re) => {
    for (const m of text.matchAll(re)) {
      candidates.push({ start: m.index, end: m.index + m[0].length, priority, key: `${priority}:${m[0]}` });
    }
  };
  add(0, NUM_RE);
  add(1, QUOTE_RE);
  add(2, TERM_RE);
  candidates.sort((a, b) => a.priority - b.priority || a.start - b.start);

  const picked = [];
  for (const c of candidates) {
    if (picked.length >= max) break;
    if (state.used.has(c.key)) continue;
    if (picked.some((p) => c.start < p.end && c.end > p.start)) continue;
    picked.push(c);
    state.used.add(c.key);
  }
  picked.sort((a, b) => b.start - a.start);

  let html = text;
  for (const c of picked) {
    html = `${html.slice(0, c.start)}<strong class="kw">${html.slice(c.start, c.end)}</strong>${html.slice(c.end)}`;
  }
  return { html, count: picked.length };
}

export function emphasizeBlock(inner, state, max = 2) {
  let budget = max;
  let strongDepth = 0;
  const parts = inner.split(/(<[^>]+>)/);
  const html = parts.map((part) => {
    if (!part) return part;
    if (part.startsWith('<')) {
      if (/^<strong\b/i.test(part)) strongDepth++;
      else if (/^<\/strong>/i.test(part)) strongDepth = Math.max(0, strongDepth - 1);
      return part;
    }
    if (strongDepth > 0 || budget <= 0) return part;
    const result = emphasizeHtml(part, state, budget);
    budget -= result.count;
    return result.html;
  }).join('');
  return { html, count: max - budget };
}

const processItems = (html, state, max) => html.replace(
  /(<li>)([\s\S]*?)(<\/li>)/g,
  (match, open, inner, close) => `${open}${emphasizeBlock(inner, state, max).html}${close}`,
);

export function emphasizeArticleHtml(html) {
  if (html.includes('class="kw"')) return html;
  const article = html.match(/<article class="wrap">[\s\S]*?<\/article>/);
  if (!article) return html;

  const state = createEmphasisState();
  let body = article[0];

  body = body.replace(
    /(<p class="brief-lead">)([\s\S]*?)(<\/p>)/,
    (match, open, inner, close) => `${open}${emphasizeBlock(inner, state, 2).html}${close}`,
  );
  body = body.replace(
    /(<div class="brief-points">[\s\S]*?<\/div>)/,
    (block) => processItems(block, state, 2),
  );

  const sourceAt = body.indexOf('<section class="sources">');
  const content = sourceAt >= 0 ? body.slice(0, sourceAt) : body;
  const tail = sourceAt >= 0 ? body.slice(sourceAt) : '';
  const withParas = content.replace(
    /(<p>)([\s\S]*?)(<\/p>)/g,
    (match, open, inner, close) => `${open}${emphasizeBlock(inner, state, 2).html}${close}`,
  );
  const withImpl = withParas.replace(
    /(<ul class="impl">[\s\S]*?<\/ul>)/,
    (block) => processItems(block, state, 2),
  );
  body = withImpl + tail;

  return html.replace(article[0], body);
}
