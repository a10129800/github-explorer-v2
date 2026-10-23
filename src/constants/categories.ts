import { CategoryItem } from '../types';

export const EXPLORATION_CATEGORIES: CategoryItem[] = [
  {
    id: 'ai-ml',
    name: 'AI 與機器學習',
    enName: 'AI & Machine Learning',
    icon: 'Brain',
    description: '涵蓋大語言模型 (LLM)、推理框架、本地推論與深度學習實用專案。',
    query: 'topic:machine-learning OR topic:llm stars:>200',
    tags: ['llm', 'deep-learning', 'rag', 'pytorch']
  },
  {
    id: 'ai-media',
    name: 'AI 圖片、影片與音訊生成',
    enName: 'Generative Media',
    icon: 'Sparkles',
    description: '文字生成圖像、AI 影片生成、即時語音克隆與擴散模型。',
    query: 'topic:generative-ai OR topic:text-to-video OR topic:stable-diffusion stars:>100',
    tags: ['text-to-video', 'diffusion', 'audio-generation', 'tts']
  },
  {
    id: '3d-animation',
    name: '3D 模型與動畫',
    enName: '3D Models & Motion',
    icon: 'Box',
    description: 'WebGL, Three.js, 著色器 (Shaders), 3D 渲染與高斯潑濺 (Gaussian Splatting)。',
    query: 'topic:threejs OR topic:webgl OR topic:3d-graphics stars:>100',
    tags: ['threejs', 'webgl', 'gaussian-splatting', 'shader']
  },
  {
    id: 'games-interactive',
    name: '遊戲與互動作品',
    enName: 'Games & Interactive',
    icon: 'Gamepad2',
    description: '開源網頁遊戲、Godot 引擎開源作品、趣味實體模擬與互動玩具。',
    query: 'topic:game OR topic:browser-game OR topic:game-engine stars:>100',
    tags: ['browser-game', 'godot', 'canvas-game', 'gamedev']
  },
  {
    id: 'creative-web',
    name: '網頁與創意實驗',
    enName: 'Creative Coding & Web Experiments',
    icon: 'Palette',
    description: '充滿靈感的生成藝術、趣味 CSS/Canvas 實驗與新奇前端互動。',
    query: 'topic:creative-coding OR topic:generative-art stars:>80',
    tags: ['creative-coding', 'generative-art', 'p5js', 'experiments']
  },
  {
    id: 'automation',
    name: '自動化工具',
    enName: 'Automation & Bots',
    icon: 'Cpu',
    description: '網路爬蟲、定時機器人、跨平台工作流與省時腳本。',
    query: 'topic:automation OR topic:scraper OR topic:workflow stars:>150',
    tags: ['automation', 'bot', 'scraper', 'workflow']
  },
  {
    id: 'productivity',
    name: '生產力工具',
    enName: 'Productivity & CLI',
    icon: 'Zap',
    description: '終端機神兵利器 (CLI/TUI)、自託管 (Self-hosted) 與效率提升工具。',
    query: 'topic:productivity OR topic:cli OR topic:self-hosted stars:>200',
    tags: ['self-hosted', 'cli', 'tui', 'homelab']
  },
  {
    id: 'data-vis',
    name: '資料視覺化',
    enName: 'Data Visualization',
    icon: 'BarChart3',
    description: '數據儀表板、互動圖表 (D3/ECharts)、地圖可視化與資訊圖表。',
    query: 'topic:data-visualization OR topic:charts OR topic:dataviz stars:>100',
    tags: ['dataviz', 'd3', 'dashboard', 'charts']
  },
  {
    id: 'mobile-android',
    name: '手機與 Android',
    enName: 'Mobile & Android Apps',
    icon: 'Smartphone',
    description: '實用的開源 Android 應用程式、Flutter 跨平台專案與逆向分析輔助。',
    query: 'topic:android OR topic:flutter stars:>150',
    tags: ['android', 'flutter', 'react-native', 'mobile']
  },
  {
    id: 'niche-gems',
    name: '冷門寶藏',
    enName: 'Hidden Gems',
    icon: 'Gem',
    description: '低於 2,500 Star 但質量極高、創意滿點且持續維護的小眾神作。',
    query: 'stars:50..2500 pushed:>=2024-01-01',
    tags: ['hidden-gem', 'underrated', 'niche', 'curated'],
    highlight: true
  },
  {
    id: 'emerging-new',
    name: '新興專案',
    enName: 'Emerging & Fresh',
    icon: 'Flame',
    description: '最近幾個月內誕生、迅速受到開源社群矚目的前鋒專案。',
    query: 'created:>=2024-06-01 stars:>50',
    tags: ['new-release', 'trending', 'cutting-edge']
  },
  {
    id: 'beginner-friendly',
    name: '適合初學者的專案',
    enName: 'Beginner Friendly',
    icon: 'GraduationCap',
    description: '擁有清晰文件、架構單純，且歡迎新手提交 PR 的優質學習寶庫。',
    query: 'topic:beginner-friendly OR topic:good-first-issue stars:>100',
    tags: ['good-first-issue', 'beginner-friendly', 'starter-kit']
  }
];

