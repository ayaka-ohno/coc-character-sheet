const CHARACTERISTICS = [
  { id: 'str', name: 'STR', label: '筋力',    formula: '3D6×5',     roll: () => rollDice(3,6) * 5 },
  { id: 'con', name: 'CON', label: '体力',    formula: '3D6×5',     roll: () => rollDice(3,6) * 5 },
  { id: 'siz', name: 'SIZ', label: '体格',    formula: '(2D6+6)×5', roll: () => (rollDice(2,6) + 6) * 5 },
  { id: 'dex', name: 'DEX', label: '敏捷性',  formula: '3D6×5',     roll: () => rollDice(3,6) * 5 },
  { id: 'app', name: 'APP', label: '外見',    formula: '3D6×5',     roll: () => rollDice(3,6) * 5 },
  { id: 'int', name: 'INT', label: '知性',    formula: '(2D6+6)×5', roll: () => (rollDice(2,6) + 6) * 5 },
  { id: 'pow', name: 'POW', label: '精神力',  formula: '3D6×5',     roll: () => rollDice(3,6) * 5 },
  { id: 'edu', name: 'EDU', label: '教育',    formula: '(2D6+6)×5', roll: () => (rollDice(2,6) + 6) * 5 },
  { id: 'luk', name: 'LUK', label: '幸運',    formula: '3D6×5',     roll: () => rollDice(3,6) * 5 },
];

const OCCUPATIONS = [
  {
    name: '探偵',
    formulaLabel: 'EDU×2 + (DEX or STR)×2',
    calcPoints: (s) => s.edu * 2 + Math.max(s.dex, s.str) * 2,
    creditRating: [30, 50],
    suggestedSkills: ['図書館', '心理学', '目星', '聞き耳', '追跡', '説得', '威圧', '変装'],
    description: '謎を解き明かすことを生業とする者。社会の暗部を知り、人の嘘を見抜く。',
  },
  {
    name: '医師',
    formulaLabel: 'EDU×4',
    calcPoints: (s) => s.edu * 4,
    creditRating: [30, 80],
    suggestedSkills: ['応急手当', '医学', '心理学', '精神分析', '科学（生物学）', '科学（薬学）', '他の言語', '言いくるめ'],
    description: '人体と医療の専門家。生死の現場に慣れた者。',
  },
  {
    name: '教授',
    formulaLabel: 'EDU×4',
    calcPoints: (s) => s.edu * 4,
    creditRating: [20, 70],
    suggestedSkills: ['図書館', '心理学', '他の言語', '歴史', 'オカルト', '考古学', '自然', '説得'],
    description: '学術研究と教育に従事する者。古い知識を持ち、謎を追い求める。',
  },
  {
    name: '記者',
    formulaLabel: 'EDU×4',
    calcPoints: (s) => s.edu * 4,
    creditRating: [9, 30],
    suggestedSkills: ['図書館', '心理学', '目星', '聞き耳', '説得', '言いくるめ', '他の言語', '写真術'],
    description: '情報を追い求める報道の専門家。真実を暴くことに命をかける。',
  },
  {
    name: '芸術家',
    formulaLabel: 'EDU×2 + (DEX or POW)×2',
    calcPoints: (s) => s.edu * 2 + Math.max(s.dex, s.pow) * 2,
    creditRating: [9, 50],
    suggestedSkills: ['芸術/製作（絵画）', '芸術/製作（音楽）', '芸術/製作（文芸）', '歴史', 'オカルト', '心理学', '他の言語', '自然'],
    description: '創造的な表現を追求する者。美と狂気の境界を知る。',
  },
  {
    name: '軍人',
    formulaLabel: 'EDU×2 + (DEX or STR)×2',
    calcPoints: (s) => s.edu * 2 + Math.max(s.dex, s.str) * 2,
    creditRating: [9, 30],
    suggestedSkills: ['格闘（ブロール）', '拳銃', '回避', '応急手当', '登攀', '隠密', 'ナビゲート', '運転（自動車）'],
    description: '軍隊で訓練を受けた戦士。規律と戦闘の専門家。',
  },
  {
    name: '警察官',
    formulaLabel: 'EDU×2 + (DEX or STR)×2',
    calcPoints: (s) => s.edu * 2 + Math.max(s.dex, s.str) * 2,
    creditRating: [9, 30],
    suggestedSkills: ['格闘（ブロール）', '拳銃', '回避', '法律', '心理学', '威圧', '目星', '運転（自動車）'],
    description: '法の執行を担う者。犯罪と向き合い続けてきた。',
  },
  {
    name: '聖職者',
    formulaLabel: 'EDU×4',
    calcPoints: (s) => s.edu * 4,
    creditRating: [9, 60],
    suggestedSkills: ['歴史', '図書館', '心理学', '精神分析', 'オカルト', '説得', '他の言語', '芸術/製作（文芸）'],
    description: '宗教的な使命を帯びた者。信仰の力で闇と対峙する。',
  },
  {
    name: '犯罪者',
    formulaLabel: 'EDU×2 + (DEX or STR)×2',
    calcPoints: (s) => s.edu * 2 + Math.max(s.dex, s.str) * 2,
    creditRating: [5, 65],
    suggestedSkills: ['格闘（ブロール）', '拳銃', '隠密', '手さばき', '鍵開け', '威圧', '言いくるめ', '運転（自動車）'],
    description: '法の外で生きる者。裏社会のルールを熟知している。',
  },
  {
    name: 'エンジニア',
    formulaLabel: 'EDU×4',
    calcPoints: (s) => s.edu * 4,
    creditRating: [20, 60],
    suggestedSkills: ['コンピューター', '電子工学', '機械修理', '科学（数学）', '科学（物理学）', '図書館', '操縦（航空機）', '運転（自動車）'],
    description: '技術と機械の専門家。論理的思考で問題を解決する。',
  },
];

