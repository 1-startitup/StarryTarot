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
const finalAdvice = document.getElementById('final-advice');
const finalReflection = document.getElementById('final-reflection');

let rotation = 0;
let rotationVel = 0;
let lastHandX = 0.5;
let isPinching = false;
let pinchTimer = 0;
let selectedCards = [];
let currentStep = 0;
let appMode = 'general';
let activeDeck = [];
let particles = [];

const imgCache = {};

const IMAGE_ROOT = 'https://www.sacred-texts.com/tarot/pkt/img/';
const PINCH_FRAMES = 26;

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
      'This spread reads like a clear sequence instead of a vague omen.',
      'These three cards describe a process, not a fixed fate.',
      'The cards tell a story about how your situation is developing.'
    ],
    closers: [
      'Taken together, the message is practical: notice the pattern, then choose the healthier response.',
      'The important part here is not predicting every detail; it is seeing what kind of response will serve you best.',
      'The reading becomes useful when you treat it as direction, not as something set in stone.'
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
      'This spread reads less like mystery and more like relationship dynamics.',
      'These cards describe how emotion, behavior, and timing are interacting.',
      'The relationship message here is easier to read when each card is kept grounded.'
    ],
    closers: [
      'The real value of this spread is seeing what kind of honesty or boundary would make the connection healthier.',
      'This reading is most useful when it helps you name the pattern instead of romanticizing it.',
      'The cards are not saying love is impossible or guaranteed; they are showing the emotional conditions around it.'
    ]
  }
};

