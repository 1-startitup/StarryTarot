const videoElement = document.getElementById('input_video');
const canvasCtx = document.getElementById('output_canvas').getContext('2d');
const gCtx = document.getElementById('gameCanvas').getContext('2d');

const statusText = document.getElementById('status-text');
const statusSubtext = document.getElementById('status-subtext');
const modeBadge = document.getElementById('mode-badge');
const revealKicker = document.getElementById('reveal-kicker');
const revealTitle = document.getElementById('reveal-title');
const readingSummary = document.getElementById('reading-summary');
const finalNarrative = document.getElementById('final-narrative');
const menuEyebrow = document.getElementById('menu-eyebrow');
const menuCopy = document.getElementById('menu-copy');
const legalNote = document.getElementById('legal-note');
const langEnButton = document.getElementById('lang-en');
const langZhButton = document.getElementById('lang-zh');
const oracleQuestionInput = document.getElementById('oracle-question');
const askOracleButton = document.getElementById('ask-oracle');
const oracleResponse = document.getElementById('oracle-response');
const deckMajorButton = document.getElementById('deck-major');
const deckFullButton = document.getElementById('deck-full');
const deckCopy = document.getElementById('deck-copy');
const deckCountPill = document.getElementById('deck-count-pill');
const modeCardTitleGeneral = document.getElementById('mode-card-title-general');
const modeCardCopyGeneral = document.getElementById('mode-card-copy-general');
const modeCardTitleRomance = document.getElementById('mode-card-title-romance');
const modeCardCopyRomance = document.getElementById('mode-card-copy-romance');
const notePills = [0, 1, 2].map((index) => document.getElementById(`note-pill-${index}`));
const guideTitleEls = [0, 1, 2].map((index) => document.getElementById(`guide-title-${index}`));
const guideCopyEls = [0, 1, 2].map((index) => document.getElementById(`guide-copy-${index}`));
const spreadHeading = document.getElementById('spread-heading');
const oracleHeading = document.getElementById('oracle-heading');
const oracleCopy = document.getElementById('oracle-copy');
const oracleLabel = document.getElementById('oracle-label');
const promptChipButtons = [0, 1, 2].map((index) => document.getElementById(`prompt-chip-${index}`));
const drawAgainButton = document.getElementById('draw-again-btn');
const changeModeButton = document.getElementById('change-mode-btn');
const cameraLabel = document.getElementById('camera-label');

let rotation = 0;
let rotationVel = 0;
let lastHandX = 0.5;
let handPresent = false;
let edgeCarry = null;
let isPinching = false;
let pinchTimer = 0;
let pinchCooldown = 0;
let selectedCards = [];
let currentStep = 0;
let appMode = 'general';
let deckMode = 'full';
let currentLanguage = 'en';
let activeDeck = [];
let particles = [];
let cameraStarted = false;

const imgCache = {};

const IMAGE_ROOT = 'https://www.sacred-texts.com/tarot/pkt/img/';
const PINCH_FRAMES = 18;
const PINCH_COOLDOWN_FRAMES = 12;
const SWIPE_GAIN = 0.78;
const MAX_ROTATION_VEL = 0.24;
const EDGE_LOW = 0.14;
const EDGE_HIGH = 0.86;
const EDGE_CARRY_FRAMES = 18;
const SWIPE_THRESHOLD = 0.004;

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

const TIP_INDICES = [4, 8, 12, 16, 20];
const SUIT_FOCUS = {
  wands: 'action, momentum, and creative drive',
  cups: 'emotion, intuition, and connection',
  swords: 'truth, communication, and decisions',
  pentacles: 'work, stability, and tangible progress'
};

const MINOR_FILE_PREFIX = {
  wands: 'Wands',
  cups: 'Cups',
  swords: 'Swords',
  pentacles: 'Pents'
};

const MINOR_RANK_NUMBER = {
  ace: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  page: 11,
  knight: 12,
  queen: 13,
  king: 14
};

const MINOR_FILE_OVERRIDES = {
  'wands:nine': 'Tarot_Nine_of_Wands.jpg'
};

const THEMES = {
  general: {
    accent: '#d8b671',
    accentBright: '#f6e6ba',
    accentGlow: 'rgba(216, 182, 113, 0.45)',
    secondary: '#79d4e4',
    particle: 'rgba(245, 223, 168, 0.7)',
    particleSoft: 'rgba(121, 212, 228, 0.35)',
    bgTop: '#071223',
    bgBottom: '#02040a',
    aura: 'rgba(70, 130, 180, 0.28)',
    ring: 'rgba(216, 182, 113, 0.18)'
  },
  romance: {
    accent: '#f3b0a6',
    accentBright: '#ffe5dd',
    accentGlow: 'rgba(243, 176, 166, 0.45)',
    secondary: '#ffc1c8',
    particle: 'rgba(255, 217, 205, 0.76)',
    particleSoft: 'rgba(255, 193, 200, 0.4)',
    bgTop: '#220710',
    bgBottom: '#070209',
    aura: 'rgba(176, 69, 101, 0.3)',
    ring: 'rgba(243, 176, 166, 0.2)'
  }
};

const MODE_CONFIG = {
  general: {
    label: 'General Reading',
    kicker: 'Three-card life guidance',
    positions: [
      {
        label: 'Past',
        hint: 'what shaped the current situation',
        noteTitle: 'What still echoes from before'
      },
      {
        label: 'Present',
        hint: 'what needs your attention right now',
        noteTitle: 'What is most active right now'
      },
      {
        label: 'Future',
        hint: 'where this path is most likely heading',
        noteTitle: 'What the next chapter is asking for'
      }
    ],
    openers: [
      'This spread reads like a sequence of choices and responses, not a fixed prophecy.',
      'These three cards describe a process you can work with, not a script you have to obey.',
      'The clearest way to read this spread is to treat it as a pattern you can respond to.'
    ],
    closers: [
      'The useful part of the reading is the direction it gives you, not trying to force every detail to happen exactly this way.',
      'The cards are most helpful when they point out the pattern and leave room for you to choose the better response.',
      'Think of this as guidance for your next move, not a sentence about your future.'
    ]
  },
  romance: {
    label: 'Romance Reading',
    kicker: 'Three-card relationship reading',
    positions: [
      {
        label: 'Your Heart',
        hint: 'what you are emotionally carrying into the connection',
        noteTitle: 'What your side of the connection is carrying'
      },
      {
        label: 'Their Heart',
        hint: 'what the other person seems to be bringing in',
        noteTitle: 'What their side seems to be carrying'
      },
      {
        label: 'The Union',
        hint: 'what the relationship becomes if the pattern continues',
        noteTitle: 'What the connection is becoming'
      }
    ],
    openers: [
      'This spread is easier to trust when it is read as relationship behavior rather than pure mystery.',
      'The cards here describe how emotion, timing, and effort are interacting inside the connection.',
      'The relationship becomes clearer when each card is translated into practical emotional dynamics.'
    ],
    closers: [
      'The value of this reading is seeing what kind of honesty or boundary would make the connection healthier.',
      'Use the spread to name the pattern clearly instead of romanticizing it.',
      'The cards are not saying love is guaranteed or impossible; they are showing the conditions around it.'
    ]
  }
};

const MODE_UI_COPY = {
  general: {
    label: {
      en: 'General Reading',
      zh: '综合占卜'
    },
    kicker: {
      en: 'Three-card life guidance',
      zh: '三张牌生活指引'
    },
    cardTitle: {
      en: 'General Reading',
      zh: '综合占卜'
    },
    cardCopy: {
      en: 'A simple three-card reading for your situation: where it started, what matters now, and where it may lead.',
      zh: '用三张牌快速看清你的处境：事情从哪里开始、现在最重要的点，以及接下来可能的发展。'
    },
    positions: [
      {
        label: {
          en: 'Past',
          zh: '过去'
        },
        hint: {
          en: 'It represents what shaped the current situation',
          zh: '它代表这件事是如何走到现在的'
        },
        noteTitle: {
          en: 'What still echoes from before',
          zh: '过去留下来的影响'
        }
      },
      {
        label: {
          en: 'Present',
          zh: '现在'
        },
        hint: {
          en: 'It represents what needs your attention right now',
          zh: '它代表你现在最需要注意的重点'
        },
        noteTitle: {
          en: 'What is most active right now',
          zh: '目前最强的能量'
        }
      },
      {
        label: {
          en: 'Future',
          zh: '未来'
        },
        hint: {
          en: 'It represents where this path is most likely heading',
          zh: '它代表如果照现在这样走，接下来最可能的发展'
        },
        noteTitle: {
          en: 'What the next chapter is asking for',
          zh: '下一步在提醒你的事'
        }
      }
    ]
  },
  romance: {
    label: {
      en: 'Romance Reading',
      zh: '感情占卜'
    },
    kicker: {
      en: 'Three-card relationship reading',
      zh: '三张牌感情占卜'
    },
    cardTitle: {
      en: 'Romance Reading',
      zh: '感情占卜'
    },
    cardCopy: {
      en: 'Look at your feelings, their energy, and what the relationship may become if the pattern continues.',
      zh: '看看你的感受、对方的状态，以及这段关系如果继续这样发展，会走向哪里。'
    },
    positions: [
      {
        label: {
          en: 'Your Heart',
          zh: '你的心'
        },
        hint: {
          en: 'It represents what you are emotionally carrying into the connection',
          zh: '它代表你带进这段关系的情绪和想法'
        },
        noteTitle: {
          en: 'What your side of the connection is carrying',
          zh: '你这一方正在带着什么'
        }
      },
      {
        label: {
          en: 'Their Heart',
          zh: '对方的心'
        },
        hint: {
          en: 'It represents what the other person seems to be bringing in',
          zh: '它代表对方目前带着怎样的状态'
        },
        noteTitle: {
          en: 'What their side seems to be carrying',
          zh: '对方这一方正在带着什么'
        }
      },
      {
        label: {
          en: 'The Union',
          zh: '关系走向'
        },
        hint: {
          en: 'It represents what the relationship becomes if the pattern continues',
          zh: '它代表如果模式不变，这段关系会变成什么样'
        },
        noteTitle: {
          en: 'What the connection is becoming',
          zh: '这段关系正在走向什么'
        }
      }
    ]
  }
};

const QUESTION_TOPICS = [
  {
    key: 'career',
    label: {
      en: 'work or direction',
      zh: '工作或方向'
    },
    pattern: /job|career|work|boss|office|business|project|school|study|major|promotion|application|path|工作|事业|方向|老板|项目|学校|学业|申请/
  },
  {
    key: 'love',
    label: {
      en: 'love or relationship',
      zh: '感情或关系'
    },
    pattern: /love|relationship|dating|partner|boyfriend|girlfriend|marriage|heart|crush|romance|感情|爱情|关系|对象|恋爱|婚姻|喜欢/
  },
  {
    key: 'money',
    label: {
      en: 'money or stability',
      zh: '金钱或稳定'
    },
    pattern: /money|finance|financial|debt|income|rent|salary|budget|stability|security|钱|财务|收入|工资|预算|稳定|安全感/
  },
  {
    key: 'family',
    label: {
      en: 'family or home life',
      zh: '家庭或家里'
    },
    pattern: /family|parent|mother|father|home|house|sibling|child|家庭|父母|妈妈|爸爸|家里|兄弟|姐妹|孩子/
  },
  {
    key: 'communication',
    label: {
      en: 'communication',
      zh: '沟通'
    },
    pattern: /say|talk|speak|text|message|conversation|contact|reach out|reply|沟通|联系|说|消息|回复|聊天|谈/
  },
  {
    key: 'decision',
    label: {
      en: 'a decision',
      zh: '一个决定'
    },
    pattern: /should|choose|decision|stay|leave|go|move|accept|decline|是否|要不要|选择|决定|留下|离开|前进|接受|放弃/
  }
];

const DECK_CONFIG = {
  major: {
    label: {
      en: 'Major Arcana',
      zh: '大阿卡那'
    },
    countLabel: {
      en: '22-card major deck',
      zh: '22张大阿卡那'
    },
    menuCopy: {
      en: 'Major Arcana keeps the reading focused on larger life chapters, turning points, and the big lesson underneath the moment.',
      zh: '大阿卡那更适合看大方向、重要转折，以及这件事背后的核心课题。'
    },
    readingLabel: {
      en: 'Major Arcana',
      zh: '大阿卡那'
    }
  },
  full: {
    label: {
      en: 'Full Tarot',
      zh: '完整塔罗'
    },
    countLabel: {
      en: '78-card full deck',
      zh: '78张完整牌组'
    },
    menuCopy: {
      en: 'Full Tarot includes all 56 minor arcana, so the reading can get more specific about everyday emotions, decisions, work, and timing.',
      zh: '完整塔罗会加入56张小阿卡那，所以解读会更贴近日常情绪、决定、工作和时间节奏。'
    },
    readingLabel: {
      en: 'Full Tarot',
      zh: '完整塔罗'
    }
  }
};