export const PRESET_SEARCH_QUERIES = [
  'AI video generation',
  'text to 3D',
  'open source browser games',
  'creative coding',
  'self hosted tools',
  'awesome developer tools',
  'unusual GitHub projects',
  'beginner friendly open source projects'
];

export const PROGRAMMING_LANGUAGES = [
  { id: 'all', name: '全部語言' },
  { id: 'TypeScript', name: 'TypeScript' },
  { id: 'JavaScript', name: 'JavaScript' },
  { id: 'Python', name: 'Python' },
  { id: 'Rust', name: 'Rust' },
  { id: 'Go', name: 'Go' },
  { id: 'C++', name: 'C++' },
  { id: 'C', name: 'C' },
  { id: 'C#', name: 'C#' },
  { id: 'Java', name: 'Java' },
  { id: 'Swift', name: 'Swift' },
  { id: 'Kotlin', name: 'Kotlin' },
  { id: 'Dart', name: 'Dart' },
  { id: 'PHP', name: 'PHP' },
  { id: 'Ruby', name: 'Ruby' },
  { id: 'Shell', name: 'Shell / Bash' },
  { id: 'HTML', name: 'HTML / CSS' }
];

export const STAR_RANGES = [
  { id: 'any', name: '不限 Star 數' },
  { id: '10..500', name: '💎 冷門潛力 (10 ~ 500)' },
  { id: '500..2500', name: '⭐ 精緻寶藏 (500 ~ 2,500)' },
  { id: '2500..10000', name: '🔥 口碑成熟 (2,500 ~ 10,000)' },
  { id: '10000..*', name: '👑 殿堂熱門 (10,000+)' }
];

export const UPDATE_TIMES = [
  { id: 'any', name: '不限更新時間' },
  { id: '7d', name: '近 7 天內更新' },
  { id: '30d', name: '近 30 天內更新' },
  { id: '90d', name: '近 3 個月內更新' },
  { id: '1y', name: '近 1 年內更新' }
];

export const CREATED_TIMES = [
  { id: 'any', name: '不限建立時間' },
  { id: '30d', name: '🐣 近 30 天內誕生新專案' },
  { id: '90d', name: '🌱 近 90 天內誕生新專案' },
  { id: '1y', name: '🌲 近 1 年內創立' }
];

export const SORT_OPTIONS = [
  { id: 'treasure', name: '🔮 寶藏推薦指數 (最富探索價值)' },
  { id: 'stars', name: '⭐ Star 數量 (熱門到冷門)' },
  { id: 'updated', name: '⚡ 最近活躍更新' },
  { id: 'forks', name: '🍴 Fork 復刻次數' },
  { id: 'best-match', name: '🎯 關鍵字最吻合' }
];