const tarotDeck = [
  {
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

for (let i = 0; i < 90; i += 1) {
  particles.push(new Particle());
}

tarotDeck.forEach((card) => {
  const img = new Image();
  img.src = `${IMAGE_ROOT}${card.img}`;
  imgCache[card.name] = img;
});

function getTheme() {
  return THEMES[appMode] || THEMES.general;
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

function preInit(mode) {
  appMode = mode;
  document.body.dataset.mode = mode;
  selectedCards = [];
  currentStep = 0;
  rotation = Math.random() * Math.PI * 2;
  rotationVel = 0;
  lastHandX = 0.5;
  isPinching = false;
  pinchTimer = 0;
  activeDeck = shuffleDeck(tarotDeck);

  document.getElementById('mode-selector').style.display = 'none';
  document.getElementById('hud-layer').style.display = 'block';
  document.getElementById('camera-window').style.display = 'block';

  applyModeLabels();
  updateHud();
  startApp();
}

function applyModeLabels() {
  const config = MODE_CONFIG[appMode];
  modeBadge.innerText = config.label;
  revealKicker.innerText = config.kicker;

  config.positions.forEach((position, index) => {
    document.getElementById(`label-${index}`).innerText = position.label.toUpperCase();
    document.getElementById(`slot-value-${index}`).innerText = selectedCards[index]
      ? prettyName(selectedCards[index].name)
      : 'Waiting';
  });
}

function updateHud() {
  const config = MODE_CONFIG[appMode];
  const nextPosition = config.positions[currentStep];

  if (nextPosition) {
    statusText.innerText = currentStep === 0
      ? 'Swipe to browse the deck'
      : `Choose the card for ${nextPosition.label.toLowerCase()}`;
    statusSubtext.innerText = `Hold a pinch on the glowing front card. This card represents ${nextPosition.hint}.`;
  } else {
    statusText.innerText = 'Reading complete';
    statusSubtext.innerText = 'The spread is ready.';
  }

  for (let i = 0; i < 3; i += 1) {
    const slot = document.getElementById(`slot-${i}`);
    const selected = Boolean(selectedCards[i]);
    slot.className = selected ? 'slot complete' : i === currentStep ? 'slot active' : 'slot';
  }
}

function startApp() {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6
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

function onHandResults(results) {
  const theme = getTheme();

  canvasCtx.fillStyle = '#050712';
  canvasCtx.fillRect(0, 0, 180, 135);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    pinchTimer = 0;
    isPinching = false;
    return;
  }

  const lm = results.multiHandLandmarks[0];
  const isSwiping = Math.abs(rotationVel) > 0.04;

  if (!isPinching && pinchTimer === 0) {
    const dx = lm[9].x - lastHandX;
    if (Math.abs(dx) > 0.005) {
      rotationVel += dx * 0.72;
    }
  }

  if (!isSwiping) {
    const pinchDistance = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
    if (pinchDistance < 0.09) {
      pinchTimer += 1;
      if (pinchTimer >= PINCH_FRAMES) {
        isPinching = true;
      }
    } else {
      pinchTimer = 0;
      isPinching = false;
    }
  }

  lastHandX = lm[9].x;

  canvasCtx.fillStyle = theme.secondary;
  lm.forEach((pt) => {
    canvasCtx.beginPath();
    canvasCtx.arc(pt.x * 180, pt.y * 135, 2.8, 0, Math.PI * 2);
    canvasCtx.fill();
  });
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
    gCtx.font = `${Math.max(10, width * 0.082)}px Cinzel`;
    gCtx.textAlign = 'center';
    gCtx.fillText('PINCH TO DRAW', 0, height * 0.33);
  }

  gCtx.restore();
}

function drawDeckWheel(width, height, theme) {
  if (!activeDeck.length) {
    return;
  }

  if (pinchTimer > 0) {
    rotationVel = 0;
  } else {
    rotationVel *= 0.95;
  }

  rotation += rotationVel;

  const centerY = width < 960 ? height * 0.66 : height * 0.61;
  const orbitX = Math.min(width * 0.37, 520);
  const orbitY = Math.min(height * 0.13, 112);
  const cardWidth = Math.max(90, Math.min(140, width * 0.1));
  const cardHeight = cardWidth * 1.54;

  const positioned = activeDeck
    .map((card, index) => {
      const angle = (index / activeDeck.length) * Math.PI * 2 + rotation;
      const z = Math.sin(angle);
      const depth = (z + 1) / 2;
      const scale = 0.55 + depth * 0.72;

      return {
        card,
        z,
        scale,
        x: width / 2 + Math.cos(angle) * orbitX,
        y: centerY + Math.sin(angle) * orbitY
      };
    })
    .sort((a, b) => a.z - b.z);

  const frontCard = positioned[positioned.length - 1];

  positioned.forEach((entry) => {
    if (entry.z < -0.7) {
      return;
    }

    drawCardBack(
      entry.x,
      entry.y,
      cardWidth * entry.scale,
      cardHeight * entry.scale,
      frontCard && entry.card.name === frontCard.card.name && entry.z > 0.4,
      theme,
      (entry.z + 1) / 2
    );
  });

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

  applyModeLabels();
  updateHud();

  if (currentStep === 3) {
    showFinalResult();
  }
}

function buildTrendText(firstCard, futureCard, mode) {
  const trend = futureCard.tone - firstCard.tone;

  if (trend >= 2) {
    return mode === 'general'
      ? 'The energy gets lighter as the spread goes on, which usually means the situation can improve once you stop carrying the older pattern into the next chapter.'
      : 'The emotional energy becomes steadier by the end of the spread, which is a good sign if both people are willing to adjust honestly.'
      ;
  }

  if (trend <= -2) {
    return mode === 'general'
      ? 'The future card is heavier than the opening card, so it would be wise to deal with the issue directly instead of hoping it fades on its own.'
      : 'The outcome card carries more weight than the opening card, so the relationship likely needs a direct conversation or a firmer boundary soon.'
      ;
  }

  return mode === 'general'
    ? 'The spread stays fairly even from start to finish, so progress depends more on consistent choices than on one dramatic move.'
    : 'The emotional tone stays fairly even across the spread, so what matters most is how the current pattern is handled rather than waiting for magic to fix it.'
    ;
}

function buildMiddleText(middleCard, mode) {
  if (middleCard.tone <= -1) {
    return mode === 'general'
      ? `The present card is the pressure point. ${middleCard.advice}`
      : `The middle card suggests the relationship can be misunderstood if nobody says the quiet part out loud. ${middleCard.advice}`
      ;
  }

  if (middleCard.tone >= 2) {
    return mode === 'general'
      ? `The present card is supportive, so there is more working in your favor than you may feel. ${middleCard.advice}`
      : `The middle card has warm energy, which helps if the openness is matched with real consistency. ${middleCard.advice}`
      ;
  }

  return mode === 'general'
    ? `The present card asks for balance more than speed. ${middleCard.advice}`
    : `The middle card asks for steady effort instead of mixed signals. ${middleCard.advice}`
    ;
}

function buildReadingTitle(cards, mode) {
  const futureCard = cards[2];
  const futureName = prettyName(futureCard.name);

  const options = mode === 'general'
    ? [
      `A spread about ${futureCard.theme}`,
      `${futureName} points toward the next chapter`,
      `The path is moving toward ${futureCard.theme}`
    ]
    : [
      `A romance reading about ${futureCard.theme}`,
      `${futureName} describes where this connection is heading`,
      `The relationship is moving toward ${futureCard.theme}`
    ];

  return pickRandom(options);
}

function buildReadingSummary(cards, mode) {
  const firstCard = prettyName(cards[0].name);
  const thirdCard = prettyName(cards[2].name);

  return mode === 'general'
    ? `${firstCard} shows what brought you here, and ${thirdCard} shows what becomes possible if you respond to the present moment with intention.`
    : `${firstCard} shows your emotional starting point, and ${thirdCard} shows the quality this connection can grow into if the pattern continues.`;
}

function buildClosingText(cards, mode) {
  if (mode === 'general') {
    return `In plain language, this reading says to move away from ${cards[0].shadow} and build toward ${cards[2].theme}.`;
  }

  return `In plain language, this relationship grows best when you stop feeding ${cards[1].shadow} and start building ${cards[2].theme}.`;
}

function buildAdvice(cards, mode) {
  if (mode === 'general') {
    return `Start with the present card: ${cards[1].advice} Then let the future card guide your next concrete move: ${cards[2].advice}`;
  }

  return `Begin with honesty about the current pattern. ${cards[0].advice} Then use the outcome card as your standard: ${cards[2].advice}`;
}

function buildReflection(cards, mode) {
  if (mode === 'general') {
    return `What would it look like this week to choose ${cards[2].theme} instead of repeating ${cards[1].shadow}?`;
  }

  return `If this connection moved toward ${cards[2].theme}, what conversation, choice, or boundary would need to happen first?`;
}

function buildCardPositionMeaning(card, index, mode) {
  const meaningKey = mode === 'general' ? 'general' : 'love';
  const config = MODE_CONFIG[mode];
  return {
    title: config.positions[index].noteTitle,
    meaning: card[meaningKey]
  };
}

function buildReading(cards, mode) {
  const meaningKey = mode === 'general' ? 'general' : 'love';
  const config = MODE_CONFIG[mode];
  const [firstCard, middleCard, futureCard] = cards;

  return {
    kicker: config.kicker,
    title: buildReadingTitle(cards, mode),
    summary: buildReadingSummary(cards, mode),
    paragraphs: [
      `${pickRandom(config.openers)} ${config.positions[0].label} is ${prettyName(firstCard.name)}: ${firstCard[meaningKey]} ${config.positions[1].label} is ${prettyName(middleCard.name)}: ${middleCard[meaningKey]} ${config.positions[2].label} is ${prettyName(futureCard.name)}: ${futureCard[meaningKey]}`,
      `${buildTrendText(firstCard, futureCard, mode)} ${buildMiddleText(middleCard, mode)}`,
      `${pickRandom(config.closers)} ${buildClosingText(cards, mode)}`
    ],
    advice: buildAdvice(cards, mode),
    reflection: buildReflection(cards, mode)
  };
}

function showFinalResult() {
  const config = MODE_CONFIG[appMode];
  const reading = buildReading(selectedCards, appMode);
  const row = document.getElementById('reveal-card-row');

  row.innerHTML = selectedCards
    .map((card, index) => {
      const positionInfo = buildCardPositionMeaning(card, index, appMode);
      return `
        <article class="reveal-card-item">
          <div class="reveal-card-topline">
            <span class="position-badge">${config.positions[index].label}</span>
            <span class="keyword-line">${card.keywords.join(' · ')}</span>
          </div>
          <div class="reveal-card-img">
            <img src="${IMAGE_ROOT}${card.img}" alt="${prettyName(card.name)}">
          </div>
          <p class="reveal-card-name">${prettyName(card.name)}</p>
          <p class="reveal-card-intro">${card.intro}</p>
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
  finalAdvice.innerText = reading.advice;
  finalReflection.innerText = reading.reflection;

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