const UI_COPY = {
  en: {
    menuEyebrow: 'Gesture-guided tarot reading',
    menuCopy: 'Move your hand to browse the deck. Pinch to choose each card. Draw three cards to get a short reading based on the exact spread you pulled.',
    legalNote: 'For amusement only. Tarot is not legal, medical, financial, or mental health advice.',
    guide: [
      {
        title: '1. Move Your Hand',
        copy: 'Sweep left or right to browse the deck.'
      },
      {
        title: '2. Pinch To Draw',
        copy: 'Hold a clear thumb-to-index pinch on the front card.'
      },
      {
        title: '3. Ask Your Question',
        copy: 'Use the final spread to ask about your dilemma.'
      }
    ],
    notePills: [
      'No repeat cards in one spread',
      'Continuous edge swipe',
      'Plain-language reading'
    ],
    waiting: 'Waiting',
    hudBrowse: 'Move your hand to browse',
    hudChoose: 'Choose the card for {position}',
    hudSubtext: 'Keep your hand open to move the deck. When the front card feels right, make a clear thumb-to-index pinch. {hint}.',
    hudComplete: 'Reading complete',
    hudReady: 'Your spread is ready.',
    spreadHeading: 'How the spread reads',
    oracleHeading: 'Ask the Cards',
    oracleCopy: 'Feeling confused or stuck? Ask one clear question about your current dilemma and the cards will answer based on the spread you drew.',
    oraclePrompts: [
      {
        label: 'What am I missing?',
        value: 'What am I not seeing clearly in this situation?'
      },
      {
        label: 'Move forward or pause?',
        value: 'Should I move forward, pause, or let this go?'
      },
      {
        label: 'Healthiest next step',
        value: 'What would be the healthiest next step for me right now?'
      }
    ],
    oracleLabel: 'Your question',
    oraclePlaceholder: 'Example: Should I stay in this job, or is it time to move on?',
    askOracle: 'Ask the Cards',
    oracleEmpty: 'Ask about your confusion, and the spread will answer in plain language.',
    oracleMissingQuestion: 'Write one clear question first, then ask the cards again.',
    oracleQuestionPrefix: 'Question',
    drawAgain: 'Draw Again',
    changeMode: 'Change Mode',
    cameraLabel: 'Gesture Skeleton'
  },
  zh: {
    menuEyebrow: '手势控制塔罗体验',
    menuCopy: '用手在牌组中移动，捏合选牌。抽出三张牌后，你会看到一段根据这组牌专门生成的简明解读。',
    legalNote: '仅供娱乐。塔罗不能替代法律、医疗、财务或心理健康建议。',
    guide: [
      {
        title: '1. 移动手势',
        copy: '左右挥动手来浏览牌组。'
      },
      {
        title: '2. 捏合抽牌',
        copy: '在最前面的牌上做清晰的拇指食指捏合。'
      },
      {
        title: '3. 提出问题',
        copy: '用最后的三张牌去询问你的困惑。'
      }
    ],
    notePills: [
      '同一局不会抽到重复牌',
      '滑到边缘后可连续接回',
      '解读尽量直白易懂'
    ],
    waiting: '等待抽牌',
    hudBrowse: '移动手来浏览牌组',
    hudChoose: '选择代表{position}的牌',
    hudSubtext: '张开手掌来移动牌组。当前面的牌适合你时，用拇指和食指做一个明确的捏合动作。{hint}。',
    hudComplete: '解读完成',
    hudReady: '你的牌阵已经准备好了。',
    spreadHeading: '这组三张牌怎么读',
    oracleHeading: '向牌提问',
    oracleCopy: '如果你现在有点困惑，就输入一个清楚的问题。系统会根据你抽到的三张牌来回答。',
    oraclePrompts: [
      {
        label: '我忽略了什么？',
        value: '我在这件事上还有什么没有看清？'
      },
      {
        label: '该前进还是暂停？',
        value: '我现在应该继续往前，先暂停，还是放手？'
      },
      {
        label: '最健康的下一步',
        value: '对我来说，现在最健康的下一步是什么？'
      }
    ],
    oracleLabel: '你的问题',
    oraclePlaceholder: '例如：我应该继续这份工作，还是该离开了？',
    askOracle: '向牌提问',
    oracleEmpty: '输入你的困惑后，牌会用更直白的方式回应你。',
    oracleMissingQuestion: '请先写下一个清楚的问题，再向牌提问。',
    oracleQuestionPrefix: '问题',
    drawAgain: '重新抽牌',
    changeMode: '切换模式',
    cameraLabel: '手势骨架'
  }
};

const SUIT_ZH = {
  wands: {
    plural: '权杖',
    domainLabel: '行动与热情',
    generalFocus: '工作、行动力与推进',
    loveFocus: '吸引力、追求和明显的热情',
    starterAdvice: '先把想法真正做出来。',
    keywords: ['行动', '热情'],
    readingFocus: '动力、行动和看得见的投入'
  },
  cups: {
    plural: '圣杯',
    domainLabel: '情绪与直觉',
    generalFocus: '情绪、关系和内在感受',
    loveFocus: '情感交流、脆弱感与回应',
    starterAdvice: '先把真实感受说清楚。',
    keywords: ['情感', '连结'],
    readingFocus: '情绪、脆弱感和关系里的诚实'
  },
  swords: {
    plural: '宝剑',
    domainLabel: '思考与真相',
    generalFocus: '判断、沟通和必要的决定',
    loveFocus: '诚实、对话和心理压力',
    starterAdvice: '尽快把关键的话说清楚。',
    keywords: ['真相', '决定'],
    readingFocus: '沟通、真相和难做的选择'
  },
  pentacles: {
    plural: '星币',
    domainLabel: '稳定与建设',
    generalFocus: '实际进度、习惯和物质安全感',
    loveFocus: '可靠、日常投入和把关系落到现实',
    starterAdvice: '让下一步更具体、更能落地。',
    keywords: ['稳定', '成长'],
    readingFocus: '日常习惯、安全感和实际执行'
  }
};

const RANK_ZH = {
  ace: {
    label: '王牌',
    keyword: '开端',
    theme: '新的开始',
    shadow: '因为犹豫而错过开局',
    introTemplate: '{focus}这件事上，新的火花正在出现。',
    generalTemplate: '与{generalFocus}有关的新起点已经打开，越早行动越有帮助。',
    loveTemplate: '在感情里，这表示围绕{loveFocus}出现新的开始，前提是有人愿意先把话说明白。',
    adviceTemplate: '把它当成真正的开始。{starterAdvice}'
  },
  two: {
    label: '二',
    keyword: '选择',
    theme: '明确方向',
    shadow: '在选项之间来回摇摆',
    introTemplate: '二号牌讲的是平衡、两种方向，以及你要如何做出选择。',
    generalTemplate: '你正在{generalFocus}上来回衡量，下一步取决于你能不能更清楚地做决定。',
    loveTemplate: '在感情里，这常常代表围绕{loveFocus}的摇摆，需要更明确的态度。',
    adviceTemplate: '把选项简化，然后选一条你真的能承担的路。'
  },
  three: {
    label: '三',
    keyword: '成长',
    theme: '开始扩张',
    shadow: '只想被看见，却没有真正打底',
    introTemplate: '三号牌说明事情开始扩张，能量也慢慢长出来了。',
    generalTemplate: '进展来自合作、曝光度，以及让{generalFocus}真正开始成形。',
    loveTemplate: '感情会因为共享热情而成长，前提是把{loveFocus}真正表达出来。',
    adviceTemplate: '让这股势头被看见，也被认真支持。'
  },
  four: {
    label: '四',
    keyword: '基础',
    theme: '站稳脚跟',
    shadow: '舒服到不肯再成长',
    introTemplate: '四号牌让能量稳定下来，也提醒你去检查基础是否真的稳。',
    generalTemplate: '这张牌希望你先为{generalFocus}建立更稳的结构，再继续往前冲。',
    loveTemplate: '在关系里，它要求安全感、稳定感，以及能承接{loveFocus}的基础。',
    adviceTemplate: '先守住有效的部分，但别把舒适误当成进步。'
  },
  five: {
    label: '五',
    keyword: '摩擦',
    theme: '必须调整',
    shadow: '把每个分歧都升级成冲突',
    introTemplate: '五号牌会带来摩擦、压力或考验，让问题没有办法再被忽视。',
    generalTemplate: '围绕{generalFocus}的紧张正在逼你调整方向，因为冲突已经暴露出真正的问题。',
    loveTemplate: '在感情里，这可能表示自尊碰撞、时机不合，或围绕{loveFocus}的反应过度。',
    adviceTemplate: '先把戏剧性降下来，处理真正的问题。'
  },
  six: {
    label: '六',
    keyword: '缓和',
    theme: '重新顺起来',
    shadow: '过度依赖外界认可',
    introTemplate: '六号牌让事情重新顺起来，说明艰难之后开始有回流。',
    generalTemplate: '在{generalFocus}上，支持、进展或缓解已经出现，只要你愿意接受帮助或分享成果。',
    loveTemplate: '这会给关系带来更温柔的回应，也让{loveFocus}更容易被接住。',
    adviceTemplate: '看见已经在变好的部分，并继续把它养大。'
  },
  seven: {
    label: '七',
    keyword: '评估',
    theme: '谨慎判断',
    shadow: '活在怀疑里，或把幻想当现实',
    introTemplate: '七号牌会把速度放慢，让你判断什么才值得相信。',
    generalTemplate: '在{generalFocus}上，你需要策略和辨别力，不是每个选项都值得同样的投入。',
    loveTemplate: '在感情里，这张牌会问你：围绕{loveFocus}的判断，到底来自信任、幻想，还是防备？',
    adviceTemplate: '有选择地投入，并诚实看待这件事到底值不值得。'
  },
  eight: {
    label: '八',
    keyword: '纪律',
    theme: '稳定发力',
    shadow: '陷进机械重复',
    introTemplate: '八号牌会让节奏变得更集中，说明局势正在加速成形。',
    generalTemplate: '在{generalFocus}上，现在最重要的是稳定练习和持续投入，重复会开始产生效果。',
    loveTemplate: '在关系里，{loveFocus}会越来越直接，所以比起承诺，持续的行为更重要。',
    adviceTemplate: '把稳定的功课做好，让重复帮你堆出结果。'
  },
  nine: {
    label: '九',
    keyword: '成熟',
    theme: '成熟后的立场',
    shadow: '受过伤后过度防备',
    introTemplate: '九号牌说明事情已经走到接近完成的位置，也在考验你如何守住自己。',
    generalTemplate: '你在{generalFocus}上已经学到了很多，现在的重点是保护能量，并把最后一段走稳。',
    loveTemplate: '在感情里，这常常代表成熟、自尊，以及围绕{loveFocus}更清楚的标准。',
    adviceTemplate: '尊重经验带给你的判断，然后按这个成熟度去行动。'
  },
  ten: {
    label: '十',
    keyword: '高峰',
    theme: '走到转折点',
    shadow: '背负超过自己能承受的重量',
    introTemplate: '十号牌把这一组花色的能量推到顶点，可能是圆满，也可能是过重。',
    generalTemplate: '围绕{generalFocus}的发展已经来到高点，现在要分辨哪些值得继续，哪些已经太重。',
    loveTemplate: '在感情里，这可能是满足，也可能是压垮人的负担，关键看{loveFocus}是否平衡。',
    adviceTemplate: '留下真正重要的，放下已经太重的部分。'
  },
  page: {
    label: '侍者',
    keyword: '好奇',
    theme: '带着好奇试试看',
    shadow: '不成熟或后续跟不上',
    introTemplate: '侍者带着好奇、真诚和学习心态，事情还在摸索阶段。',
    generalTemplate: '在{generalFocus}上，消息、尝试或学习期已经开始。',
    loveTemplate: '在感情里，它可能代表新鲜的好感、略显笨拙的真心，或还不够成熟的情绪表达。',
    adviceTemplate: '可以保持开放，但说了要做的事也要跟上。'
  },
  knight: {
    label: '骑士',
    keyword: '推进',
    theme: '明显的追赶与推进',
    shadow: '冲得太快却没想清楚',
    introTemplate: '骑士行动很快，说明这股能量已经变得很难忽视。',
    generalTemplate: '围绕{generalFocus}的势头正在增强，事情可能比你预期更快发生。',
    loveTemplate: '在感情里，这会带来明显追求和积极动作，但速度还是需要方向。',
    adviceTemplate: '先果断行动，再确认自己的节奏是否真的合适。'
  },
  queen: {
    label: '王后',
    keyword: '掌握',
    theme: '成熟而稳的自我掌控',
    shadow: '嘴上说没事，心里却一直压着',
    introTemplate: '王后对这组花色的能量非常熟悉，也知道如何稳定地使用它。',
    generalTemplate: '在{generalFocus}上，真正的掌控来自情绪智慧和自我管理。',
    loveTemplate: '在关系里，王后要求成熟、体贴，以及更稳地处理{loveFocus}。',
    adviceTemplate: '带着稳定和底气去带动局势，而不是用力压人。'
  },
  king: {
    label: '国王',
    keyword: '领导',
    theme: '负责任的掌舵',
    shadow: '只有控制，没有温度',
    introTemplate: '国王代表权威、领导和责任，说明这股能量已经走到成熟的一端。',
    generalTemplate: '在{generalFocus}上，现在需要领导力和明确标准，尤其当别人也在等你表态时。',
    loveTemplate: '在感情里，这张牌强调成熟负责，真正可靠比好听的话更重要。',
    adviceTemplate: '把态度说清楚，也用稳定的行动让人看见。'
  }
};

const SUIT_DEFS = [
  {
    key: 'wands',
    plural: 'Wands',
    domainLabel: 'Fire and initiative',
    generalFocus: 'work, motivation, and the courage to act',
    loveFocus: 'attraction, pursuit, and visible passion',
    starterAdvice: 'Put the idea in motion instead of only imagining it.',
    keywords: ['Action', 'Drive'],
    readingFocus: 'motivation, momentum, and visible effort'
  },
  {
    key: 'cups',
    plural: 'Cups',
    domainLabel: 'Feeling and intuition',
    generalFocus: 'emotional truth, relationships, and inner life',
    loveFocus: 'affection, vulnerability, and emotional reciprocity',
    starterAdvice: 'Name the feeling and treat it as useful information.',
    keywords: ['Emotion', 'Connection'],
    readingFocus: 'feelings, vulnerability, and relational honesty'
  },
  {
    key: 'swords',
    plural: 'Swords',
    domainLabel: 'Thought and truth',
    generalFocus: 'clarity, communication, and necessary choices',
    loveFocus: 'honesty, conversations, and mental tension',
    starterAdvice: 'Say the clear thing sooner and let facts guide the next step.',
    keywords: ['Clarity', 'Decision'],
    readingFocus: 'communication, truth, and difficult decisions'
  },
  {
    key: 'pentacles',
    plural: 'Pentacles',
    domainLabel: 'Stability and building',
    generalFocus: 'practical progress, routine, and material security',
    loveFocus: 'dependability, daily effort, and building something real',
    starterAdvice: 'Make the next step tangible, trackable, and sustainable.',
    keywords: ['Stability', 'Growth'],
    readingFocus: 'routine, security, and practical follow-through'
  }
];

