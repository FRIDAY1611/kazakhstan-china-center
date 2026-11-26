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
export const DAILY_TARGET = 3;
export const GUIDE_TARGET = 1;

export const THEMES = [
  {
    id: 'policy',
    label: '政策与监管',
    short: '政策',
    tag: '政策与监管',
    priority: 1,
    focus: '哈萨克斯坦及中亚的政策、法规、税制、监管、政府会议与官方表态，重点解释变化对中国企业准入、成本和合规的影响。',
    keywords: [
      '政策', '监管', '法规', '法案', '税', '关税', '税率', '总统', '政府', '议会',
      '马吉利斯', '参议院', '部长', '总理', '法令', '总统令', '改革', '补贴', '许可',
      '配额', '制裁', '出口管制', '劳动法', '签证', '移民', '环保', '标准', '认证',
      'policy', 'regulation', 'regulator', 'law', 'bill', 'tax', 'tariff', 'president',
      'government', 'parliament', 'ministry', 'minister', 'decree', 'reform', 'subsidy',
      'permit', 'license', 'quota', 'sanction', 'labor', 'visa', 'immigration',
      'standard', 'certification',
      'политик', 'регулир', 'закон', 'налог', 'тариф', 'президент', 'правительств',
      'парламент', 'мажилис', 'сенат', 'министр', 'указ', 'реформ', 'субсиди',
      'лиценз', 'квот', 'санкц', 'труд', 'виз', 'миграц', 'стандарт', 'сертификац',
    ],
  },
  {
    id: 'market',
    label: '市场与产业',
    short: '市场',
    tag: '市场与产业',
    priority: 2,
    focus: '哈萨克斯坦及中亚的经济、产业、农业、能源、矿业、制造、出口、投资、价格与企业动态，优先写有具体数字和交易信号的变化。',
    keywords: [
      '经济', '市场', '农业', '农产品', '能源', '石油', '天然气', '铀', '矿业', '金属',
      '制造', '工业', '投资', '出口', '进口', '贸易', '企业', '公司', '价格', '通胀',
      'gdp', '增长', '产值', '加工', '食品', '畜牧', '小麦', '纺织', '汽车', '建材',
      'economy', 'market', 'agriculture', 'agro', 'farm', 'energy', 'oil', 'gas',
      'uranium', 'mining', 'metal', 'manufacturing', 'industry', 'investment', 'export',
      'import', 'trade', 'company', 'business', 'price', 'inflation', 'growth', 'output',
      'processing', 'food', 'livestock', 'wheat',
      'эконом', 'рынок', 'сельск', 'агро', 'энерг', 'нефт', 'газ', 'уран', 'горн',
      'металл', 'производств', 'промышлен', 'инвест', 'экспорт', 'импорт', 'торгов',
      'компани', 'бизнес', 'цен', 'инфляц', 'ввп', 'рост', 'переработ', 'продовольств',
      'животновод', 'пшениц',
    ],
  },
  {
    id: 'cooperation',
    label: '中哈合作',
    short: '合作',
    tag: '中哈合作',
    priority: 3,
    focus: '中哈双边与中国—中亚合作，包括政府间协议、企业签约、地方合作、产能合作、展会论坛与人员往来；写清合作层级和可跟进的动作。',
    keywords: [
      '中哈', '中国', '哈萨克斯坦', '中亚', '一带一路', '上合', '合作', '协议',
      '备忘录', '峰会', '论坛', '代表团', '商务', '联合', '签约', '产能合作',
      '地方合作', '新疆', '霍尔果斯', '阿拉山口', '西安', '连云港',
      'china', 'chinese', 'kazakhstan', 'central asia', 'belt and road', 'bri', 'sco',
      'cooperation', 'agreement', 'mou', 'memorandum', 'summit', 'forum', 'delegation',
      'joint', 'signing', 'xinjiang', 'khorgos', 'alashankou',
      'китай', 'казахстан', 'центральн', 'шос', 'сотрудничеств', 'соглашен',
      'меморандум', 'саммит', 'форум', 'делегац', 'совместн', 'подписан', 'синьцзян',
      'хоргос', 'алашанькоу',
    ],
  },
  {
    id: 'logistics',
    label: '金融与物流',
    short: '物流',
    tag: '金融与物流',
    priority: 4,
    focus: '跨境物流、铁路班列、口岸海关、过境通道、仓储供应链，以及银行、支付、汇率、融资与保险等金融变化；重点写时效、成本和资金路径。',
    keywords: [
      '物流', '运输', '铁路', '班列', '中欧班列', '口岸', '海关', '过境', '通道',
      '航线', '港口', '仓储', '供应链', '货运', '卡车', '公路', '航空', '电商',
      '快递', '清关', '换装', '银行', '支付', '汇率', '融资', '保险', '贷款', '结算',
      'logistics', 'transport', 'railway', 'rail', 'train', 'port', 'customs', 'transit',
      'corridor', 'route', 'shipping', 'warehouse', 'supply chain', 'freight', 'truck',
      'road', 'aviation', 'e-commerce', 'express', 'clearance', 'transshipment', 'bank',
      'payment', 'exchange rate', 'financing', 'insurance', 'loan', 'settlement',
      'логистик', 'транспорт', 'железн', 'поезд', 'порт', 'таможн', 'транзит',
      'коридор', 'маршрут', 'склад', 'поставк', 'груз', 'фур', 'дорог', 'авиа',
      'электронн', 'курьер', 'оформлен', 'перевалк', 'банк', 'платеж', 'курс',
      'финансир', 'страхов', 'кредит', 'расчет',
    ],
  },
];

export const THEME_BY_ID = Object.fromEntries(THEMES.map((theme) => [theme.id, theme]));

// 落地手册主题：每天轮换一篇，与当日简报并列发布。
export const GUIDE_TOPICS = [
  { id: 'market-entry', tag: '准入判断', title: '进入市场第一步：准入判断', focus: '行业准入、许可与认证、目标客户与城市选择、本地合作伙伴的初步判断框架，帮企业决定「能不能做、从哪切入」。' },
  { id: 'company-registration', tag: '公司注册', title: '公司注册与银行开户实操', focus: '本地有限责任公司（ТОО）与 AIFC 两种路径的选择、注册材料与周期、银行开户的反洗钱尽调要点。' },
  { id: 'visa-work-permit', tag: '签证许可', title: '签证与工作许可办理', focus: '商务签证、工作许可、临时居留的衔接流程、材料清单与常见延误点。' },
  { id: 'tax-accounting', tag: '财税合规', title: '税务申报与记账合规', focus: '企业所得税、增值税、个人所得税与社会税的申报义务、税历节奏与高频合规风险。' },
  { id: 'employment', tag: '本地用工', title: '本地用工与社保', focus: '本地与外籍员工雇佣、劳动合同、社保缴款、本地员工比例与配额等合规要点。' },
  { id: 'logistics-customs', tag: '物流清关', title: '物流与清关落地', focus: '中欧（中亚）班列与跨境卡车的选择、报关清关单据、口岸时效与在途管理。' },
  { id: 'import-export', tag: '进出口认证', title: '进出口与 EAC 认证', focus: '进出口许可、关税归类、EAC 符合性评估与认证流程，如何把认证排进上市时间表。' },
];

export const DEFAULT_MODELS = {
  deepseek: 'deepseek-chat',
  anthropic: 'claude-sonnet-5',
  openai: 'gpt-4o-mini',
};