const SKILL_CATEGORIES = ['戦闘', '射撃', '探索', '対人', '知識', '行動', '隠密', '技術', '言語', '芸術'];

const SKILLS = [
  // 戦闘
  { name: '回避',           base: 'DEX×2', category: '戦闘' },
  { name: '格闘（ブロール）', base: 25,      category: '戦闘' },
  // 射撃
  { name: '拳銃',              base: 20, category: '射撃' },
  { name: 'ライフル/ショットガン', base: 25, category: '射撃' },
  { name: 'サブマシンガン',     base: 15, category: '射撃' },
  { name: '弓',                base: 15, category: '射撃' },
  { name: '重火器',            base: 10, category: '射撃' },
  // 探索
  { name: '目星',     base: 25, category: '探索' },
  { name: '聞き耳',   base: 20, category: '探索' },
  { name: '図書館',   base: 20, category: '探索' },
  { name: '追跡',     base: 10, category: '探索' },
  { name: 'ナビゲート', base: 10, category: '探索' },
  // 対人
  { name: '言いくるめ', base: 5,  category: '対人' },
  { name: '説得',       base: 10, category: '対人' },
  { name: '魅惑',       base: 15, category: '対人' },
  { name: '威圧',       base: 15, category: '対人' },
  { name: '信用',       base: 0,  category: '対人' },
  { name: '心理学',     base: 10, category: '対人' },
  // 知識
  { name: '応急手当',       base: 30, category: '知識' },
  { name: '医学',           base: 1,  category: '知識' },
  { name: 'オカルト',       base: 5,  category: '知識' },
  { name: '考古学',         base: 1,  category: '知識' },
  { name: '歴史',           base: 5,  category: '知識' },
  { name: 'クトゥルフ神話', base: 0,  category: '知識' },
  { name: '法律',           base: 5,  category: '知識' },
  { name: '精神分析',       base: 1,  category: '知識' },
  { name: '自然',           base: 10, category: '知識' },
  { name: '科学（生物学）', base: 1,  category: '知識' },
  { name: '科学（薬学）',   base: 1,  category: '知識' },
  { name: '科学（数学）',   base: 10, category: '知識' },
  { name: '科学（物理学）', base: 1,  category: '知識' },
  // 行動
  { name: '水泳', base: 20, category: '行動' },
  { name: '跳躍', base: 20, category: '行動' },
  { name: '登攀', base: 20, category: '行動' },
  { name: '投擲', base: 20, category: '行動' },
  { name: '乗馬', base: 5,  category: '行動' },
  // 隠密
  { name: '変装',   base: 5,  category: '隠密' },
  { name: '隠密',   base: 20, category: '隠密' },
  { name: '手さばき', base: 10, category: '隠密' },
  { name: '鍵開け', base: 1,  category: '隠密' },
  // 技術
  { name: 'コンピューター',   base: 5,  category: '技術' },
  { name: '電子工学',         base: 1,  category: '技術' },
  { name: '機械修理',         base: 10, category: '技術' },
  { name: '運転（自動車）',   base: 20, category: '技術' },
  { name: '爆発物',           base: 1,  category: '技術' },
  { name: '写真術',           base: 5,  category: '技術' },
  { name: '操縦（航空機）',   base: 1,  category: '技術' },
  // 言語
  { name: '言語（母語）', base: 'EDU', category: '言語' },
  { name: '言語（他）',   base: 1,     category: '言語' },
  // 芸術
  { name: '芸術/製作（演技）', base: 5, category: '芸術' },
  { name: '芸術/製作（絵画）', base: 5, category: '芸術' },
  { name: '芸術/製作（音楽）', base: 5, category: '芸術' },
  { name: '芸術/製作（文芸）', base: 5, category: '芸術' },
];

const FORMULA_OPTIONS = [
  { key: 'EDU4',              label: 'EDU × 4',                   calc: (s) => s.edu * 4 },
  { key: 'EDU2STR2',          label: 'EDU×2 + STR×2',             calc: (s) => s.edu * 2 + s.str * 2 },
  { key: 'EDU2DEX2',          label: 'EDU×2 + DEX×2',             calc: (s) => s.edu * 2 + s.dex * 2 },
  { key: 'EDU2POW2',          label: 'EDU×2 + POW×2',             calc: (s) => s.edu * 2 + s.pow * 2 },
  { key: 'EDU2INT2',          label: 'EDU×2 + INT×2',             calc: (s) => s.edu * 2 + s.int * 2 },
  { key: 'EDU2maxSTRDEX2',    label: 'EDU×2 + (STR or DEX)×2',   calc: (s) => s.edu * 2 + Math.max(s.str, s.dex) * 2 },
  { key: 'EDU2maxDEXPOW2',    label: 'EDU×2 + (DEX or POW)×2',   calc: (s) => s.edu * 2 + Math.max(s.dex, s.pow) * 2 },
  { key: 'EDU2maxSTRPOW2',    label: 'EDU×2 + (STR or POW)×2',   calc: (s) => s.edu * 2 + Math.max(s.str, s.pow) * 2 },
  { key: 'EDU2maxDEXSTR2',    label: 'EDU×2 + (DEX or STR)×2',   calc: (s) => s.edu * 2 + Math.max(s.dex, s.str) * 2 },
];

function rollDice(count, sides) {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}