const SUIT_MAP = Object.fromEntries(SUIT_DEFS.map((suit) => [suit.key, suit]));

const RANK_DEFS = [
  {
    key: 'ace',
    label: 'Ace',
    tone: 1,
    keywords: ['Beginning'],
    theme: 'fresh beginnings',
    shadow: 'letting the opening fade through hesitation',
    introTemplate: 'A new spark is arriving in the area of {focus}.',
    generalTemplate: 'A beginning is opening around {generalFocus}, and it will respond well to early effort.',
    loveTemplate: 'In love, this suggests a fresh opening around {loveFocus}, especially if someone is willing to be clear first.',
    adviceTemplate: 'Treat this like a real beginning. {starterAdvice}'
  },
  {
    key: 'two',
    label: 'Two',
    tone: 0,
    keywords: ['Choice'],
    theme: 'clear direction',
    shadow: 'drifting between options',
    introTemplate: 'The Two is about balance, duality, and deciding what to do with two live options.',
    generalTemplate: 'You are balancing {generalFocus}, and the next step depends on making a cleaner choice.',
    loveTemplate: 'In love, this often shows back-and-forth energy around {loveFocus} that needs clearer intention.',
    adviceTemplate: 'Simplify the options and choose the path you can actually support.'
  },
  {
    key: 'three',
    label: 'Three',
    tone: 1,
    keywords: ['Growth'],
    theme: 'early growth',
    shadow: 'seeking attention without enough substance',
    introTemplate: 'The Three expands the situation and shows what happens when energy starts to grow.',
    generalTemplate: 'Progress comes through collaboration, visibility, and letting {generalFocus} gain traction.',
    loveTemplate: 'Love grows through shared enthusiasm and making {loveFocus} visible instead of only implied.',
    adviceTemplate: 'Let the momentum be seen and supported instead of kept private.'
  },
  {
    key: 'four',
    label: 'Four',
    tone: 0,
    keywords: ['Foundation'],
    theme: 'stable footing',
    shadow: 'getting too comfortable to grow',
    introTemplate: 'The Four stabilizes the energy and asks whether the foundation is actually solid.',
    generalTemplate: 'This card wants a steadier structure around {generalFocus} before the next push.',
    loveTemplate: 'In relationships, it asks for reassurance, steadiness, and a calm base for {loveFocus}.',
    adviceTemplate: 'Protect what is working, but do not confuse comfort with progress.'
  },
  {
    key: 'five',
    label: 'Five',
    tone: -1,
    keywords: ['Friction'],
    theme: 'course correction',
    shadow: 'turning every difference into a fight',
    introTemplate: 'The Five brings friction, pressure, or a test that exposes what is not working smoothly.',
    generalTemplate: 'Tension around {generalFocus} is forcing a correction, and the conflict matters because it shows what needs adjustment.',
    loveTemplate: 'In love, this can show ego clashes, mixed timing, or reactive behavior around {loveFocus}.',
    adviceTemplate: 'Lower the drama and deal with the actual problem underneath it.'
  },
  {
    key: 'six',
    label: 'Six',
    tone: 1,
    keywords: ['Relief'],
    theme: 'renewed flow',
    shadow: 'depending too much on outside approval',
    introTemplate: 'The Six restores flow and shows movement after a difficult patch.',
    generalTemplate: 'Support, progress, or relief is available around {generalFocus}, especially if you accept help or share credit.',
    loveTemplate: 'This can bring warmer reciprocity and a kinder pace around {loveFocus}.',
    adviceTemplate: 'Notice what is already improving and reinforce it.'
  },
  {
    key: 'seven',
    label: 'Seven',
    tone: 0,
    keywords: ['Assessment'],
    theme: 'careful assessment',
    shadow: 'operating from suspicion or illusion',
    introTemplate: 'The Seven slows the rush so you can assess what is worth trusting.',
    generalTemplate: 'You need strategy and discernment around {generalFocus}; not every option deserves equal energy.',
    loveTemplate: 'In love, it asks whether {loveFocus} is being guided by trust, by fantasy, or by self-protection.',
    adviceTemplate: 'Be selective and honest about what the situation has really earned.'
  },
  {
    key: 'eight',
    label: 'Eight',
    tone: 1,
    keywords: ['Discipline'],
    theme: 'disciplined effort',
    shadow: 'getting trapped in autopilot',
    introTemplate: 'The Eight tightens the focus and makes the pattern more intense.',
    generalTemplate: 'The situation is pushing for disciplined movement around {generalFocus}; repetition and skill matter now.',
    loveTemplate: 'In relationships, the energy becomes more direct, so {loveFocus} will be shaped by consistent behavior rather than promises.',
    adviceTemplate: 'Do the steady work and let repetition build the result.'
  },
  {
    key: 'nine',
    label: 'Nine',
    tone: 1,
    keywords: ['Maturity'],
    theme: 'earned maturity',
    shadow: 'defensiveness after being tested',
    introTemplate: 'The Nine is close to completion and asks how you carry yourself near the finish line.',
    generalTemplate: 'You have learned a great deal around {generalFocus}; now the task is protecting your energy while finishing well.',
    loveTemplate: 'In love, this often points to maturity, self-respect, and clearer standards around {loveFocus}.',
    adviceTemplate: 'Honor what experience has taught you and act from that maturity.'
  },
  {
    key: 'ten',
    label: 'Ten',
    tone: 0,
    keywords: ['Peak'],
    theme: 'a full turning point',
    shadow: 'carrying more than is healthy',
    introTemplate: 'The Ten shows the full weight or fullness of the suit, for better or worse.',
    generalTemplate: 'What began around {generalFocus} has reached a peak, and now you have to decide what is sustainable.',
    loveTemplate: 'In love, this can show fulfillment or overload around {loveFocus}, depending on how balanced the dynamic is.',
    adviceTemplate: 'Keep what is meaningful, and release what has become too heavy to carry.'
  },
  {
    key: 'page',
    label: 'Page',
    tone: 1,
    keywords: ['Curiosity'],
    theme: 'curious exploration',
    shadow: 'immaturity or mixed follow-through',
    introTemplate: 'The Page is curious, honest, and still learning the shape of the situation.',
    generalTemplate: 'News, experimentation, or a learning phase is opening around {generalFocus}.',
    loveTemplate: 'In romance, it can show fresh interest, awkward honesty, or feelings that are real but still immature around {loveFocus}.',
    adviceTemplate: 'Stay open and sincere, but follow through on what you start.'
  },
  {
    key: 'knight',
    label: 'Knight',
    tone: 0,
    keywords: ['Momentum'],
    theme: 'visible pursuit',
    shadow: 'charging ahead without enough reflection',
    introTemplate: 'The Knight moves fast and shows what happens when the suit becomes active and hard to ignore.',
    generalTemplate: 'Momentum is building around {generalFocus}, and events may move faster than expected.',
    loveTemplate: 'In love, this can bring strong pursuit and visible effort around {loveFocus}, but speed still needs direction.',
    adviceTemplate: 'Move decisively, then check whether your pace matches the situation.'
  },
  {
    key: 'queen',
    label: 'Queen',
    tone: 1,
    keywords: ['Mastery'],
    theme: 'mature self-possession',
    shadow: 'withholding while pretending to be fine',
    introTemplate: 'The Queen knows this suit from the inside and uses it with calm control.',
    generalTemplate: 'Mastery grows through emotional intelligence and self-command around {generalFocus}.',
    loveTemplate: 'In relationships, the Queen asks for maturity, generosity, and steadier handling of {loveFocus}.',
    adviceTemplate: 'Lead with grounded confidence rather than force.'
  },
  {
    key: 'king',
    label: 'King',
    tone: 1,
    keywords: ['Leadership'],
    theme: 'responsible leadership',
    shadow: 'control without warmth',
    introTemplate: 'The King expresses the suit with authority, leadership, and responsibility.',
    generalTemplate: 'Leadership and clear standards are needed around {generalFocus}, especially if others are waiting for direction.',
    loveTemplate: 'In love, this points to mature responsibility around {loveFocus}; reliability matters more than big speeches.',
    adviceTemplate: 'Be direct, responsible, and consistent enough that people know where they stand.'
  }
];

