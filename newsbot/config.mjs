export const SITE = {
  origin: 'https://pleased-forestgreen-swan-56.hostingersite.com',
  name: '中哈政务商务服务中心',
  brandEn: 'Kazakhstan · China Service Center',
  email: 'wang13689993888@outlook.com',
};

export const CATEGORIES = ['政策与监管', '市场与产业', '中哈合作', '金融与物流', '落地观察'];

export const FEEDS = [
  {
    id: 'gnews-zh-kz',
    name: 'Google News · 哈萨克斯坦',
    url: 'https://news.google.com/rss/search?q=%E5%93%88%E8%90%A8%E5%85%8B%E6%96%AF%E5%9D%A6&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
    lang: 'zh',
    limit: 15,
  },
  {
    id: 'gnews-zh-ca',
    name: 'Google News · 中亚经济',
    url: 'https://news.google.com/rss/search?q=%E4%B8%AD%E4%BA%9A%20%E7%BB%8F%E6%B5%8E&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
    lang: 'zh',
    limit: 10,
  },
  {
    id: 'gnews-en-kz',
    name: 'Google News · Kazakhstan–China',
    url: 'https://news.google.com/rss/search?q=Kazakhstan%20China%20business&hl=en-US&gl=US&ceid=US:en',
    lang: 'en',
    limit: 10,
  },
  {
    id: 'kursiv',
    name: 'Kursiv',
    url: 'https://kz.kursiv.media/feed/',
    lang: 'ru',
    limit: 14,
    filter: { minScore: 3, requireGeo: true },
  },
  {
    id: 'tengrinews',
    name: 'Tengrinews',
    url: 'https://tengrinews.kz/news.rss',
    lang: 'ru',
    limit: 12,
    filter: { minScore: 3, requireGeo: true },
  },
  {
    id: 'akorda',
    name: 'Akorda',
    url: 'https://www.akorda.kz/ru/rss',
    lang: 'ru',
    limit: 8,
    filter: { minScore: 2, requireGeo: false },
  },
  {
    id: 'astanatimes',
    name: 'The Astana Times',
    url: 'https://astanatimes.com/feed/',
    lang: 'en',
    limit: 10,
    filter: { minScore: 3, requireGeo: false },
  },
  {
    id: 'tengrinews-en',
    name: 'Tengrinews · English',
    url: 'https://en.tengrinews.kz/news.rss',
    lang: 'en',
    limit: 10,
    filter: { minScore: 3, requireGeo: false },
  },
  {
    id: 'people-world',
    name: '人民网 · 国际',
    url: 'http://www.people.com.cn/rss/world.xml',
    lang: 'zh',
    limit: 8,
    mustMatch: ['哈萨克斯坦', '中亚', '阿斯塔纳', '阿拉木图', '上合', '一带一路'],
  },
  {
    id: 'chinanews-world',
    name: '中国新闻网 · 国际',
    url: 'https://www.chinanews.com.cn/rss/world.xml',
    lang: 'zh',
    limit: 8,
    mustMatch: ['哈萨克斯坦', '中亚', '阿斯塔纳', '阿拉木图', '上合', '一带一路'],
  },
];

export const WINDOW_HOURS = 72;
export const MAX_ITEMS = 50;

export const DEFAULT_MODELS = {
  deepseek: 'deepseek-chat',
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-4o-mini',
};