const majorArcana = [
  {
    kind: 'major',
    name: 'THE FOOL',
    img: 'ar00.jpg',
    keywords: ['Beginnings', 'Curiosity', 'Risk'],
    intro: 'A fresh chapter, open curiosity, and the willingness to move before every detail is settled.',
    general: 'You are being pushed toward a new experience, and growth will come from trying rather than endlessly preparing.',
    love: 'The connection wants freshness and honesty, but it also needs a little grounding so excitement does not outrun reality.',
    advice: 'Take the next step, but check one practical detail before you leap.',
    shadow: 'careless risk',
    theme: 'fresh starts',
    tone: 1
  },
  {
    kind: 'major',
    name: 'THE MAGICIAN',
    img: 'ar01.jpg',
    keywords: ['Skill', 'Focus', 'Initiative'],
    intro: 'This card is about using what you already have with intention instead of waiting for perfect conditions.',
    general: 'You have more influence over the situation than you think, especially through focused action and clear communication.',
    love: 'Directness, confidence, and real effort matter now more than vague chemistry or mixed signals.',
    advice: 'Use your words and actions consistently so your intentions are easy to trust.',
    shadow: 'manipulation',
    theme: 'self-directed change',
    tone: 1
  },
  {
    kind: 'major',
    name: 'HIGH PRIESTESS',
    img: 'ar02.jpg',
    keywords: ['Intuition', 'Stillness', 'Depth'],
    intro: 'The High Priestess asks for quiet observation and trust in what you sense beneath the surface.',
    general: 'Some truth is still unfolding, so the smartest move is to slow down and listen before forcing a decision.',
    love: 'There are deeper feelings or unspoken realities here, and they will matter more than the loudest surface behavior.',
    advice: 'Pause long enough to notice what your instincts already know.',
    shadow: 'secrecy',
    theme: 'inner knowing',
    tone: 0
  },
  {
    kind: 'major',
    name: 'THE EMPRESS',
    img: 'ar03.jpg',
    keywords: ['Care', 'Abundance', 'Growth'],
    intro: 'This card is warm, creative, and life-giving. It points to what grows when it is truly cared for.',
    general: 'Your situation improves when you create room for support, nourishment, and patient development.',
    love: 'Affection, comfort, and emotional safety are strong themes here, and love deepens when care is shown plainly.',
    advice: 'Choose warmth, generosity, and steady care over control.',
    shadow: 'overindulgence',
    theme: 'growth and care',
    tone: 2
  },
  {
    kind: 'major',
    name: 'THE EMPEROR',
    img: 'ar04.jpg',
    keywords: ['Structure', 'Authority', 'Boundaries'],
    intro: 'The Emperor brings order, responsibility, and the need for firm standards.',
    general: 'This situation needs structure, clear expectations, and someone willing to lead without becoming rigid.',
    love: 'Consistency and emotional maturity matter more than dramatic passion right now.',
    advice: 'Set a clear standard and stay steady with it.',
    shadow: 'rigidity',
    theme: 'structure',
    tone: 0
  },
  {
    kind: 'major',
    name: 'THE HIEROPHANT',
    img: 'ar05.jpg',
    keywords: ['Values', 'Tradition', 'Guidance'],
    intro: 'This card asks what your values really are and whether your choices line up with them.',
    general: 'You may benefit from proven wisdom, a trusted mentor, or a more disciplined way of approaching the problem.',
    love: 'The relationship is asking for shared values, clearer expectations, or a more defined sense of commitment.',
    advice: 'Ask what kind of commitment or principle you actually want to live by.',
    shadow: 'empty conformity',
    theme: 'shared values',
    tone: 0
  },
  {
    kind: 'major',
    name: 'THE LOVERS',
    img: 'ar06.jpg',
    keywords: ['Union', 'Choice', 'Alignment'],
    intro: 'The Lovers is not only about attraction; it is also about choosing what truly matches you.',
    general: 'A meaningful choice is in front of you, and the best path is the one that feels aligned rather than merely convenient.',
    love: 'Strong attraction is present, but the card also asks whether the relationship matches your values and not just your feelings.',
    advice: 'Choose what feels honest and aligned, even if it asks for courage.',
    shadow: 'indecision',
    theme: 'alignment',
    tone: 2
  },
  {
    kind: 'major',
    name: 'THE CHARIOT',
    img: 'ar07.jpg',
    keywords: ['Drive', 'Direction', 'Momentum'],
    intro: 'The Chariot is about movement, discipline, and deciding what direction deserves your energy.',
    general: 'You can make real progress now, but only if your effort is focused instead of split in two directions.',
    love: 'The relationship moves forward when both people stop drifting and decide what they are actually doing here.',
    advice: 'Pick a direction and give it disciplined effort.',
    shadow: 'forceful control',
    theme: 'forward motion',
    tone: 1
  },
  {
    kind: 'major',
    name: 'STRENGTH',
    img: 'ar08.jpg',
    keywords: ['Courage', 'Patience', 'Gentleness'],
    intro: 'Strength is quiet courage: power that stays calm instead of becoming harsh.',
    general: 'You are more capable than the pressure makes you feel, and patient self-control will work better than brute force.',
    love: 'Tenderness, emotional steadiness, and gentle honesty will carry more weight than intensity alone.',
    advice: 'Respond firmly, but keep your heart soft and your ego quiet.',
    shadow: 'pride',
    theme: 'steady courage',
    tone: 1
  },
  {
    kind: 'major',
    name: 'THE HERMIT',
    img: 'ar09.jpg',
    keywords: ['Reflection', 'Solitude', 'Guidance'],
    intro: 'The Hermit turns down the noise so the deeper truth can be heard.',
    general: 'You may need distance, reflection, or a slower pace before the next move becomes obvious.',
    love: 'Someone may be emotionally withdrawn, cautious, or still figuring out what they really feel.',
    advice: 'Make space for honest reflection instead of rushing to fill the silence.',
    shadow: 'isolation',
    theme: 'reflection',
    tone: -1
  },
  {
    kind: 'major',
    name: 'WHEEL OF FORTUNE',
    img: 'ar10.jpg',
    keywords: ['Change', 'Cycle', 'Timing'],
    intro: 'This card points to turning points, changing conditions, and the part of life that does not stay still for long.',
    general: 'The situation is shifting quickly, and flexibility will serve you better than trying to freeze it in place.',
    love: 'The relationship is at a turning point, with timing and circumstance playing a larger role than usual.',
    advice: 'Adapt to the change instead of gripping what is already moving.',
    shadow: 'passive drifting',
    theme: 'turning point',
    tone: 1
  },
  {
    kind: 'major',
    name: 'JUSTICE',
    img: 'ar11.jpg',
    keywords: ['Truth', 'Balance', 'Accountability'],
    intro: 'Justice is clarity, fairness, and the reminder that choices have consequences.',
    general: 'A decision needs honesty, precision, and a willingness to look at the facts without self-protection.',
    love: 'Balance and accountability matter here. The connection cannot stay healthy if only one person carries the emotional weight.',
    advice: 'Be accurate, fair, and honest about what is actually happening.',
    shadow: 'avoidance of truth',
    theme: 'clarity and accountability',
    tone: 0
  },
  {
    kind: 'major',
    name: 'THE HANGED MAN',
    img: 'ar12.jpg',
    keywords: ['Pause', 'Surrender', 'Perspective'],
    intro: 'This card suggests a pause that feels inconvenient but can reveal something important.',
    general: 'Progress may be slow for a reason; the real task is to see the situation from a different angle.',
    love: 'Trying to force the relationship forward may not help. A shift in perspective is more useful than urgency.',
    advice: 'Release the timeline for a moment and see what changes when you stop pushing.',
    shadow: 'stagnation',
    theme: 'new perspective',
    tone: -1
  },
  {
    kind: 'major',
    name: 'DEATH',
    img: 'ar13.jpg',
    keywords: ['Ending', 'Release', 'Transformation'],
    intro: 'Death is not about doom. It is about a chapter ending so a truer one can begin.',
    general: 'Something old is finished, and the healthiest path is to stop trying to revive what no longer fits your life.',
    love: 'An outdated dynamic has to change. The relationship cannot grow by repeating the same pattern in a nicer tone.',
    advice: 'Let go of what is clearly over so new movement can begin.',
    shadow: 'resistance to change',
    theme: 'deep change',
    tone: 0
  },
  {
    kind: 'major',
    name: 'TEMPERANCE',
    img: 'ar14.jpg',
    keywords: ['Balance', 'Healing', 'Integration'],
    intro: 'Temperance is slow healing and the art of blending opposites into something workable.',
    general: 'Steady moderation will get you farther than dramatic swings or extreme reactions.',
    love: 'The connection becomes healthier through patience, emotional balance, and a willingness to meet in the middle.',
    advice: 'Go for steady progress and let balance do the heavy lifting.',
    shadow: 'extremes',
    theme: 'balance',
    tone: 1
  },
  {
    kind: 'major',
    name: 'THE DEVIL',
    img: 'ar15.jpg',
    keywords: ['Attachment', 'Temptation', 'Compulsion'],
    intro: 'The Devil points to the loops we stay in even when they are draining us.',
    general: 'Fear, habit, or attachment may be keeping you tied to a pattern that is smaller than your real potential.',
    love: 'This connection may carry obsession, avoidance, or unhealthy attachment that needs to be named clearly.',
    advice: 'Say the unhealthy pattern out loud instead of feeding it in silence.',
    shadow: 'denial',
    theme: 'entanglement',
    tone: -2
  },
  {
    kind: 'major',
    name: 'THE TOWER',
    img: 'ar16.jpg',
    keywords: ['Shock', 'Truth', 'Reset'],
    intro: 'The Tower breaks what is unstable so you can stop pretending it is secure.',
    general: 'A false structure is cracking, and while that can feel disruptive, it also clears space for something more honest.',
    love: 'A relationship illusion, assumption, or fragile setup may be meeting reality all at once.',
    advice: 'Let what is unstable fall, then rebuild from the truth instead of the performance.',
    shadow: 'chaotic resistance',
    theme: 'hard wake-up call',
    tone: -2
  },
  {
    kind: 'major',
    name: 'THE STAR',
    img: 'ar17.jpg',
    keywords: ['Hope', 'Healing', 'Renewal'],
    intro: 'The Star is a soft but powerful card about trust returning after strain.',
    general: 'Healing is available, and the path forward becomes lighter when you allow hope to be practical instead of naive.',
    love: 'This card brings openness, recovery, and the chance to believe in healthier love again.',
    advice: 'Keep faith, stay open, and let your next move come from healing instead of fear.',
    shadow: 'wishful passivity',
    theme: 'renewed hope',
    tone: 2
  },
  {
    kind: 'major',
    name: 'THE MOON',
    img: 'ar18.jpg',
    keywords: ['Uncertainty', 'Instinct', 'Illusion'],
    intro: 'The Moon reminds you that not every feeling is a fact, but every feeling still deserves attention.',
    general: 'Some of what worries you is real, and some of it may be projection. Clarity will come through patience and verification.',
    love: 'There may be mixed signals, hidden fears, or emotions that are stronger than the information you actually have.',
    advice: 'Check the facts before you make a decision based only on emotion.',
    shadow: 'confusion',
    theme: 'uncertainty',
    tone: -1
  },
  {
    kind: 'major',
    name: 'THE SUN',
    img: 'ar19.jpg',
    keywords: ['Joy', 'Clarity', 'Confidence'],
    intro: 'The Sun is direct, warm, and uncomplicated in the best sense of the word.',
    general: 'Success becomes more likely when you stop shrinking and let your strengths be fully visible.',
    love: 'This is a bright sign for honesty, warmth, affection, and a connection that feels easier to trust.',
    advice: 'Show up clearly and let sincerity replace second-guessing.',
    shadow: 'ego inflation',
    theme: 'clarity and joy',
    tone: 2
  },
  {
    kind: 'major',
    name: 'JUDGEMENT',
    img: 'ar20.jpg',
    keywords: ['Awakening', 'Decision', 'Calling'],
    intro: 'Judgement is a wake-up moment: seeing clearly what must change and answering it.',
    general: 'You are being asked to stop hovering between versions of yourself and make the honest decision.',
    love: 'A real conversation, realization, or turning point can redefine the relationship more than silence ever could.',
    advice: 'Answer the truth directly and act like you mean it.',
    shadow: 'avoided reckoning',
    theme: 'awakening',
    tone: 1
  },
  {
    kind: 'major',
    name: 'THE WORLD',
    img: 'ar21.jpg',
    keywords: ['Completion', 'Integration', 'Wholeness'],
    intro: 'The World signals completion, maturity, and the sense that a cycle is finally making sense.',
    general: 'You are close to completing a meaningful chapter, and it is time to recognize your progress instead of downplaying it.',
    love: 'The relationship points toward maturity, balance, and a fuller version of connection when both people bring their whole selves.',
    advice: 'Acknowledge what has been completed and step confidently into the next chapter.',
    shadow: 'fear of closure',
    theme: 'completion',
    tone: 2
  }
];

const fullTarotDeck = [...majorArcana, ...buildMinorArcanaDeck()];

const MAJOR_ARCANA_ZH = {
  'THE FOOL': {
    displayNameZh: '愚者',
    keywordsZh: ['新开始', '好奇', '冒险'],
    introZh: '新的篇章正在展开，你被邀请带着好奇心迈出第一步。',
    generalZh: '你正被推向新的经历，真正的成长来自去试，而不是一直准备。',
    loveZh: '这段关系需要新鲜感和真诚，但也要有一点落地感，别让兴奋跑在现实前面。',
    adviceZh: '往前走一步，但先确认一个最重要的现实细节。',
    shadowZh: '草率冒进',
    themeZh: '新的开始'
  },
  'THE MAGICIAN': {
    displayNameZh: '魔术师',
    keywordsZh: ['能力', '专注', '主动'],
    introZh: '魔术师提醒你，手上的资源其实已经足够，关键在于你是否真正去用。',
    generalZh: '你对这件事的影响力比想象中更大，尤其体现在行动力和表达上。',
    loveZh: '在感情里，明确、主动和真实投入，比暧昧和猜测更重要。',
    adviceZh: '让你的语言和行动保持一致，让别人看得懂你的心意。',
    shadowZh: '操控',
    themeZh: '主动改变'
  },
  'HIGH PRIESTESS': {
    displayNameZh: '女祭司',
    keywordsZh: ['直觉', '安静', '深度'],
    introZh: '女祭司提醒你先安静下来，去感受表面之下真正发生的事。',
    generalZh: '真相还没有完全浮出来，现在最聪明的做法是慢一点，多观察。',
    loveZh: '这段关系里有更深的情绪或没说出口的现实，它们比表面的反应更重要。',
    adviceZh: '先停一下，认真听听你心里已经知道的答案。',
    shadowZh: '隐藏',
    themeZh: '内在判断'
  },
  'THE EMPRESS': {
    displayNameZh: '皇后',
    keywordsZh: ['滋养', '丰盛', '成长'],
    introZh: '这张牌温暖、丰盛，也提醒你，真正被照顾的东西才会长大。',
    generalZh: '当你愿意给事情更多空间、支持和耐心，它就会慢慢变好。',
    loveZh: '感情里会强调照顾、舒服和安全感，爱需要被看得见地表达。',
    adviceZh: '少一点控制，多一点温柔和稳定的照顾。',
    shadowZh: '过度放纵',
    themeZh: '成长与照顾'
  },
  'THE EMPEROR': {
    displayNameZh: '皇帝',
    keywordsZh: ['结构', '权威', '边界'],
    introZh: '皇帝带来秩序、责任和明确的标准。',
    generalZh: '这件事需要结构、规则和愿意扛起责任的人，但别走到僵硬那一步。',
    loveZh: '在感情里，稳定和成熟比戏剧化的激情更重要。',
    adviceZh: '把标准说清楚，然后稳稳守住。',
    shadowZh: '僵化',
    themeZh: '结构'
  },
  'THE HIEROPHANT': {
    displayNameZh: '教皇',
    keywordsZh: ['价值观', '传统', '指引'],
    introZh: '这张牌会问你，你真正相信的原则到底是什么。',
    generalZh: '你可能需要成熟经验、可靠建议，或更有纪律的方法来处理眼前的问题。',
    loveZh: '这段关系需要更清楚的价值观、期待，或更明确的承诺方向。',
    adviceZh: '先想清楚你到底想按什么原则去生活。',
    shadowZh: '空洞地随大流',
    themeZh: '共同价值'
  },
  'THE LOVERS': {
    displayNameZh: '恋人',
    keywordsZh: ['连结', '选择', '一致'],
    introZh: '恋人牌不只讲吸引，也讲你是否愿意选择真正适合自己的东西。',
    generalZh: '眼前有一个重要选择，真正适合你的路未必最轻松，但会更一致。',
    loveZh: '吸引力很强，但这张牌也在问，这段关系是否真的符合你的价值观。',
    adviceZh: '选择那个更真实、更一致的方向，即使它需要一点勇气。',
    shadowZh: '犹豫不决',
    themeZh: '一致与选择'
  },
  'THE CHARIOT': {
    displayNameZh: '战车',
    keywordsZh: ['推进', '方向', '动力'],
    introZh: '战车讲的是行动、纪律和方向感。',
    generalZh: '你现在可以真正推进事情，但前提是别把力气分散在两个方向上。',
    loveZh: '关系要往前走，就得停止漂浮，明确彼此到底想做什么。',
    adviceZh: '先定方向，再稳定发力。',
    shadowZh: '硬推控制',
    themeZh: '向前推进'
  },
  STRENGTH: {
    displayNameZh: '力量',
    keywordsZh: ['勇气', '耐心', '温柔'],
    introZh: '力量牌代表安静而稳定的勇气，不是逞强。',
    generalZh: '你其实比压力让你以为的更有能力，温和而稳定地掌控会比硬来更有效。',
    loveZh: '在感情里，温柔、稳定和诚实，比情绪爆发更有力量。',
    adviceZh: '可以坚定，但别让心变硬。',
    shadowZh: '自负',
    themeZh: '温柔的力量'
  },
  'THE HERMIT': {
    displayNameZh: '隐士',
    keywordsZh: ['反思', '独处', '指引'],
    introZh: '隐士会把外界的噪音调低，让你听见真正重要的声音。',
    generalZh: '现在也许需要一点距离、反思和放慢速度，答案才会更清楚。',
    loveZh: '有人可能在退缩、谨慎，或还在理清自己真正的感受。',
    adviceZh: '先留一点安静空间，再决定下一步。',
    shadowZh: '封闭',
    themeZh: '反思'
  },
  'WHEEL OF FORTUNE': {
    displayNameZh: '命运之轮',
    keywordsZh: ['变化', '循环', '时机'],
    introZh: '这张牌提醒你，局势正在转动，很多东西不会停在原地。',
    generalZh: '事情在快速变化，越能适应变化的人，越能抓住这次转弯。',
    loveZh: '这段关系正站在转折点上，时机和外在条件会比平时更重要。',
    adviceZh: '别死抓着旧样子，顺着变化去调整。',
    shadowZh: '被动漂流',
    themeZh: '转折点'
  },
  JUSTICE: {
    displayNameZh: '正义',
    keywordsZh: ['真相', '平衡', '负责'],
    introZh: '正义牌讲的是清楚、公平，以及选择一定会带来结果。',
    generalZh: '眼前的决定需要诚实、准确，以及不自我美化地看事实。',
    loveZh: '关系要健康，就不能只有一个人一直扛着情绪和责任。',
    adviceZh: '把事实看清楚，再做公平而诚实的决定。',
    shadowZh: '逃避真相',
    themeZh: '清楚与负责'
  },
  'THE HANGED MAN': {
    displayNameZh: '倒吊人',
    keywordsZh: ['暂停', '放手', '换角度'],
    introZh: '这张牌像一个不太舒服的暂停，但它常常正是看清问题的入口。',
    generalZh: '事情慢下来未必是坏事，也许真正要做的是换个角度看。',
    loveZh: '硬推关系前进未必有效，反而更需要改变看法和节奏。',
    adviceZh: '先放下对时间表的执着，看看不推的时候会出现什么。',
    shadowZh: '停滞',
    themeZh: '新的视角'
  },
  DEATH: {
    displayNameZh: '死神',
    keywordsZh: ['结束', '放下', '转化'],
    introZh: '死神牌不是灾难，而是旧的一章结束，新的真实才有空间开始。',
    generalZh: '有些旧东西已经走到尽头，继续勉强只会拖慢真正的变化。',
    loveZh: '关系里某个旧模式必须结束，否则再温柔地重复也不会变好。',
    adviceZh: '把已经结束的部分放下，新的流动才会进来。',
    shadowZh: '抗拒改变',
    themeZh: '深层转变'
  },
  TEMPERANCE: {
    displayNameZh: '节制',
    keywordsZh: ['平衡', '疗愈', '整合'],
    introZh: '节制讲的是缓慢修复，以及把对立的部分调成可以共存的状态。',
    generalZh: '稳定和适度会比极端反应更有用。',
    loveZh: '关系会因为耐心、平衡和愿意彼此靠近而变得更健康。',
    adviceZh: '别追求戏剧性的变化，先把平衡找回来。',
    shadowZh: '走极端',
    themeZh: '平衡'
  },
  'THE DEVIL': {
    displayNameZh: '恶魔',
    keywordsZh: ['执着', '诱惑', '上瘾'],
    introZh: '恶魔牌会把你困在一个你明知消耗、却还在重复的循环里。',
    generalZh: '恐惧、习惯或执着，可能正把你留在一个比你真实潜力更小的模式里。',
    loveZh: '这段关系里可能有沉迷、逃避或不健康的依附，需要说破。',
    adviceZh: '把那个不健康的循环直接点出来，别再默默喂养它。',
    shadowZh: '自我欺骗',
    themeZh: '纠缠'
  },
  'THE TOWER': {
    displayNameZh: '高塔',
    keywordsZh: ['冲击', '真相', '重置'],
    introZh: '高塔会拆掉不稳的结构，好让你停止假装它一直都没问题。',
    generalZh: '某个不真实的支撑正在崩开，这虽然难受，却也让更真实的东西有机会重建。',
    loveZh: '关系里某个幻觉、假设或脆弱结构，可能会突然被现实打破。',
    adviceZh: '让该倒的倒下来，然后从真实处重新开始。',
    shadowZh: '混乱地抗拒',
    themeZh: '强烈觉醒'
  },
  'THE STAR': {
    displayNameZh: '星星',
    keywordsZh: ['希望', '疗愈', '更新'],
    introZh: '星星牌温柔却很有力量，它讲的是经历辛苦之后，重新愿意相信。',
    generalZh: '修复是可能的，而真正有用的希望，不是空想，而是让你敢于继续向前。',
    loveZh: '这张牌会带来开放、修复，以及重新相信更健康关系的可能。',
    adviceZh: '保留希望，也让下一步建立在修复之上，而不是建立在害怕之上。',
    shadowZh: '只会空想',
    themeZh: '重新燃起希望'
  },
  'THE MOON': {
    displayNameZh: '月亮',
    keywordsZh: ['不确定', '直觉', '幻象'],
    introZh: '月亮提醒你，不是每个感觉都是事实，但每个感觉都值得被认真看见。',
    generalZh: '你的担心里有真的部分，也可能有投射，清楚来自耐心和核实。',
    loveZh: '关系里可能存在混乱信号、隐藏恐惧，或情绪大过实际信息的状况。',
    adviceZh: '先查清事实，再决定要不要跟着情绪走。',
    shadowZh: '迷雾',
    themeZh: '不确定感'
  },
  'THE SUN': {
    displayNameZh: '太阳',
    keywordsZh: ['喜悦', '清晰', '自信'],
    introZh: '太阳牌直接、温暖，也代表一种让人松一口气的清楚。',
    generalZh: '当你不再缩小自己，而是坦然地把优点亮出来，事情会顺很多。',
    loveZh: '这是一张很亮的牌，代表坦诚、温暖、亲近，以及更容易信任的关系状态。',
    adviceZh: '把真实和坦率放到前面，别继续自己吓自己。',
    shadowZh: '自我膨胀',
    themeZh: '清楚与喜悦'
  },
  JUDGEMENT: {
    displayNameZh: '审判',
    keywordsZh: ['觉醒', '决定', '召唤'],
    introZh: '审判像一声提醒，让你再也没法假装自己看不见真正的问题。',
    generalZh: '你被要求停止卡在两个版本的自己之间，做一个更诚实的决定。',
    loveZh: '一场真正的对话、某个认清，或一次转折，会比继续沉默更能改变关系。',
    adviceZh: '直接回应你已经知道的真相，然后认真行动。',
    shadowZh: '逃避清算',
    themeZh: '觉醒'
  },
  'THE WORLD': {
    displayNameZh: '世界',
    keywordsZh: ['完成', '整合', '圆满'],
    introZh: '世界牌表示一个周期真的快走完了，你开始看见整体意义。',
    generalZh: '你正接近一个重要阶段的完成，现在该承认自己的进步，而不是一直轻描淡写。',
    loveZh: '这段关系有机会走向成熟、平衡和更完整的连结。',
    adviceZh: '承认已经完成的部分，然后更踏实地进入下一章。',
    shadowZh: '害怕结束',
    themeZh: '圆满完成'
  }
};

class Particle {
  constructor() {
    this.reset(window.innerWidth, window.innerHeight);
  }

  reset(width, height) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.55;
    this.vy = (Math.random() - 0.5) * 0.55;
    this.alpha = Math.random() * 0.55 + 0.15;
    this.size = Math.random() * 2.2 + 0.8;
  }

  update(width, height) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -10 || this.x > width + 10 || this.y < -10 || this.y > height + 10) {
      this.reset(width, height);
    }
  }

  draw(theme) {
    gCtx.beginPath();
    gCtx.fillStyle = Math.random() > 0.65 ? theme.particleSoft : theme.particle;
    gCtx.globalAlpha = this.alpha;
    gCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    gCtx.fill();
    gCtx.globalAlpha = 1;
  }
}

function buildMinorArcanaDeck() {
  const deck = [];

  SUIT_DEFS.forEach((suit) => {
    RANK_DEFS.forEach((rank) => {
      deck.push(buildMinorCard(suit, rank));
    });
  });

  return deck;
}

function buildMinorCard(suit, rank) {
  const name = `${rank.label.toUpperCase()} OF ${suit.plural.toUpperCase()}`;
  const replacements = {
    focus: SUIT_FOCUS[suit.key],
    generalFocus: suit.generalFocus,
    loveFocus: suit.loveFocus,
    starterAdvice: suit.starterAdvice
  };
  const suitZh = SUIT_ZH[suit.key];
  const rankZh = RANK_ZH[rank.key];
  const replacementsZh = {
    focus: SUIT_FOCUS[suit.key],
    generalFocus: suitZh.generalFocus,
    loveFocus: suitZh.loveFocus,
    starterAdvice: suitZh.starterAdvice
  };

  return {
    kind: 'minor',
    name,
    displayName: `${rank.label} of ${suit.plural}`,
    displayNameZh: `${suitZh.plural}${rankZh.label}`,
    suit: suit.key,
    suitLabel: suit.plural,
    suitLabelZh: suitZh.plural,
    rank: rank.key,
    rankLabel: rank.label,
    rankLabelZh: rankZh.label,
    domainLabel: suit.domainLabel,
    domainLabelZh: suitZh.domainLabel,
    imageUrl: buildMinorArcanaImageUrl(suit.key, rank.key),
    keywords: [rank.keywords[0], suit.keywords[0], suit.keywords[1]],
    keywordsZh: [rankZh.keyword, suitZh.keywords[0], suitZh.keywords[1]],
    intro: fillTemplate(rank.introTemplate, replacements),
    introZh: fillTemplate(rankZh.introTemplate, replacementsZh),
    general: fillTemplate(rank.generalTemplate, replacements),
    generalZh: fillTemplate(rankZh.generalTemplate, replacementsZh),
    love: fillTemplate(rank.loveTemplate, replacements),
    loveZh: fillTemplate(rankZh.loveTemplate, replacementsZh),
    advice: fillTemplate(rank.adviceTemplate, replacements),
    adviceZh: fillTemplate(rankZh.adviceTemplate, replacementsZh),
    shadow: rank.shadow,
    shadowZh: rankZh.shadow,
    theme: rank.theme,
    themeZh: rankZh.theme,
    tone: rank.tone
  };
}

function buildMinorArcanaImageUrl(suitKey, rankKey) {
  const override = MINOR_FILE_OVERRIDES[`${suitKey}:${rankKey}`];
  const fileName = override || `${MINOR_FILE_PREFIX[suitKey]}${String(MINOR_RANK_NUMBER[rankKey]).padStart(2, '0')}.jpg`;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
}

function fillTemplate(template, replacements) {
  return template.replace(/\{(\w+)\}/g, (_, key) => replacements[key] || '');
}

function preloadCardImage(card) {
  if (!card.img) {
    return;
  }

  const img = new Image();
  img.src = `${IMAGE_ROOT}${card.img}`;
  imgCache[card.name] = img;
}

for (let i = 0; i < 90; i += 1) {
  particles.push(new Particle());
}

majorArcana.forEach(preloadCardImage);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function distance3d(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
}

function angleDegrees(a, pivot, c) {
  const abx = a.x - pivot.x;
  const aby = a.y - pivot.y;
  const cbx = c.x - pivot.x;
  const cby = c.y - pivot.y;
  const dot = abx * cbx + aby * cby;
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby);

  if (!mag) {
    return 180;
  }

  const cos = clamp(dot / mag, -1, 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

function getTheme() {
  return THEMES[appMode] || THEMES.general;
}

function localize(value) {
  return typeof value === 'string' ? value : value[currentLanguage] || value.en;
}

function getModeUiConfig(mode) {
  return MODE_UI_COPY[mode];
}

function getDeckForMode(mode) {
  return mode === 'major' ? majorArcana : fullTarotDeck;
}

function getDeckLabel() {
  return localize(DECK_CONFIG[deckMode].label);
}

function getCardDisplayName(card) {
  if (currentLanguage === 'zh') {
    return card.displayNameZh || MAJOR_ARCANA_ZH[card.name]?.displayNameZh || card.displayName || prettyName(card.name);
  }

  return card.displayName || prettyName(card.name);
}

function getCardKeywords(card) {
  if (currentLanguage === 'zh') {
    return card.keywordsZh || MAJOR_ARCANA_ZH[card.name]?.keywordsZh || card.keywords;
  }

  return card.keywords;
}

function getCardText(card, field) {
  if (currentLanguage === 'zh') {
    return card[`${field}Zh`] || MAJOR_ARCANA_ZH[card.name]?.[`${field}Zh`] || card[field];
  }

  return card[field];
}

function getCardMeaning(card, mode) {
  return getCardText(card, mode === 'general' ? 'general' : 'love');
}

function getCardArcanaLabel(card) {
  if (currentLanguage === 'zh') {
    return card.kind === 'major' ? '大阿卡那' : `小阿卡那 · ${card.suitLabelZh || card.suitLabel}`;
  }

  return card.kind === 'major' ? 'Major Arcana' : `Minor Arcana · ${card.suitLabel}`;
}

function prettyName(name) {
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function shuffleDeck(deck) {
  const copy = [...deck];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function lowerFirst(text) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function lowerFirstLocalized(text) {
  return currentLanguage === 'zh' ? text : lowerFirst(text);
}

function applyLanguage() {
  const ui = UI_COPY[currentLanguage];
  const generalUi = getModeUiConfig('general');
  const romanceUi = getModeUiConfig('romance');

  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
  document.body.dataset.lang = currentLanguage;

  langEnButton.classList.toggle('active', currentLanguage === 'en');
  langZhButton.classList.toggle('active', currentLanguage === 'zh');

  menuEyebrow.innerText = ui.menuEyebrow;
  menuCopy.innerText = ui.menuCopy;
  legalNote.innerText = ui.legalNote;
  deckMajorButton.innerText = localize(DECK_CONFIG.major.label);
  deckFullButton.innerText = localize(DECK_CONFIG.full.label);
  deckCopy.innerText = localize(DECK_CONFIG[deckMode].menuCopy);
  deckCountPill.innerText = localize(DECK_CONFIG[deckMode].countLabel);

  modeCardTitleGeneral.innerText = localize(generalUi.cardTitle);
  modeCardCopyGeneral.innerText = localize(generalUi.cardCopy);
  modeCardTitleRomance.innerText = localize(romanceUi.cardTitle);
  modeCardCopyRomance.innerText = localize(romanceUi.cardCopy);

  ui.guide.forEach((item, index) => {
    guideTitleEls[index].innerText = item.title;
    guideCopyEls[index].innerText = item.copy;
  });

  ui.notePills.forEach((text, index) => {
    notePills[index].innerText = text;
  });

  spreadHeading.innerText = ui.spreadHeading;
  oracleHeading.innerText = ui.oracleHeading;
  oracleCopy.innerText = ui.oracleCopy;
  oracleLabel.innerText = ui.oracleLabel;
  oracleQuestionInput.placeholder = ui.oraclePlaceholder;
  askOracleButton.innerText = ui.askOracle;
  drawAgainButton.innerText = ui.drawAgain;
  changeModeButton.innerText = ui.changeMode;
  cameraLabel.innerText = ui.cameraLabel;

  ui.oraclePrompts.forEach((item, index) => {
    promptChipButtons[index].innerText = item.label;
    promptChipButtons[index].dataset.prompt = item.value;
  });

  applyModeLabels();
  updateHud();

  if (!oracleQuestionInput.value.trim()) {
    setOraclePlaceholder(ui.oracleEmpty);
  }
}

function setLanguage(lang) {
  if (!UI_COPY[lang]) {
    return;
  }

  currentLanguage = lang;
  applyLanguage();
}

function setDeckMode(mode) {
  if (!DECK_CONFIG[mode]) {
    return;
  }

  deckMode = mode;
  deckMajorButton.classList.toggle('active', mode === 'major');
  deckFullButton.classList.toggle('active', mode === 'full');
  deckCopy.innerText = localize(DECK_CONFIG[mode].menuCopy);
  deckCountPill.innerText = localize(DECK_CONFIG[mode].countLabel);

  if (document.getElementById('hud-layer').style.display === 'block') {
    activeDeck = shuffleDeck(getDeckForMode(deckMode));
    selectedCards = [];
    currentStep = 0;
    applyModeLabels();
    updateHud();
  }
}

function preInit(mode) {
  appMode = mode;
  document.body.dataset.mode = mode;
  selectedCards = [];
  currentStep = 0;
  rotation = Math.random() * Math.PI * 2;
  rotationVel = 0;
  lastHandX = 0.5;
  handPresent = false;
  edgeCarry = null;
  isPinching = false;
  pinchTimer = 0;
  pinchCooldown = 0;
  activeDeck = shuffleDeck(getDeckForMode(deckMode));

  document.getElementById('mode-selector').style.display = 'none';
  document.getElementById('hud-layer').style.display = 'block';
  document.getElementById('camera-window').style.display = 'block';

  applyModeLabels();
  updateHud();
  startApp();
}

function applyModeLabels() {
  const uiConfig = getModeUiConfig(appMode);
  modeBadge.innerText = `${localize(uiConfig.label)} · ${getDeckLabel()}`;
  revealKicker.innerText = `${localize(uiConfig.kicker)} · ${localize(DECK_CONFIG[deckMode].readingLabel)}`;

  uiConfig.positions.forEach((position, index) => {
    const labelText = localize(position.label);
    document.getElementById(`label-${index}`).innerText = currentLanguage === 'zh'
      ? labelText
      : labelText.toUpperCase();
    document.getElementById(`slot-value-${index}`).innerText = selectedCards[index]
      ? getCardDisplayName(selectedCards[index])
      : UI_COPY[currentLanguage].waiting;
  });
}

function updateHud() {
  const uiConfig = getModeUiConfig(appMode);
  const nextPosition = uiConfig.positions[currentStep];
  const ui = UI_COPY[currentLanguage];

  if (nextPosition) {
    statusText.innerText = currentStep === 0
      ? ui.hudBrowse
      : ui.hudChoose.replace('{position}', localize(nextPosition.label).toLowerCase());
    statusSubtext.innerText = ui.hudSubtext.replace('{hint}', localize(nextPosition.hint));
  } else {
    statusText.innerText = ui.hudComplete;
    statusSubtext.innerText = ui.hudReady;
  }

  for (let i = 0; i < 3; i += 1) {
    const slot = document.getElementById(`slot-${i}`);
    const selected = Boolean(selectedCards[i]);
    slot.className = selected ? 'slot complete' : i === currentStep ? 'slot active' : 'slot';
  }
}

function startApp() {
  if (cameraStarted) {
    return;
  }

  cameraStarted = true;

  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.65
  });

  hands.onResults(onHandResults);

  new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
  }).start();

  requestAnimationFrame(drawLoop);
}

function getPalmCenterX(lm) {
  return (lm[5].x + lm[9].x + lm[13].x + lm[17].x) / 4;
}

function getPinchConfidence(lm) {
  const handScale = Math.max(distance3d(lm[5], lm[17]), distance3d(lm[0], lm[9]), 0.08);
  const pinchGap = distance3d(lm[4], lm[8]) / handScale;
  const indexMiddleGap = distance3d(lm[8], lm[12]) / handScale;
  const thumbMiddleGap = distance3d(lm[4], lm[12]) / handScale;
  const indexSpan = distance3d(lm[5], lm[8]) / handScale;
  const indexCurl = angleDegrees(lm[5], lm[6], lm[8]);
  const depthGap = Math.abs((lm[4].z || 0) - (lm[8].z || 0));

  let score = 0;

  if (pinchGap < 0.55) {
    score += clamp((0.55 - pinchGap) / 0.22, 0, 1.4);
  }

  if (indexMiddleGap > 0.26) {
    score += clamp((indexMiddleGap - 0.26) / 0.34, 0, 1);
  }

  if (thumbMiddleGap > pinchGap * 1.24) {
    score += 0.9;
  }

  if (indexCurl < 170) {
    score += clamp((170 - indexCurl) / 34, 0, 1.1);
  }

  if (depthGap < 0.14) {
    score += clamp((0.14 - depthGap) / 0.08, 0, 0.8);
  }

  if (indexSpan < 1.36) {
    score += clamp((1.36 - indexSpan) / 0.4, 0, 0.8);
  }

  return score / 6;
}

function isReliablePinch(lm) {
  return getPinchConfidence(lm) >= 0.63;
}

function handleHandMissing() {
  if (handPresent) {
    if (lastHandX >= EDGE_HIGH) {
      edgeCarry = { side: 'right', x: lastHandX, frames: 0 };
    } else if (lastHandX <= EDGE_LOW) {
      edgeCarry = { side: 'left', x: lastHandX, frames: 0 };
    } else {
      edgeCarry = null;
    }
  } else if (edgeCarry) {
    edgeCarry.frames += 1;
    if (edgeCarry.frames > EDGE_CARRY_FRAMES) {
      edgeCarry = null;
    }
  }

  handPresent = false;
  pinchTimer = Math.max(0, pinchTimer - 2);
  isPinching = false;
}

function computeWrappedDelta(currentX, wasTracking) {
  if (wasTracking) {
    if (lastHandX > EDGE_HIGH && currentX < EDGE_LOW) {
      return (1 - lastHandX) + currentX;
    }

    if (lastHandX < EDGE_LOW && currentX > EDGE_HIGH) {
      return -(lastHandX + (1 - currentX));
    }

    return currentX - lastHandX;
  }

  if (edgeCarry && edgeCarry.frames <= EDGE_CARRY_FRAMES) {
    const carry = edgeCarry;
    edgeCarry = null;

    if (carry.side === 'right' && currentX < 0.64) {
      return (1 - carry.x) + currentX;
    }

    if (carry.side === 'left' && currentX > 0.36) {
      return -(carry.x + (1 - currentX));
    }
  }

  return 0;
}

function drawGestureSkeleton(lm, theme, pinchCandidate) {
  const width = canvasCtx.canvas.width;
  const height = canvasCtx.canvas.height;

  canvasCtx.lineCap = 'round';
  canvasCtx.lineJoin = 'round';

  HAND_CONNECTIONS.forEach(([a, b]) => {
    canvasCtx.beginPath();
    canvasCtx.moveTo(lm[a].x * width, lm[a].y * height);
    canvasCtx.lineTo(lm[b].x * width, lm[b].y * height);
    canvasCtx.strokeStyle = 'rgba(121, 212, 228, 0.72)';
    canvasCtx.lineWidth = 2.4;
    canvasCtx.stroke();
  });

  lm.forEach((point, index) => {
    canvasCtx.beginPath();
    canvasCtx.arc(point.x * width, point.y * height, TIP_INDICES.includes(index) ? 3.4 : 2.1, 0, Math.PI * 2);
    canvasCtx.fillStyle = TIP_INDICES.includes(index) ? theme.accentBright : 'rgba(255, 255, 255, 0.52)';
    canvasCtx.fill();
  });

  if (pinchCandidate || pinchTimer > 0) {
    const pinchX = ((lm[4].x + lm[8].x) / 2) * width;
    const pinchY = ((lm[4].y + lm[8].y) / 2) * height;
    const radius = 11;
    const progress = clamp(pinchTimer / PINCH_FRAMES, 0, 1);

    canvasCtx.beginPath();
    canvasCtx.arc(pinchX, pinchY, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    canvasCtx.strokeStyle = theme.accent;
    canvasCtx.lineWidth = 2.2;
    canvasCtx.stroke();
  }
}

function onHandResults(results) {
  const theme = getTheme();
  const width = canvasCtx.canvas.width;
  const height = canvasCtx.canvas.height;

  canvasCtx.fillStyle = '#050712';
  canvasCtx.fillRect(0, 0, width, height);

  if (pinchCooldown > 0) {
    pinchCooldown -= 1;
  }

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    handleHandMissing();
    return;
  }

  const lm = results.multiHandLandmarks[0];
  const wasTracking = handPresent;
  const rawHandX = getPalmCenterX(lm);
  const currentX = wasTracking ? (lastHandX * 0.62) + (rawHandX * 0.38) : rawHandX;
  const swipeDelta = clamp(computeWrappedDelta(currentX, wasTracking), -0.18, 0.18);
  const movement = Math.abs(swipeDelta);

  if (!isPinching && movement > SWIPE_THRESHOLD) {
    rotationVel += swipeDelta * SWIPE_GAIN;
    rotationVel = clamp(rotationVel, -MAX_ROTATION_VEL, MAX_ROTATION_VEL);
  }

  const pinchCandidate = pinchCooldown === 0 && movement < 0.028 && isReliablePinch(lm);

  if (pinchCandidate) {
    pinchTimer = Math.min(PINCH_FRAMES, pinchTimer + 1);
  } else {
    pinchTimer = Math.max(0, pinchTimer - 2);
  }

  isPinching = pinchTimer >= PINCH_FRAMES;
  lastHandX = currentX;
  handPresent = true;
  edgeCarry = currentX >= EDGE_HIGH
    ? { side: 'right', x: currentX, frames: 0 }
    : currentX <= EDGE_LOW
      ? { side: 'left', x: currentX, frames: 0 }
      : null;

  drawGestureSkeleton(lm, theme, pinchCandidate);
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawBackground(width, height, theme) {
  const bg = gCtx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, theme.bgTop);
  bg.addColorStop(1, theme.bgBottom);
  gCtx.fillStyle = bg;
  gCtx.fillRect(0, 0, width, height);

  const halo = gCtx.createRadialGradient(
    width * 0.5,
    height * 0.34,
    30,
    width * 0.5,
    height * 0.34,
    Math.max(width * 0.45, height * 0.45)
  );
  halo.addColorStop(0, theme.aura);
  halo.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  gCtx.fillStyle = halo;
  gCtx.fillRect(0, 0, width, height);

  gCtx.save();
  gCtx.translate(width / 2, height / 2);
  gCtx.strokeStyle = theme.ring;
  gCtx.lineWidth = 1;
  gCtx.setLineDash([8, 14]);

  for (let i = 0; i < 3; i += 1) {
    gCtx.beginPath();
    gCtx.ellipse(0, height * -0.02 + i * 18, width * (0.17 + i * 0.07), height * (0.065 + i * 0.02), 0, 0, Math.PI * 2);
    gCtx.stroke();
  }

  gCtx.setLineDash([]);
  gCtx.restore();
}

function drawCardBack(x, y, width, height, isFront, theme, pulse) {
  const left = -width / 2;
  const top = -height / 2;

  gCtx.save();
  gCtx.translate(x, y + (isFront ? -10 : 0));

  gCtx.shadowBlur = isFront ? 34 : 12;
  gCtx.shadowColor = isFront ? theme.accentGlow : 'rgba(0, 0, 0, 0.35)';

  roundedRectPath(gCtx, left, top, width, height, width * 0.08);
  const cardGradient = gCtx.createLinearGradient(0, top, 0, top + height);
  cardGradient.addColorStop(0, 'rgba(24, 33, 56, 0.96)');
  cardGradient.addColorStop(1, 'rgba(5, 8, 18, 0.98)');
  gCtx.fillStyle = cardGradient;
  gCtx.fill();

  gCtx.lineWidth = isFront ? 3 : 1.5;
  gCtx.strokeStyle = isFront ? theme.accentBright : 'rgba(255, 255, 255, 0.16)';
  gCtx.stroke();

  roundedRectPath(gCtx, left + width * 0.07, top + height * 0.06, width * 0.86, height * 0.88, width * 0.06);
  gCtx.lineWidth = 1;
  gCtx.strokeStyle = isFront ? theme.secondary : 'rgba(255, 255, 255, 0.12)';
  gCtx.stroke();

  gCtx.beginPath();
  gCtx.arc(0, 0, width * 0.18, 0, Math.PI * 2);
  gCtx.strokeStyle = isFront ? theme.accent : 'rgba(255, 255, 255, 0.25)';
  gCtx.lineWidth = 2;
  gCtx.stroke();

  gCtx.beginPath();
  gCtx.moveTo(-width * 0.22, 0);
  gCtx.lineTo(width * 0.22, 0);
  gCtx.moveTo(0, -height * 0.2);
  gCtx.lineTo(0, height * 0.2);
  gCtx.strokeStyle = isFront ? theme.accentBright : 'rgba(255, 255, 255, 0.16)';
  gCtx.lineWidth = 1.2;
  gCtx.stroke();

  gCtx.beginPath();
  gCtx.moveTo(0, -height * 0.28);
  gCtx.lineTo(width * 0.1, -height * 0.12);
  gCtx.lineTo(width * 0.24, -height * 0.08);
  gCtx.lineTo(width * 0.12, 0);
  gCtx.lineTo(width * 0.18, height * 0.18);
  gCtx.lineTo(0, height * 0.1);
  gCtx.lineTo(-width * 0.18, height * 0.18);
  gCtx.lineTo(-width * 0.12, 0);
  gCtx.lineTo(-width * 0.24, -height * 0.08);
  gCtx.lineTo(-width * 0.1, -height * 0.12);
  gCtx.closePath();
  gCtx.strokeStyle = isFront ? theme.secondary : 'rgba(255, 255, 255, 0.18)';
  gCtx.stroke();

  if (isFront) {
    const ringProgress = pinchTimer > 0 ? Math.min(pinchTimer / PINCH_FRAMES, 1) : pulse;
    gCtx.beginPath();
    gCtx.arc(0, 0, width * 0.28, -Math.PI / 2, -Math.PI / 2 + ringProgress * Math.PI * 2);
    gCtx.strokeStyle = theme.accentBright;
    gCtx.lineWidth = 4;
    gCtx.stroke();

    gCtx.fillStyle = theme.accentBright;
    gCtx.font = `${Math.max(10, width * 0.08)}px ${currentLanguage === 'zh' ? '"Noto Serif SC"' : 'Cinzel'}`;
    gCtx.textAlign = 'center';
    gCtx.fillText(currentLanguage === 'zh' ? '捏合抽牌' : 'PINCH TO DRAW', 0, height * 0.33);
  }

  gCtx.restore();
}

function drawFrontCardCaption(frontCard, width, theme) {
  if (!frontCard) {
    return;
  }

  gCtx.save();
  gCtx.textAlign = 'center';
  gCtx.fillStyle = theme.accentBright;
  gCtx.font = `${Math.max(16, Math.min(28, width * 0.019))}px ${currentLanguage === 'zh' ? '"Noto Serif SC"' : 'Cinzel'}`;
  gCtx.fillText(getCardDisplayName(frontCard.card), width / 2, frontCard.y + frontCard.height * 0.75);

  gCtx.fillStyle = 'rgba(255, 255, 255, 0.82)';
  gCtx.font = `${Math.max(11, Math.min(15, width * 0.011))}px ${currentLanguage === 'zh' ? '"Noto Serif SC"' : '"Cormorant Garamond"'}`;
  gCtx.fillText(getCardArcanaLabel(frontCard.card), width / 2, frontCard.y + frontCard.height * 0.75 + 22);
  gCtx.restore();
}

function drawDeckWheel(width, height, theme) {
  if (!activeDeck.length) {
    return;
  }

  if (pinchTimer > 0) {
    rotationVel *= 0.82;
  } else {
    rotationVel *= 0.95;
  }

  rotationVel = clamp(rotationVel, -MAX_ROTATION_VEL, MAX_ROTATION_VEL);
  rotation += rotationVel;

  const fullDeckMode = activeDeck.length > 40;
  const centerY = width < 960 ? height * 0.72 : height * 0.68;
  const orbitX = Math.min(width * (fullDeckMode ? 0.33 : 0.37), fullDeckMode ? 470 : 520);
  const orbitY = Math.min(height * (fullDeckMode ? 0.105 : 0.13), fullDeckMode ? 88 : 112);
  const cardWidth = fullDeckMode
    ? Math.max(72, Math.min(108, width * 0.078))
    : Math.max(90, Math.min(140, width * 0.1));
  const cardHeight = cardWidth * 1.54;

  const positioned = activeDeck
    .map((card, index) => {
      const angle = (index / activeDeck.length) * Math.PI * 2 + rotation;
      const z = Math.sin(angle);
      const depth = (z + 1) / 2;
      const scale = fullDeckMode ? 0.42 + depth * 0.58 : 0.55 + depth * 0.72;

      return {
        card,
        z,
        depth,
        scale,
        x: width / 2 + Math.cos(angle) * orbitX,
        y: centerY + Math.sin(angle) * orbitY,
        height: cardHeight * scale
      };
    })
    .sort((a, b) => a.z - b.z);

  const frontCard = positioned[positioned.length - 1];
  const visibleEntries = fullDeckMode ? positioned.slice(-22) : positioned.filter((entry) => entry.depth > 0.08);

  visibleEntries.forEach((entry) => {
    if (entry.z < -0.72) {
      return;
    }

    gCtx.save();
    gCtx.globalAlpha = fullDeckMode ? 0.28 + entry.depth * 0.76 : 0.32 + entry.depth * 0.68;
    drawCardBack(
      entry.x,
      entry.y,
      cardWidth * entry.scale,
      cardHeight * entry.scale,
      frontCard && entry.card.name === frontCard.card.name && entry.z > 0.46,
      theme,
      entry.depth
    );
    gCtx.restore();
  });

  drawFrontCardCaption(frontCard, width, theme);

  if (frontCard && frontCard.z > 0.9 && isPinching) {
    selectCard(frontCard.card);
  }
}

function selectCard(card) {
  if (selectedCards.some((existing) => existing.name === card.name)) {
    return;
  }

  selectedCards.push(card);
  activeDeck = activeDeck.filter((entry) => entry.name !== card.name);
  currentStep = selectedCards.length;
  rotationVel = 0;
  isPinching = false;
  pinchTimer = 0;
  pinchCooldown = PINCH_COOLDOWN_FRAMES;

  applyModeLabels();
  updateHud();

  if (currentStep === 3) {
    showFinalResult();
  }
}

function buildTrendText(firstCard, futureCard, mode) {
  const trend = futureCard.tone - firstCard.tone;

  if (currentLanguage === 'zh') {
    if (trend >= 2) {
      return mode === 'general'
        ? '整组牌的能量是往上走的，表示只要你不再重复旧模式，事情有机会明显转好。'
        : '这组三张牌的情绪走向是越来越稳定的，只要双方愿意调整，关系是有机会变得更健康的。';
    }

    if (trend <= -2) {
      return mode === 'general'
        ? '未来牌比起点更沉，说明这件事最好尽快正面处理，不适合再拖下去。'
        : '结果牌比开头更重，表示这段关系很快就需要一次直接的对话，或更明确的边界。';
    }

    return mode === 'general'
      ? '整组牌的能量起伏不算太大，所以关键不在某个戏剧性的瞬间，而在你接下来是否持续做对选择。'
      : '这组三张牌的情绪变化并不极端，所以真正重要的是怎么处理当前模式，而不是等奇迹自动发生。';
  }

  if (trend >= 2) {
    return mode === 'general'
      ? 'The energy gets lighter as the spread goes on, which usually means the situation can improve once you stop carrying the older pattern into the next chapter.'
      : 'The emotional energy becomes steadier by the end of the spread, which is a good sign if both people are willing to adjust honestly.';
  }

  if (trend <= -2) {
    return mode === 'general'
      ? 'The future card is heavier than the opening card, so it would be wise to deal with the issue directly instead of hoping it fades on its own.'
      : 'The outcome card carries more weight than the opening card, so the relationship likely needs a direct conversation or a firmer boundary soon.';
  }

  return mode === 'general'
    ? 'The spread stays fairly even from start to finish, so progress depends more on consistent choices than on one dramatic move.'
    : 'The emotional tone stays fairly even across the spread, so what matters most is how the current pattern is handled rather than waiting for magic to fix it.';
}

function buildMiddleText(middleCard, mode) {
  const advice = getCardText(middleCard, 'advice');

  if (currentLanguage === 'zh') {
    if (middleCard.tone <= -1) {
      return mode === 'general'
        ? `中间这张牌就是现在的压力点。${advice}`
        : `中间这张牌说明这段关系最容易卡在没说出口的部分。${advice}`;
    }

    if (middleCard.tone >= 2) {
      return mode === 'general'
        ? `中间这张牌其实在帮你，表示目前不是完全没机会。${advice}`
        : `中间这张牌的能量比较温暖，只要温柔和稳定能跟上，关系就有修复空间。${advice}`;
    }

    return mode === 'general'
      ? `中间这张牌更在意平衡，而不是速度。${advice}`
      : `中间这张牌提醒你，比起猜来猜去，稳定行动更重要。${advice}`;
  }

  if (middleCard.tone <= -1) {
    return mode === 'general'
      ? `The present card is the pressure point. ${advice}`
      : `The middle card suggests the relationship can be misunderstood if nobody says the quiet part out loud. ${advice}`;
  }

  if (middleCard.tone >= 2) {
    return mode === 'general'
      ? `The present card is supportive, so there is more working in your favor than you may feel. ${advice}`
      : `The middle card has warm energy, which helps if the openness is matched with real consistency. ${advice}`;
  }

  return mode === 'general'
    ? `The present card asks for balance more than speed. ${advice}`
    : `The middle card asks for steady effort instead of mixed signals. ${advice}`;
}

function buildArcanaContext(cards) {
  const majorCards = cards.filter((card) => card.kind === 'major');
  const minorCards = cards.filter((card) => card.kind === 'minor');

  if (majorCards.length === 3) {
    return currentLanguage === 'zh'
      ? '三张都是大阿卡那，所以这次占卜更像是在说一个重要阶段，而不是短暂的小情绪。'
      : 'All three cards are major arcana, so this reading is pointing to a bigger life chapter rather than a passing mood.';
  }

  if (majorCards.length === 2) {
    return currentLanguage === 'zh'
      ? '有两张是大阿卡那，说明这件事不是普通的小波动，它的分量比你以为的大。'
      : 'Two major arcana cards show that this is more than a small daily issue; the pattern has real weight.';
  }

  if (majorCards.length === 1 && minorCards.length === 2) {
    return currentLanguage === 'zh'
      ? `${getCardDisplayName(majorCards[0])}像这次占卜的主标题，而另外两张小阿卡那则告诉你，它是怎样落在日常选择里的。`
      : `${getCardDisplayName(majorCards[0])} acts like the headline, while the minor arcana explain how it is showing up in everyday choices.`;
  }

  const suitCounts = minorCards.reduce((counts, card) => {
    counts[card.suit] = (counts[card.suit] || 0) + 1;
    return counts;
  }, {});

  const repeatedSuit = Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0];

  if (repeatedSuit && repeatedSuit[1] >= 2) {
    const suit = SUIT_MAP[repeatedSuit[0]];
    const suitFocus = currentLanguage === 'zh' ? SUIT_ZH[repeatedSuit[0]].readingFocus : suit.readingFocus;
    const suitName = currentLanguage === 'zh' ? SUIT_ZH[repeatedSuit[0]].plural : suit.plural;
    return currentLanguage === 'zh'
      ? `这组三张牌里有两张以上都属于${suitName}，所以它特别强调${suitFocus}。`
      : `The repeated ${suitName} cards make this spread especially direct about ${suitFocus}.`;
  }

  return currentLanguage === 'zh'
    ? '这次牌阵主要由小阿卡那构成，所以它说的是很贴近日常的行为、节奏和现实选择。'
    : 'Because this spread leans on minor arcana, it is speaking very directly about everyday behavior, timing, and practical choices.';
}

function buildReadingTitle(cards, mode) {
  const futureCard = cards[2];
  const futureName = getCardDisplayName(futureCard);
  const futureTheme = getCardText(futureCard, 'theme');

  if (currentLanguage === 'zh') {
    const options = mode === 'general'
      ? [
        `这组牌在提醒你走向${futureTheme}`,
        `${futureName}点出了下一步的方向`,
        `接下来最关键的主题是${futureTheme}`
      ]
      : [
        `这段关系的主题正在走向${futureTheme}`,
        `${futureName}点出了这段关系可能的下一步`,
        `这次感情占卜的重点是${futureTheme}`
      ];

    return pickRandom(options);
  }

  const options = mode === 'general'
    ? [
      `A spread about ${futureTheme}`,
      `${futureName} points toward the next chapter`,
      `The next chapter asks for ${futureTheme}`
    ]
    : [
      `A romance reading about ${futureTheme}`,
      `${futureName} describes where this connection is heading`,
      `The relationship is moving toward ${futureTheme}`
    ];

  return pickRandom(options);
}

function buildReadingSummary(cards, mode) {
  const firstCard = getCardDisplayName(cards[0]);
  const thirdCard = getCardDisplayName(cards[2]);

  if (currentLanguage === 'zh') {
    return mode === 'general'
      ? `${firstCard}说明你为什么会走到这里，而${thirdCard}说明如果你认真回应眼前的问题，接下来更可能出现什么。`
      : `${firstCard}说明你目前带着什么情绪进入这段关系，而${thirdCard}说明如果这个模式继续，关系更可能长成什么样子。`;
  }

  return mode === 'general'
    ? `${firstCard} shows what brought you here, and ${thirdCard} shows what becomes more possible if you respond to the present moment with intention.`
    : `${firstCard} shows your emotional starting point, and ${thirdCard} shows the quality this connection can grow into if the pattern continues.`;
}

function buildClosingText(cards, mode) {
  const firstShadow = getCardText(cards[0], 'shadow');
  const middleShadow = getCardText(cards[1], 'shadow');
  const futureTheme = getCardText(cards[2], 'theme');

  if (currentLanguage === 'zh') {
    if (mode === 'general') {
      return `说得直接一点，这组牌是在提醒你别再重复${firstShadow}，而是把力气用在${futureTheme}上。`;
    }

    return `说得直接一点，这段关系想变好，就要少喂养${middleShadow}，多去建立${futureTheme}。`;
  }

  if (mode === 'general') {
    return `In plain language, this reading says to move away from ${firstShadow} and build toward ${futureTheme}.`;
  }

  return `In plain language, this relationship grows best when you stop feeding ${middleShadow} and start building ${futureTheme}.`;
}

function buildCardPositionMeaning(card, index, mode) {
  const uiConfig = getModeUiConfig(mode);

  return {
    title: localize(uiConfig.positions[index].noteTitle),
    meaning: getCardMeaning(card, mode)
  };
}

function buildReading(cards, mode) {
  const config = MODE_CONFIG[mode];
  const uiConfig = getModeUiConfig(mode);
  const [firstCard, middleCard, futureCard] = cards;
  const firstMeaning = getCardMeaning(firstCard, mode);
  const middleMeaning = getCardMeaning(middleCard, mode);
  const futureMeaning = getCardMeaning(futureCard, mode);
  const positions = getModeUiConfig(mode).positions;

  if (currentLanguage === 'zh') {
    return {
      kicker: `${localize(uiConfig.kicker)} · ${localize(DECK_CONFIG[deckMode].readingLabel)}`,
      title: buildReadingTitle(cards, mode),
      summary: buildReadingSummary(cards, mode),
      paragraphs: [
        `${pickRandom(mode === 'general'
          ? ['这组三张牌不是在给你一个死结论，而是在讲一个你可以主动回应的过程。', '这次抽牌更像是在整理事情的脉络，而不是替你决定命运。', '把它当成一条线索会更有帮助，因为重点在于你接下来怎么回应。']
          : ['这组三张牌不是在制造神秘感，而是在帮助你看清这段关系的互动模式。', '这次感情占卜更像是在翻译彼此之间的情绪和节奏。', '如果把这组牌当成关系动态来读，它会比当成命运判决更准确。'])} ${localize(positions[0].label)}牌是${getCardDisplayName(firstCard)}：${firstMeaning} ${localize(positions[1].label)}牌是${getCardDisplayName(middleCard)}：${middleMeaning} ${localize(positions[2].label)}牌是${getCardDisplayName(futureCard)}：${futureMeaning}`,
        `${buildArcanaContext(cards)} ${buildTrendText(firstCard, futureCard, mode)} ${buildMiddleText(middleCard, mode)}`,
        `${pickRandom(mode === 'general'
          ? ['真正有价值的不是把未来想成完全固定，而是看清你现在该怎么做。', '这组牌最有用的地方，在于帮你看清模式，然后做一个更健康的回应。', '把这次解读当成方向感，而不是绝对预言，会更适合。']
          : ['这次感情占卜最有价值的地方，是让你看清关系里到底该诚实面对什么。', '如果这组三张牌有帮助，那就是它让你更早看见关系的真实模式。', '别把这组牌当成感情判决书，把它当成关系提醒会更有帮助。'])} ${buildClosingText(cards, mode)}`
      ]
    };
  }

  return {
    kicker: `${localize(uiConfig.kicker)} · ${localize(DECK_CONFIG[deckMode].readingLabel)}`,
    title: buildReadingTitle(cards, mode),
    summary: buildReadingSummary(cards, mode),
    paragraphs: [
      `${pickRandom(config.openers)} ${config.positions[0].label} is ${getCardDisplayName(firstCard)}: ${firstMeaning} ${config.positions[1].label} is ${getCardDisplayName(middleCard)}: ${middleMeaning} ${config.positions[2].label} is ${getCardDisplayName(futureCard)}: ${futureMeaning}`,
      `${buildArcanaContext(cards)} ${buildTrendText(firstCard, futureCard, mode)} ${buildMiddleText(middleCard, mode)}`,
      `${pickRandom(config.closers)} ${buildClosingText(cards, mode)}`
    ]
  };
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function detectQuestionTopic(question, mode) {
  const lower = question.toLowerCase();
  const found = QUESTION_TOPICS.find((topic) => topic.pattern.test(lower));

  if (found) {
    return {
      key: found.key,
      label: localize(found.label)
    };
  }

  return mode === 'romance'
    ? { key: 'love', label: currentLanguage === 'zh' ? '感情或关系' : 'love or relationship' }
    : { key: 'decision', label: currentLanguage === 'zh' ? '你的处境' : 'your situation' };
}

function getSuitCounts(cards) {
  return cards.reduce((counts, card) => {
    if (card.kind === 'minor') {
      counts[card.suit] = (counts[card.suit] || 0) + 1;
    }
    return counts;
  }, {});
}

function buildSuitAnswerLine(cards) {
  const suitCounts = getSuitCounts(cards);
  const strongest = Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0];

  if (!strongest) {
    return currentLanguage === 'zh'
      ? '这组三张牌更偏向大阿卡那，所以你问的不是一时情绪，而是更大的阶段性问题。'
      : 'The spread is leaning on major arcana, so the issue is bigger than a passing mood or one small incident.';
  }

  const suit = SUIT_MAP[strongest[0]];
  const suitName = currentLanguage === 'zh' ? SUIT_ZH[strongest[0]].plural : suit.plural;
  const suitFocus = currentLanguage === 'zh' ? SUIT_ZH[strongest[0]].readingFocus : suit.readingFocus;

  if (strongest[1] >= 2) {
    return currentLanguage === 'zh'
      ? `因为三张牌里有${strongest[1]}张都来自${suitName}，所以答案会特别围绕${suitFocus}展开。`
      : `Because ${strongest[1]} of the cards come from ${suitName}, the answer is especially focused on ${suitFocus}.`;
  }

  return currentLanguage === 'zh'
    ? `这组小阿卡那会让答案更贴近日常现实，尤其集中在${suitFocus}。`
    : `The minor arcana here keep the answer grounded in day-to-day reality, especially around ${suitFocus}.`;
}

function getQuestionLean(cards) {
  const score = (cards[0].tone * 0.75) + cards[1].tone + (cards[2].tone * 1.25);

  if (score >= 2.5) {
    return {
      label: 'yes',
      sentence: currentLanguage === 'zh'
        ? '这组三张牌整体偏向“可以”，但前提是你要有意识地往前走，而不是只靠希望硬撑。'
        : 'The cards lean yes, but they want you to move forward with intention instead of coasting on hope.'
    };
  }

  if (score <= -2.5) {
    return {
      label: 'no',
      sentence: currentLanguage === 'zh'
        ? '按照现在的模式，这组三张牌整体偏向“先不要”，至少在真正改变之前不适合硬推进。'
        : 'The cards lean no under the current pattern, or at least not without a real change first.'
    };
  }

  return {
    label: 'not-yet',
    sentence: currentLanguage === 'zh'
      ? '这组三张牌现在没有给出很干脆的是或不是，它更像是在提醒你先把模式看清楚，再决定。'
      : 'The cards do not give a clean yes or no yet. They point more toward clarifying the pattern before you commit.'
  };
}

function buildOracleOpening(question, cards, mode) {
  const lean = getQuestionLean(cards);
  const topic = detectQuestionTopic(question, mode);

  return currentLanguage === 'zh'
    ? `${lean.sentence} 对于你问的${topic.label}，${getCardDisplayName(cards[0])}、${getCardDisplayName(cards[1])}和${getCardDisplayName(cards[2])}呈现出一条从背景、到当前压力、再到后续走向的线。`
    : `${lean.sentence} For your question about ${topic.label}, ${getCardDisplayName(cards[0])}, ${getCardDisplayName(cards[1])}, and ${getCardDisplayName(cards[2])} describe a path from background, to present tension, to likely outcome.`;
}

function buildOracleMiddle(question, cards, mode) {
  const [firstCard, middleCard, futureCard] = cards;
  const firstMeaning = lowerFirstLocalized(getCardMeaning(firstCard, mode));
  const middleMeaning = lowerFirstLocalized(getCardMeaning(middleCard, mode));
  const futureMeaning = lowerFirstLocalized(getCardMeaning(futureCard, mode));

  return currentLanguage === 'zh'
    ? `${buildArcanaContext(cards)} ${buildSuitAnswerLine(cards)} ${getCardDisplayName(firstCard)}说明这件事是怎么发展到现在的：${firstMeaning} ${getCardDisplayName(middleCard)}说明真正卡住你的点在哪里：${middleMeaning} ${getCardDisplayName(futureCard)}说明如果没有重要改变，事情大概率会走向哪里：${futureMeaning}`
    : `${buildArcanaContext(cards)} ${buildSuitAnswerLine(cards)} ${getCardDisplayName(firstCard)} shows what is shaping the issue: ${firstMeaning} ${getCardDisplayName(middleCard)} shows the real pressure point: ${middleMeaning} ${getCardDisplayName(futureCard)} shows where the situation goes if nothing important changes: ${futureMeaning}`;
}

function buildOracleClosing(question, cards, mode) {
  const topic = detectQuestionTopic(question, mode);
  const lean = getQuestionLean(cards);
  const futureCard = cards[2];
  const middleCard = cards[1];
  const futureTheme = getCardText(futureCard, 'theme');
  const middleShadow = getCardText(middleCard, 'shadow');
  const futureAdvice = getCardText(futureCard, 'advice');

  if (lean.label === 'yes') {
    return currentLanguage === 'zh'
      ? `比较直接的答案是：可以往${futureTheme}走，但要负责任地走。说白一点，把重点放回${topic.label}，别再继续喂养${middleShadow}，然后照着未来牌的提醒去做：${futureAdvice}`
      : `The cleanest answer is to move toward ${futureTheme}, but do it responsibly. In plain terms, focus on ${topic.label}, stop feeding ${middleShadow}, and follow the future card's instruction: ${futureAdvice}`;
  }

  if (lean.label === 'no') {
    return currentLanguage === 'zh'
      ? `更稳妥的答案是先暂停，或先从现在这个版本里退一步。说白一点，别再继续喂养${middleShadow}，先保护你的能量，在模式没有真的变化之前不要硬往前冲。${futureAdvice}`
      : `The safer answer is to pause or step back from the current version of this situation. In plain terms, stop feeding ${middleShadow}, protect your energy, and do not move forward until the pattern changes. ${futureAdvice}`;
  }

  return currentLanguage === 'zh'
    ? `更诚实的答案是：现在还不到最后下决定的时候，牌更希望你先把问题看清楚。说白一点，把真正的问题点出来，别再继续喂养${middleShadow}，然后把这句话当成下一步提醒：${futureAdvice}`
    : `The most honest answer is that the cards want more clarity before a final decision. In plain terms, name the problem directly, stop feeding ${middleShadow}, and use this as your next guide: ${futureAdvice}`;
}

function buildOracleResponse(question, cards, mode) {
  return [
    buildOracleOpening(question, cards, mode),
    buildOracleMiddle(question, cards, mode),
    buildOracleClosing(question, cards, mode)
  ];
}

function setOraclePlaceholder(message) {
  oracleResponse.innerHTML = `<p class="oracle-placeholder">${message}</p>`;
}

function fillOraclePrompt(text) {
  oracleQuestionInput.value = text;
  oracleQuestionInput.focus();
}

function askOracle() {
  const question = oracleQuestionInput.value.trim();

  if (!question) {
    setOraclePlaceholder(UI_COPY[currentLanguage].oracleMissingQuestion);
    oracleQuestionInput.focus();
    return;
  }

  const paragraphs = buildOracleResponse(question, selectedCards, appMode);
  oracleResponse.innerHTML = `
    <p class="oracle-question-line">${escapeHtml(UI_COPY[currentLanguage].oracleQuestionPrefix)}: ${escapeHtml(question)}</p>
    ${paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join('')}
  `;
}

function buildCardArt(card) {
  const displayName = getCardDisplayName(card);
  const rankLabel = currentLanguage === 'zh' ? (card.rankLabelZh || card.rankLabel) : card.rankLabel;
  const suitLabel = currentLanguage === 'zh' ? (card.suitLabelZh || card.suitLabel) : card.suitLabel;
  const domainLabel = currentLanguage === 'zh' ? (card.domainLabelZh || card.domainLabel) : card.domainLabel;

  if (card.img) {
    return `<img src="${IMAGE_ROOT}${card.img}" alt="${displayName}">`;
  }

  if (card.imageUrl) {
    return `
      <div class="minor-card-media">
        <img
          src="${card.imageUrl}"
          alt="${displayName}"
          loading="lazy"
          referrerpolicy="no-referrer"
          onerror="this.style.display='none';this.nextElementSibling.style.display='grid';"
        >
        <div class="minor-card-visual suit-${card.suit}" style="display:none">
          <span class="minor-card-corner">${rankLabel}</span>
          <div class="minor-card-center">
            <span class="minor-card-rank">${rankLabel}</span>
            <span class="minor-card-suit">${suitLabel}</span>
            <span class="minor-card-domain">${domainLabel}</span>
          </div>
          <span class="minor-card-corner minor-card-corner-bottom">${rankLabel}</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="minor-card-visual suit-${card.suit}">
      <span class="minor-card-corner">${rankLabel}</span>
      <div class="minor-card-center">
        <span class="minor-card-rank">${rankLabel}</span>
        <span class="minor-card-suit">${suitLabel}</span>
        <span class="minor-card-domain">${domainLabel}</span>
      </div>
      <span class="minor-card-corner minor-card-corner-bottom">${rankLabel}</span>
    </div>
  `;
}

function showFinalResult() {
  const uiConfig = getModeUiConfig(appMode);
  const reading = buildReading(selectedCards, appMode);
  const row = document.getElementById('reveal-card-row');

  row.innerHTML = selectedCards
    .map((card, index) => {
      const positionInfo = buildCardPositionMeaning(card, index, appMode);
      return `
        <article class="reveal-card-item">
          <div class="reveal-card-topline">
            <span class="position-badge">${localize(uiConfig.positions[index].label)}</span>
            <span class="arcana-pill">${getCardArcanaLabel(card)}</span>
          </div>
          <p class="keyword-line">${getCardKeywords(card).join(' · ')}</p>
          <div class="reveal-card-img">
            ${buildCardArt(card)}
          </div>
          <p class="reveal-card-name">${getCardDisplayName(card)}</p>
          <p class="reveal-card-intro">${getCardText(card, 'intro')}</p>
          <p class="reveal-card-note-title">${positionInfo.title}</p>
          <p class="reveal-card-note">${positionInfo.meaning}</p>
        </article>
      `;
    })
    .join('');

  revealKicker.innerText = reading.kicker;
  revealTitle.innerText = reading.title;
  readingSummary.innerText = reading.summary;
  finalNarrative.innerHTML = reading.paragraphs.map((text) => `<p>${text}</p>`).join('');
  oracleQuestionInput.value = '';
  setOraclePlaceholder(UI_COPY[currentLanguage].oracleEmpty);

  document.getElementById('final-reveal').style.display = 'flex';
  document.getElementById('hud-layer').style.display = 'none';
  document.getElementById('camera-window').style.display = 'none';
}

function drawLoop() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const theme = getTheme();

  gCtx.canvas.width = width;
  gCtx.canvas.height = height;

  drawBackground(width, height, theme);
  particles.forEach((particle) => {
    particle.update(width, height);
    particle.draw(theme);
  });

  if (currentStep < 3) {
    drawDeckWheel(width, height, theme);
  }

  requestAnimationFrame(drawLoop);
}

askOracleButton.addEventListener('click', askOracle);
oracleQuestionInput.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    askOracle();
  }
});

promptChipButtons.forEach((button) => {
  button.addEventListener('click', () => {
    fillOraclePrompt(button.dataset.prompt);
  });
});

window.setLanguage = setLanguage;

applyLanguage();
setDeckMode(deckMode);
