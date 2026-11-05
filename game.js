(() => {
  "use strict";

  const PLAYER_MAX_HP = 38;
  const PLAYER_AP = 3;
  const HEAD_MAX_HP = 20;
  const ATTACK_MODIFIERS = ["×", -2, -1, -1, 0, 0, 0, 0, 0, 1, 1, 2];
  const NEGATIVE_MODIFIERS = [-2, -1, -1];

  const HEADS = {
    dragon: {
      name: "龙头",
      short: "龙",
      faces: [3, 6, 9, 10],
      note: "气吼 · 法术反射 · 飞行 · 火焰",
    },
    lion: {
      name: "狮头",
      short: "狮",
      faces: [1, 2, 8],
      note: "啃咬 · 爪击 · 尾击",
    },
    goat: {
      name: "羊头",
      short: "羊",
      faces: [4, 5, 7, 11],
      note: "角撞 · 降咒 · 嘲讽 · 争吵",
    },
  };

  const ACTIONS = {
    1: {
      name: "啃咬",
      head: "lion",
      phase: "attack",
      detail: "6 点穿刺物理伤害",
    },
    2: {
      name: "爪击",
      head: "lion",
      phase: "attack",
      detail: "3 点挥砍物理伤害 × 2",
    },
    3: {
      name: "气吼功",
      head: "dragon",
      phase: "support",
      detail: "本回合使用近战攻击牌者下回合倒地",
    },
    4: {
      name: "角撞",
      head: "goat",
      phase: "attack",
      detail: "5 点钝击物理伤害",
    },
    5: {
      name: "降咒",
      head: "goat",
      phase: "support",
      detail: "施加 1 层随机负面状态",
    },
    6: {
      name: "法术反射",
      head: "dragon",
      phase: "support",
      detail: "使 1 张法术牌无效",
    },
    7: {
      name: "恶毒嘲笑",
      head: "goat",
      phase: "support",
      detail: "2 点心灵伤害；羊头获得嘲讽",
    },
    8: {
      name: "尾击",
      head: "lion",
      phase: "attack",
      detail: "3 点钝击物理伤害",
    },
    9: {
      name: "振翅",
      head: "dragon",
      phase: "support",
      detail: "获得 1 次飞行格挡",
    },
    10: {
      name: "火焰吐息",
      head: "dragon",
      phase: "attack",
      detail: "15 点火焰伤害",
    },
    11: {
      name: "争吵",
      head: "goat",
      phase: "support",
      detail: "无事发生",
    },
    12: {
      name: "重投",
      head: "body",
      phase: "special",
      detail: "重投全部骰子，直到没有 12",
    },
  };

  const EARTH_THROW = {
    id: "earth-throw",
    name: "地球上投",
    head: "body",
    phase: "attack",
    detail: "17 点重力伤害；替代骰面 2 与 9",
    special: true,
  };

  const CARD_DEFS = [
    {
      id: "strike",
      name: "普通攻击",
      category: "攻击",
      copy: "对一个头部造成 3 点穿刺物理伤害。",
      effect: "attack",
      damage: 3,
      damageType: "piercing",
      target: "single",
      resolution: "attack",
      melee: true,
      copies: 4,
      tags: ["穿刺"],
    },
    {
      id: "defend",
      name: "防御",
      category: "防御",
      copy: "本回合获得 5 点临时防御。",
      effect: "shield",
      shield: 5,
      target: "none",
      resolution: "skill",
      copies: 4,
      tags: ["本回合"],
    },
    {
      id: "flying_knife",
      name: "飞刀",
      category: "攻击",
      copy: "对所有头部造成 7 点穿刺物理伤害。",
      effect: "attack",
      damage: 7,
      damageType: "piercing",
      target: "all",
      resolution: "attack",
      consume: true,
      tags: ["范围", "消耗"],
    },
    {
      id: "dragon_awe",
      name: "龙之威仪",
      category: "战术",
      copy: "奇美拉本回合少投 1 枚行动骰，立即生效。",
      effect: "reduce_dice",
      target: "none",
      resolution: "skill",
      immediate: true,
      copies: 2,
      tags: ["立即"],
    },
    {
      id: "evade",
      name: "闪躲",
      category: "防御",
      copy: "本回合获得 50% 闪避。",
      effect: "dodge",
      dodge: 50,
      target: "none",
      resolution: "skill",
      tags: ["本回合"],
    },
    {
      id: "execute",
      name: "处决",
      category: "处决",
      copy: "若所选头部生命不高于 8，直接将其击杀。",
      effect: "execute",
      target: "single",
      resolution: "attack",
      melee: true,
      tags: ["击杀"],
    },
    {
      id: "light_as_swallow",
      name: "身轻如燕",
      category: "防御",
      copy: "弃掉所有手牌，本回合获得 80% 闪避。",
      effect: "discard_hand_dodge",
      dodge: 80,
      target: "none",
      resolution: "skill",
      tags: ["弃牌"],
    },
    {
      id: "reflex_evasion",
      name: "反射闪避",
      category: "防御",
      copy: "本回合受到的伤害减半并向上取整。",
      effect: "halve_damage",
      target: "none",
      resolution: "skill",
      tags: ["本回合"],
    },
    {
      id: "scout",
      name: "侦察",
      category: "战术",
      copy: "本场战斗对奇美拉造成的伤害 +1。",
      effect: "scout",
      target: "none",
      resolution: "skill",
      tags: ["本场"],
    },
    {
      id: "ultimate_weakness",
      name: "终极弱点",
      category: "战术",
      copy: "烧毁所有手牌，本场伤害 +X，X 为烧毁张数。",
      effect: "ultimate_weakness",
      target: "none",
      resolution: "skill",
      tags: ["烧毁"],
    },
    {
      id: "scale_armor",
      name: "鳞片护甲",
      category: "防御",
      copy: "损失 6 点生命，本场战斗护甲 +2。",
      effect: "armor",
      armor: 2,
      selfDamage: 6,
      target: "none",
      resolution: "skill",
      tags: ["本场"],
    },
    {
      id: "poison_dagger",
      name: "毒匕首",
      category: "攻击",
      copy: "对一个头部造成 3 点穿刺伤害并施加 1 层中毒。",
      effect: "attack",
      damage: 3,
      damageType: "piercing",
      poison: 1,
      target: "single",
      resolution: "attack",
      melee: true,
      copies: 3,
      tags: ["中毒"],
    },
    {
      id: "venom_burst",
      name: "毒液爆发",
      category: "攻击",
      copy: "对一个头部造成其中毒层数 ×3 的毒素伤害。",
      effect: "venom_burst",
      target: "single",
      resolution: "attack",
      tags: ["毒素"],
    },
    {
      id: "taste_venom",
      name: "刀口舔毒",
      category: "恢复",
      copy: "移除一个头部所有中毒，回复层数 ×3 生命。",
      effect: "taste_venom",
      target: "single",
      resolution: "skill",
      tags: ["恢复"],
    },
    {
      id: "throat_slash",
      name: "割喉",
      category: "攻击",
      copy: "对一个头部造成 10 点挥砍物理伤害。",
      effect: "attack",
      damage: 10,
      damageType: "slashing",
      target: "single",
      resolution: "attack",
      consume: true,
      melee: true,
      tags: ["挥砍", "消耗"],
    },
    {
      id: "sneak_attack",
      name: "偷袭",
      category: "攻击",
      copy: "对一个头部造成 6 点穿刺物理伤害。",
      effect: "attack",
      damage: 6,
      damageType: "piercing",
      target: "single",
      resolution: "attack",
      consume: true,
      innate: true,
      melee: true,
      tags: ["固有", "消耗"],
    },
    {
      id: "dragon_breath",
      name: "龙之吐息",
      category: "状态",
      copy: "对所有头部各施加 1 层中毒。",
      effect: "poison_all",
      poison: 1,
      target: "all",
      resolution: "skill",
      copies: 2,
      tags: ["范围", "中毒"],
    },
    {
      id: "venom_fang",
      name: "毒牙",
      category: "状态",
      copy: "对一个头部施加 2 层中毒。",
      effect: "poison",
      poison: 2,
      target: "single",
      resolution: "skill",
      tags: ["中毒"],
    },
    {
      id: "search",
      name: "搜索",
      category: "战术",
      copy: "立即抽取 3 张卡牌。",
      effect: "search",
      target: "none",
      resolution: "skill",
      immediate: true,
      tags: ["立即", "抽牌"],
    },
    {
      id: "blood_trade",
      name: "血色交易",
      category: "战术",
      copy: "立即失去 5 点生命，获得 2 点行动力。",
      effect: "blood_trade",
      target: "none",
      resolution: "skill",
      immediate: true,
      tags: ["立即", "行动力"],
    },
    {
      id: "multi_stab",
      name: "连刺",
      category: "攻击",
      copy: "对一个头部造成 2 点穿刺伤害，连续 3 次。",
      effect: "attack",
      damage: 2,
      hits: 3,
      damageType: "piercing",
      target: "single",
      resolution: "attack",
      melee: true,
      tags: ["连击", "穿刺"],
    },
    {
      id: "venom_spray",
      name: "淬毒飞溅",
      category: "攻击",
      copy: "造成 4 点穿刺伤害；命中后其余每个头部获得 1 层中毒。",
      effect: "venom_spray",
      damage: 4,
      damageType: "piercing",
      target: "single",
      resolution: "attack",
      melee: true,
      tags: ["范围中毒"],
    },
    {
      id: "smoke",
      name: "烟幕",
      category: "防御",
      copy: "本回合获得 35% 闪避；成功闪避一次后抽 1 张牌。",
      effect: "smoke",
      dodge: 35,
      target: "none",
      resolution: "skill",
      tags: ["闪避", "抽牌"],
    },
    {
      id: "feint",
      name: "佯攻",
      category: "战术",
      copy: "抽 1 张牌；本回合下一张攻击牌伤害 +2。",
      effect: "feint",
      target: "none",
      resolution: "skill",
      tags: ["抽牌", "强化"],
    },
  ];

  const els = {
    roundLabel: document.querySelector("#round-label"),
    phaseLabel: document.querySelector("#phase-label"),
    playerHp: document.querySelector("#player-hp"),
    playerHpTrack: document.querySelector("#player-hp-track"),
    playerHpBar: document.querySelector("#player-hp-bar"),
    playerArmor: document.querySelector("#player-armor"),
    playerShield: document.querySelector("#player-shield"),
    playerDodge: document.querySelector("#player-dodge"),
    playerStatuses: document.querySelector("#player-statuses"),
    headTargets: document.querySelector("#head-targets"),
    enemyTotalHp: document.querySelector("#enemy-total-hp"),
    enemyHitFlash: document.querySelector("#enemy-hit-flash"),
    flightBadge: document.querySelector("#flight-badge"),
    flightValue: document.querySelector("#flight-value"),
    tauntBadge: document.querySelector("#taunt-badge"),
    disadvantageBadge: document.querySelector("#disadvantage-badge"),
    enemyDice: document.querySelector("#enemy-dice"),
    rollNote: document.querySelector("#roll-note"),
    spotlightSource: document.querySelector(".spotlight-source"),
    spotlightTitle: document.querySelector("#spotlight-title"),
    spotlightCopy: document.querySelector("#spotlight-copy"),
    resolutionFeed: document.querySelector("#resolution-feed"),
    enemyActionList: document.querySelector("#enemy-action-list"),
    skipButton: document.querySelector("#skip-button"),
    handInstruction: document.querySelector("#hand-instruction"),
    cardTrack: document.querySelector("#card-track"),
    emptyHand: document.querySelector("#empty-hand"),
    apValue: document.querySelector("#ap-value"),
    apTrack: document.querySelector("#ap-track"),
    deckCount: document.querySelector("#deck-count"),
    discardCount: document.querySelector("#discard-count"),
    exhaustCount: document.querySelector("#exhaust-count"),
    deckButton: document.querySelector("#deck-button"),
    discardButton: document.querySelector("#discard-button"),
    exhaustButton: document.querySelector("#exhaust-button"),
    stagedCount: document.querySelector("#staged-count"),
    stagedCopy: document.querySelector("#staged-copy"),
    standButton: document.querySelector("#stand-button"),
    endTurnButton: document.querySelector("#end-turn-button"),
    clearSelectionButton: document.querySelector("#clear-selection-button"),
    audioButton: document.querySelector("#audio-button"),
    audioLabel: document.querySelector("#audio-label"),
    rulesDialog: document.querySelector("#rules-dialog"),
    cardDialog: document.querySelector("#enemy-card-dialog"),
    logDialog: document.querySelector("#log-dialog"),
    combatLog: document.querySelector("#combat-log"),
    pileDialog: document.querySelector("#pile-dialog"),
    pileKicker: document.querySelector("#pile-kicker"),
    pileTitle: document.querySelector("#pile-title"),
    pileDescription: document.querySelector("#pile-description"),
    pileCardGrid: document.querySelector("#pile-card-grid"),
    resolutionDialog: document.querySelector("#resolution-dialog"),
    resolutionStep: document.querySelector("#resolution-step"),
    resolutionSource: document.querySelector("#resolution-source"),
    resolutionTitle: document.querySelector("#resolution-title"),
    resolutionCopy: document.querySelector("#resolution-copy"),
    resolutionDetails: document.querySelector("#resolution-details"),
    continueResolutionButton: document.querySelector("#continue-resolution-button"),
    resultDialog: document.querySelector("#result-dialog"),
    resultKicker: document.querySelector("#result-kicker"),
    resultTitle: document.querySelector("#result-title"),
    resultCopy: document.querySelector("#result-copy"),
    resultStats: document.querySelector("#result-stats"),
    toast: document.querySelector("#toast"),
    fxLayer: document.querySelector("#fx-layer"),
    headDeathBanner: document.querySelector("#head-death-banner"),
    headDeathKicker: document.querySelector("#head-death-kicker"),
    headDeathTitle: document.querySelector("#head-death-title"),
    headDeathCopy: document.querySelector("#head-death-copy"),
    selfTestOutput: document.querySelector("#self-test-output"),
  };

  let state;
  let toastTimer;
  let actionTimer;
  let handTimer;
  let activeWait = null;
  let activeSettlementResolve = null;
  let settlementStep = 0;
  let headDeathPromise = Promise.resolve();
  let introRoarPlayed = false;
  let resolutionToken = 0;
  let fastResolution = false;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const audio = {
    context: null,
    master: null,
    musicGain: null,
    noiseBuffer: null,
    enabled: true,
    started: false,
    drumTimer: null,
  };

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
  }

  function makeInstance(card) {
    return {
      ...card,
      instanceId: `${card.id}-${crypto.randomUUID?.() ?? Math.random()}`,
    };
  }

  function createDeck() {
    return shuffle(
      CARD_DEFS.flatMap((card) =>
        Array.from({ length: card.copies ?? 1 }, () => makeInstance(card)),
      ),
    );
  }

  function emptyStatuses() {
    return {
      sleep: 0,
      disadvantage: 0,
      bleed: 0,
      slow: 0,
      paralysis: 0,
      prone: false,
    };
  }

  function createInitialState() {
    const deck = createDeck();
    const innate = deck.find((card) => card.innate);
    const rest = deck.filter((card) => card !== innate);
    const initialHand = [innate, ...rest.splice(0, 4)];
    return {
      round: 1,
      phase: "player",
      ap: PLAYER_AP,
      hand: initialHand,
      deck: rest,
      discard: [],
      exhaust: [],
      staged: [],
      selectedTarget: "dragon",
      player: {
        hp: PLAYER_MAX_HP,
        maxHp: PLAYER_MAX_HP,
        armor: 0,
        shield: 0,
        dodge: 0,
        halveDamage: false,
        damageBonus: 0,
        nextAttackBonus: 0,
        smokeDrawPending: false,
        meleePlayed: false,
        statuses: emptyStatuses(),
        pending: emptyStatuses(),
      },
      chimera: {
        heads: {
          dragon: {
            hp: HEAD_MAX_HP,
            maxHp: HEAD_MAX_HP,
            poison: 0,
            poisonActiveRound: null,
          },
          lion: {
            hp: HEAD_MAX_HP,
            maxHp: HEAD_MAX_HP,
            poison: 0,
            poisonActiveRound: null,
          },
          goat: {
            hp: HEAD_MAX_HP,
            maxHp: HEAD_MAX_HP,
            poison: 0,
            poisonActiveRound: null,
          },
        },
        taunt: false,
        disadvantage: false,
        disadvantagePending: false,
        flightWards: 0,
      },
      diceReduction: 0,
      dice: [],
      rollHistory: [],
      rerollCount: 0,
      plan: [],
      activeRollCounts: {},
      allHeadsTriggered: false,
      feed: [],
      settlementLogs: [],
      log: [],
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      forcedDice: null,
    };
  }

  function phaseLabel() {
    return {
      player: "玩家行动",
      enemy: "敌方投骰",
      resolving: "战斗结算",
      sleep: "睡眠发作",
      won: "战斗结束",
      lost: "战斗结束",
    }[state.phase] ?? state.phase;
  }

  function addLog(text, tone = "") {
    const entry = { text, tone, round: state.round };
    state.log.unshift(entry);
    state.log = state.log.slice(0, 40);
    state.settlementLogs.push(entry);
  }

  function addFeed(text, current = false) {
    state.feed.unshift({ text, current });
    state.feed = state.feed.slice(0, 6);
  }

  function showToast(text) {
    clearTimeout(toastTimer);
    els.toast.textContent = text;
    els.toast.classList.add("visible");
    toastTimer = window.setTimeout(
      () => els.toast.classList.remove("visible"),
      2100,
    );
  }

  function setSpotlight(source, title, copy) {
    els.spotlightSource.textContent = source;
    els.spotlightTitle.textContent = title;
    els.spotlightCopy.textContent = copy;
  }

  function ensureAudio() {
    if (!audio.enabled) return null;
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audio.context) {
      audio.context = new AudioContextClass();
      audio.master = audio.context.createGain();
      audio.master.gain.value = 0.86;
      const compressor = audio.context.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.ratio.value = 4;
      audio.master.connect(compressor);
      compressor.connect(audio.context.destination);

      const noiseLength = Math.floor(audio.context.sampleRate * 0.7);
      audio.noiseBuffer = audio.context.createBuffer(
        1,
        noiseLength,
        audio.context.sampleRate,
      );
      const samples = audio.noiseBuffer.getChannelData(0);
      for (let index = 0; index < noiseLength; index += 1) {
        samples[index] = Math.random() * 2 - 1;
      }
    }
    if (audio.context.state === "suspended") {
      audio.context.resume().catch(() => {});
    }
    if (!audio.started) startMusic();
    return audio.context;
  }

  function startMusic() {
    if (!audio.context || audio.started) return;
    audio.started = true;
    audio.musicGain = audio.context.createGain();
    audio.musicGain.gain.value = 0.0001;
    audio.musicGain.connect(audio.master);

    const filter = audio.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 620;
    filter.connect(audio.musicGain);

    for (const [frequency, volume] of [
      [55, 0.048],
      [82.41, 0.026],
      [110, 0.015],
    ]) {
      const oscillator = audio.context.createOscillator();
      const gain = audio.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = volume;
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start();
    }

    audio.musicGain.gain.exponentialRampToValueAtTime(
      1.22,
      audio.context.currentTime + 2.8,
    );
    playDrumBar();
    audio.drumTimer = window.setInterval(playDrumBar, 1850);
  }

  function playDrumBar() {
    if (!audio.context || !audio.musicGain || !audio.enabled || document.hidden) {
      return;
    }
    [0, 0.34, 0.72, 1.04, 1.32, 1.52].forEach((delay, index) => {
      const oscillator = audio.context.createOscillator();
      const gain = audio.context.createGain();
      const start = audio.context.currentTime + 0.02 + delay;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        index === 0 ? 74 : 92,
        start,
      );
      oscillator.frequency.exponentialRampToValueAtTime(38, start + 0.18);
      gain.gain.setValueAtTime(index === 0 || index === 3 ? 0.12 : 0.072, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
      oscillator.connect(gain);
      gain.connect(audio.musicGain);
      oscillator.start(start);
      oscillator.stop(start + 0.22);
    });
    if (!audio.noiseBuffer) return;
    const source = audio.context.createBufferSource();
    const filter = audio.context.createBiquadFilter();
    const gain = audio.context.createGain();
    source.buffer = audio.noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.value = 2200;
    filter.Q.value = 0.8;
    gain.gain.setValueAtTime(0.03, audio.context.currentTime + 0.68);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audio.context.currentTime + 0.83,
    );
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.musicGain);
    source.start(audio.context.currentTime + 0.68, 0, 0.17);
  }

  function tone({
    frequency,
    endFrequency = frequency,
    duration = 0.12,
    type = "sine",
    volume = 0.03,
    delay = 0,
  }) {
    const context = ensureAudio();
    if (!context) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(24, endFrequency),
      start + duration,
    );
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audio.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function noise(duration = 0.12, volume = 0.025, cutoff = 1200, delay = 0) {
    const context = ensureAudio();
    if (!context || !audio.noiseBuffer) return;
    const start = context.currentTime + delay;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = audio.noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.master);
    source.start(start, Math.random() * 0.25, duration);
  }

  function playSound(name) {
    if (!audio.enabled) return;
    switch (name) {
      case "select":
        tone({ frequency: 420, endFrequency: 570, duration: 0.07, type: "triangle", volume: 0.022 });
        break;
      case "deselect":
        tone({ frequency: 330, endFrequency: 220, duration: 0.07, type: "triangle", volume: 0.017 });
        break;
      case "draw":
        noise(0.11, 0.022, 2400);
        tone({ frequency: 560, endFrequency: 760, duration: 0.07, type: "triangle", volume: 0.018, delay: 0.025 });
        break;
      case "discard":
        noise(0.1, 0.02, 1200);
        tone({ frequency: 210, endFrequency: 150, duration: 0.1, type: "triangle", volume: 0.015 });
        break;
      case "exhaust":
        noise(0.28, 0.04, 900);
        tone({ frequency: 180, endFrequency: 72, duration: 0.3, type: "sawtooth", volume: 0.025 });
        break;
      case "play":
        noise(0.14, 0.026, 1300);
        tone({ frequency: 370, endFrequency: 800, duration: 0.15, type: "sawtooth", volume: 0.016 });
        break;
      case "confirm":
        tone({ frequency: 520, endFrequency: 660, duration: 0.08, type: "triangle", volume: 0.016 });
        break;
      case "dice":
        for (let index = 0; index < 9; index += 1) {
          noise(0.04, 0.015, 1600 + Math.random() * 1200, index * 0.065);
          tone({ frequency: 210 + Math.random() * 260, endFrequency: 170, duration: 0.035, type: "square", volume: 0.008, delay: index * 0.065 });
        }
        break;
      case "diceStop":
        tone({ frequency: 120, endFrequency: 68, duration: 0.18, volume: 0.055 });
        noise(0.06, 0.02, 700);
        break;
      case "reroll":
        noise(0.16, 0.035, 2600);
        tone({ frequency: 460, endFrequency: 180, duration: 0.2, type: "triangle", volume: 0.024 });
        break;
      case "hit":
        tone({ frequency: 104, endFrequency: 45, duration: 0.22, volume: 0.08 });
        noise(0.13, 0.04, 620);
        break;
      case "stab":
        noise(0.1, 0.034, 2400);
        tone({ frequency: 330, endFrequency: 82, duration: 0.14, volume: 0.045 });
        break;
      case "slash":
        noise(0.2, 0.046, 3100);
        tone({ frequency: 940, endFrequency: 190, duration: 0.17, type: "triangle", volume: 0.032 });
        break;
      case "knife":
        noise(0.26, 0.03, 2800);
        tone({ frequency: 1220, endFrequency: 430, duration: 0.2, type: "triangle", volume: 0.02 });
        break;
      case "execute":
        [130, 98, 66].forEach((frequency, index) => {
          tone({ frequency, endFrequency: frequency * 0.55, duration: 0.5, type: "sawtooth", volume: 0.045, delay: index * 0.08 });
        });
        noise(0.32, 0.05, 700);
        break;
      case "hurt":
        tone({ frequency: 88, endFrequency: 42, duration: 0.28, type: "sawtooth", volume: 0.055 });
        noise(0.18, 0.04, 520);
        break;
      case "guard":
      case "block":
        tone({ frequency: 720, endFrequency: 1080, duration: 0.16, type: "triangle", volume: 0.027 });
        tone({ frequency: 1180, endFrequency: 860, duration: 0.18, volume: 0.014, delay: 0.02 });
        break;
      case "dodge":
        noise(0.22, 0.036, 3000);
        tone({ frequency: 780, endFrequency: 1280, duration: 0.12, type: "sine", volume: 0.018 });
        break;
      case "smoke":
        noise(0.4, 0.035, 700);
        tone({ frequency: 240, endFrequency: 130, duration: 0.35, type: "sine", volume: 0.015 });
        break;
      case "wing":
        noise(0.34, 0.05, 1800);
        tone({ frequency: 130, endFrequency: 72, duration: 0.35, type: "triangle", volume: 0.028 });
        break;
      case "spell":
        [520, 660, 880].forEach((frequency, index) => {
          tone({ frequency, endFrequency: frequency * 0.75, duration: 0.28, type: "sine", volume: 0.018, delay: index * 0.06 });
        });
        break;
      case "armor":
        tone({ frequency: 150, endFrequency: 72, duration: 0.22, type: "square", volume: 0.045 });
        noise(0.14, 0.035, 620);
        break;
      case "bloodTrade":
        tone({ frequency: 72, endFrequency: 44, duration: 0.5, volume: 0.07 });
        noise(0.22, 0.045, 580);
        break;
      case "status":
        tone({ frequency: 260, endFrequency: 190, duration: 0.22, type: "triangle", volume: 0.022 });
        break;
      case "sleep":
        [392, 329.63, 261.63].forEach((frequency, index) => {
          tone({ frequency, endFrequency: frequency * 0.8, duration: 0.42, type: "sine", volume: 0.022, delay: index * 0.12 });
        });
        break;
      case "paralysis":
        noise(0.18, 0.035, 3400);
        tone({ frequency: 880, endFrequency: 520, duration: 0.2, type: "square", volume: 0.018 });
        break;
      case "bleed":
        noise(0.16, 0.035, 760);
        tone({ frequency: 190, endFrequency: 110, duration: 0.2, type: "triangle", volume: 0.022 });
        break;
      case "lionRoar":
        [148, 116, 91].forEach((frequency, index) => {
          tone({ frequency, endFrequency: frequency * 0.62, duration: 0.52, type: "sawtooth", volume: 0.04, delay: index * 0.08 });
        });
        noise(0.42, 0.045, 760);
        break;
      case "dragonRoar":
        [108, 82, 61].forEach((frequency, index) => {
          tone({ frequency, endFrequency: frequency * 0.58, duration: 0.56, type: "sawtooth", volume: 0.045, delay: index * 0.07 });
        });
        noise(0.34, 0.04, 920);
        break;
      case "goatRoar":
        tone({ frequency: 176, endFrequency: 122, duration: 0.45, type: "triangle", volume: 0.034 });
        tone({ frequency: 215, endFrequency: 145, duration: 0.42, type: "sawtooth", volume: 0.02, delay: 0.04 });
        break;
      case "introRoar":
        [128, 104, 84].forEach((frequency, index) => {
          tone({ frequency, endFrequency: frequency * 0.58, duration: 0.7, type: "sawtooth", volume: 0.05, delay: index * 0.12 });
        });
        noise(0.7, 0.055, 720);
        break;
      case "fire":
        noise(0.52, 0.065, 1250);
        tone({ frequency: 190, endFrequency: 52, duration: 0.48, type: "sawtooth", volume: 0.04 });
        break;
      case "earth":
        tone({ frequency: 96, endFrequency: 36, duration: 0.65, volume: 0.09 });
        noise(0.48, 0.07, 520);
        break;
      case "headDeathDragon":
        tone({ frequency: 92, endFrequency: 38, duration: 0.8, type: "sawtooth", volume: 0.075 });
        noise(0.55, 0.06, 500);
        break;
      case "headDeathLion":
        tone({ frequency: 132, endFrequency: 46, duration: 0.72, type: "triangle", volume: 0.07 });
        noise(0.48, 0.055, 620);
        break;
      case "headDeathGoat":
        tone({ frequency: 210, endFrequency: 86, duration: 0.62, type: "triangle", volume: 0.055 });
        tone({ frequency: 320, endFrequency: 140, duration: 0.42, type: "sine", volume: 0.025, delay: 0.08 });
        break;
      case "pileDeck":
        noise(0.2, 0.026, 2100);
        break;
      case "pileDiscard":
        noise(0.2, 0.028, 1300);
        break;
      case "pileExhaust":
        noise(0.28, 0.032, 760);
        break;
      case "win":
        [261.63, 329.63, 392, 523.25].forEach((frequency, index) => {
          tone({ frequency, duration: 0.7, type: "triangle", volume: 0.022, delay: index * 0.11 });
        });
        break;
      case "lose":
        [174.61, 146.83, 110].forEach((frequency, index) => {
          tone({ frequency, endFrequency: frequency * 0.75, duration: 0.85, volume: 0.027, delay: index * 0.15 });
        });
        break;
      default:
        break;
    }
  }

  function setAudioEnabled(enabled) {
    audio.enabled = enabled;
    els.audioButton.setAttribute("aria-pressed", String(enabled));
    els.audioButton.setAttribute(
      "aria-label",
      enabled ? "关闭声音" : "开启声音",
    );
    els.audioLabel.textContent = enabled ? "声音" : "静音";
    if (enabled) {
      ensureAudio();
      if (audio.master && audio.context) {
        audio.master.gain.setTargetAtTime(0.86, audio.context.currentTime, 0.1);
      }
    } else if (audio.master && audio.context) {
      audio.master.gain.setTargetAtTime(0.0001, audio.context.currentTime, 0.04);
    }
  }

  function wait(duration) {
    if (fastResolution || reducedMotion.matches) return Promise.resolve();
    return new Promise((resolve) => {
      activeWait = resolve;
      actionTimer = window.setTimeout(() => {
        activeWait = null;
        resolve();
      }, duration);
    });
  }

  function showDamageEffect(targetSelector, type) {
    if (reducedMotion.matches) return;
    const target = document.querySelector(targetSelector);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const effect = document.createElement("span");
    effect.className = `damage-effect ${type}`;
    effect.style.left = `${rect.left + rect.width * 0.5}px`;
    effect.style.top = `${rect.top + rect.height * 0.48}px`;
    els.fxLayer.append(effect);
    window.setTimeout(() => effect.remove(), 780);
  }

  function queueHeadDeath(headId) {
    const details = {
      dragon: ["龙头断裂", "火焰吐息、振翅与法术反射的骰面全部作废。"],
      lion: ["狮头倒下", "啃咬、爪击与尾击的骰面全部作废。"],
      goat: ["羊头沉默", "角撞、降咒、嘲讽与争吵的骰面全部作废。"],
    }[headId];
    headDeathPromise = headDeathPromise.then(
      () =>
        new Promise((resolve) => {
          els.headDeathKicker.textContent = `${HEADS[headId].name}生命归零`;
          els.headDeathTitle.textContent = details[0];
          els.headDeathCopy.textContent = details[1];
          els.headDeathBanner.classList.remove("visible");
          void els.headDeathBanner.offsetWidth;
          els.headDeathBanner.classList.add("visible");
          playSound(
            `headDeath${headId[0].toUpperCase()}${headId.slice(1)}`,
          );
          shake("enemy-impact", 420);
          window.setTimeout(() => {
            els.headDeathBanner.classList.remove("visible");
            resolve();
          }, reducedMotion.matches ? 500 : 1460);
        }),
    );
  }

  async function presentSettlementStep() {
    await headDeathPromise;
    if (activeSettlementResolve) return Promise.resolve();
    settlementStep += 1;
    els.resolutionStep.textContent = `结算第 ${settlementStep} 步`;
    els.resolutionSource.textContent = els.spotlightSource.textContent;
    els.resolutionTitle.textContent = els.spotlightTitle.textContent;
    els.resolutionCopy.textContent = els.spotlightCopy.textContent;
    const recent = state.settlementLogs.slice(0, 6);
    els.resolutionDetails.replaceChildren(
      ...recent.map((entry) => {
        const item = document.createElement("li");
        item.textContent = entry.text;
        return item;
      }),
    );
    if (!els.resolutionDialog.open) els.resolutionDialog.showModal();
    window.setTimeout(() => els.continueResolutionButton.focus(), 30);
    return new Promise((resolve) => {
      activeSettlementResolve = resolve;
    });
  }

  function continueSettlement() {
    if (!activeSettlementResolve) return;
    const resolve = activeSettlementResolve;
    activeSettlementResolve = null;
    if (els.resolutionDialog.open) els.resolutionDialog.close();
    playSound("confirm");
    resolve(true);
  }

  function skipPlayback() {
    if (els.skipButton.hidden) return;
    fastResolution = true;
    els.skipButton.hidden = true;
    if (activeWait) {
      clearTimeout(actionTimer);
      const resolve = activeWait;
      activeWait = null;
      resolve();
    }
  }

  function cancelPlayback() {
    resolutionToken += 1;
    fastResolution = false;
    if (activeWait) {
      clearTimeout(actionTimer);
      const resolve = activeWait;
      activeWait = null;
      resolve();
    }
    if (activeSettlementResolve) {
      const resolve = activeSettlementResolve;
      activeSettlementResolve = null;
      if (els.resolutionDialog.open) els.resolutionDialog.close();
      resolve(null);
    }
    if (els.resolutionDialog.open) els.resolutionDialog.close();
    els.skipButton.hidden = true;
  }

  function shake(className, duration = 300) {
    if (reducedMotion.matches) return;
    document.body.classList.add(className);
    window.setTimeout(() => document.body.classList.remove(className), duration);
  }

  function floatingText(targetSelector, text, tone = "") {
    if (reducedMotion.matches) return;
    const target = document.querySelector(targetSelector);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const element = document.createElement("span");
    element.className = `damage-number ${tone}`.trim();
    element.textContent = text;
    element.style.left = `${rect.left + rect.width * 0.62}px`;
    element.style.top = `${rect.top + rect.height * 0.42}px`;
    els.fxLayer.append(element);
    window.setTimeout(() => element.remove(), 1100);
  }

  function impact(targetSelector, className = "") {
    if (reducedMotion.matches) return;
    const target = document.querySelector(targetSelector);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const ring = document.createElement("span");
    ring.className = `impact-ring ${className}`.trim();
    ring.style.left = `${rect.left + rect.width * 0.58}px`;
    ring.style.top = `${rect.top + rect.height * 0.45}px`;
    els.fxLayer.append(ring);
    window.setTimeout(() => ring.remove(), 700);
  }

  function cardCost(card) {
    return (card.cost ?? 1) + state.player.statuses.slow;
  }

  function livingHeads() {
    return Object.keys(HEADS).filter(
      (headId) => state.chimera.heads[headId].hp > 0,
    );
  }

  function selectedHeadId() {
    const alive = livingHeads();
    if (state.chimera.taunt && state.chimera.heads.goat.hp > 0) {
      return "goat";
    }
    if (!alive.includes(state.selectedTarget)) {
      state.selectedTarget = alive[0] ?? null;
    }
    return state.selectedTarget;
  }

  function allHeadsDead() {
    return livingHeads().length === 0;
  }

  function totalEnemyHp() {
    return Object.values(state.chimera.heads).reduce(
      (sum, head) => sum + head.hp,
      0,
    );
  }

  function drawCard(count) {
    let drawn = 0;
    for (let index = 0; index < count; index += 1) {
      if (state.deck.length === 0) {
        if (state.discard.length === 0) break;
        state.deck = shuffle(state.discard);
        state.discard = [];
        addLog("牌库已空，弃牌堆洗回牌库。");
      }
      state.hand.push(state.deck.shift());
      drawn += 1;
    }
    if (drawn > 0) playSound("draw");
    return drawn;
  }

  function discardRandomCards(count, reason) {
    const removed = shuffle(state.hand).slice(0, Math.min(count, state.hand.length));
    if (removed.length === 0) return;
    const ids = new Set(removed.map((card) => card.instanceId));
    state.hand = state.hand.filter((card) => !ids.has(card.instanceId));
    state.discard.push(...removed);
    playSound("discard");
    addFeed(`${reason}：弃置 ${removed.map((card) => card.name).join("、")}`);
    addLog(
      `${reason}随机弃置「${removed.map((card) => card.name).join("、")}」。`,
      "danger",
    );
  }

  function selectCard(instanceId) {
    if (state.phase !== "player" || state.player.statuses.prone) return;
    const card = state.hand.find((item) => item.instanceId === instanceId);
    if (!card) return;
    const stagedIndex = state.staged.findIndex(
      (item) => item.card.instanceId === instanceId,
    );
    if (stagedIndex >= 0) {
      const staged = state.staged.splice(stagedIndex, 1)[0];
      if (staged.card.immediate) {
        state.staged.splice(stagedIndex, 0, staged);
        showToast("即时牌已经生效，不能撤回。");
        return;
      }
      state.ap += staged.cost;
      if (card.effect === "reduce_dice") {
        state.diceReduction = Math.max(0, state.diceReduction - 1);
      }
      playSound("deselect");
      render();
      return;
    }
    const cost = cardCost(card);
    if (state.ap < cost) {
      showToast(`行动力不足：这张牌需要 ${cost} 点。`);
      return;
    }
    state.ap -= cost;
    state.staged.push({
      card,
      target: card.target === "single" ? selectedHeadId() : null,
      cost,
    });
    if (card.effect === "reduce_dice") {
      state.diceReduction += 1;
    }
    if (card.effect === "search") {
      const drawn = drawCard(3);
      addLog(`搜索立即抽取 ${drawn} 张牌。`, "good");
      addFeed(`搜索：立即抽 ${drawn} 张`);
    }
    if (card.effect === "blood_trade") {
      state.player.hp = Math.max(0, state.player.hp - 5);
      state.totalDamageTaken += 5;
      state.ap += 2;
      addLog("血色交易：失去 5 点生命，获得 2 点行动力。", "danger");
      addFeed("血色交易：生命 -5，行动力 +2");
      floatingText(".player-panel", "-5", "danger");
      showDamageEffect(".player-panel", "slashing");
      shake("player-impact", 260);
      playSound("bloodTrade");
    }
    playSound("select");
    render();
    if (checkBattleEnd()) return;
  }

  function clearSelection() {
    if (state.phase !== "player") return;
    if (state.staged.some((staged) => staged.card.immediate)) {
      showToast("已生效的即时牌不能撤回，但可以单独取消其他卡牌。");
      return;
    }
    state.staged.forEach((staged) => {
      state.ap += staged.cost;
    });
    if (state.diceReduction > 0) state.diceReduction = 0;
    state.staged = [];
    playSound("deselect");
    render();
  }

  function setTarget(headId) {
    if (state.phase !== "player") return;
    if (state.chimera.heads[headId].hp <= 0) return;
    if (state.chimera.taunt && headId !== "goat") {
      showToast("羊头正在嘲讽，单体攻击只能选择羊头。");
      return;
    }
    state.selectedTarget = headId;
    playSound("select");
    render();
  }

  function standUp() {
    if (state.phase !== "player" || !state.player.statuses.prone) return;
    if (state.ap < 2) {
      showToast("至少需要 2 点行动力才能站起。");
      return;
    }
    state.ap -= 2;
    state.player.statuses.prone = false;
    addLog("尼克洛姆消耗 2 点行动力站起。", "good");
    addFeed("倒地解除，剩余行动力可用");
    playSound("block");
    render();
  }

  function beginEnemyPhase() {
    if (state.phase === "won" || state.phase === "lost") return;
    state.phase = "enemy";
    state.player.meleePlayed = state.staged.some((item) => item.card.melee);
    state.feed = [];
    setSpotlight(
      "敌方行动",
      "黑骰正在滚动",
      "全部骰子落定前不会开始结算；出现 12 时将重投。",
    );
    render();

    const diceCount = Math.max(1, 3 - state.diceReduction);
    const rollHistory = [];
    let finalDice = [];
    for (let attempt = 0; attempt < 40; attempt += 1) {
      finalDice = state.forcedDice
        ? state.forcedDice.splice(0, diceCount)
        : Array.from({ length: diceCount }, () => rollDie(12));
      rollHistory.push([...finalDice]);
      if (!finalDice.includes(12)) break;
    }
    state.forcedDice = null;
    state.dice = finalDice;
    state.rollHistory = rollHistory;
    state.rerollCount = Math.max(0, rollHistory.length - 1);
    state.plan = buildEnemyPlan(finalDice);
    state.activeRollCounts = state.plan
      .filter((action) => !action.special)
      .reduce((counts, action) => {
        counts[action.value] = (counts[action.value] ?? 0) + 1;
        return counts;
      }, {});
    renderDice(true);
    renderActions();
    addLog(
      `奇美拉掷出 ${finalDice.join("、")}${state.rerollCount ? `，此前重投 ${state.rerollCount} 次` : ""}。`,
    );
    playSound("dice");
    if (state.rerollCount > 0) playSound("reroll");
    els.rollNote.textContent =
      state.rerollCount > 0 ? `重投 ${state.rerollCount} 次` : `${diceCount}D12`;

    window.setTimeout(() => {
      if (state.phase !== "enemy") return;
      [...els.enemyDice.querySelectorAll(".die")].forEach((die, index) => {
        window.setTimeout(() => {
          die.classList.remove("rolling");
          die.classList.add("settled");
        }, index * 65);
      });
      playSound("diceStop");
    }, 460);

    actionTimer = window.setTimeout(resolveRound, 980);
  }

  function countTriggeredHeads(dice) {
    const heads = new Set();
    dice.forEach((value) => {
      if (value === 12 || value === 2 || value === 9) return;
      const action = ACTIONS[value];
      if (action && state.chimera.heads[action.head]?.hp > 0) {
        heads.add(action.head);
      }
    });
    if (
      dice.includes(2) &&
      dice.includes(9) &&
      state.chimera.heads.lion.hp > 0 &&
      state.chimera.heads.dragon.hp > 0
    ) {
      heads.add("lion");
      heads.add("dragon");
    }
    return heads.size;
  }

  function buildEnemyPlan(dice) {
    const counts = dice.reduce((map, value) => {
      map[value] = (map[value] ?? 0) + 1;
      return map;
    }, {});
    const headsAlive =
      state.chimera.heads.lion.hp > 0 && state.chimera.heads.dragon.hp > 0;
    const comboCount = headsAlive
      ? Math.min(counts[2] ?? 0, counts[9] ?? 0)
      : 0;
    let remainingTwos = comboCount;
    let remainingNines = comboCount;
    let insertedCombo = 0;
    const plan = [];
    dice.forEach((value, index) => {
      if ((value === 2 && remainingTwos > 0) || (value === 9 && remainingNines > 0)) {
        if (value === 2) remainingTwos -= 1;
        if (value === 9) remainingNines -= 1;
        if (insertedCombo < comboCount && (remainingTwos === 0 || remainingNines === 0 || index === dice.length - 1)) {
          insertedCombo += 1;
          plan.push({
            ...EARTH_THROW,
            actionId: `${EARTH_THROW.id}-${insertedCombo}`,
            values: [2, 9],
            triggeredHeads: ["lion", "dragon"],
            status: "pending",
          });
        }
        return;
      }
      const action = ACTIONS[value];
      const sourceAlive =
        value === 12 ||
        action.head === "body" ||
        state.chimera.heads[action.head].hp > 0;
      plan.push({
        ...action,
        actionId: `action-${index}-${value}`,
        value,
        values: [value],
        status: sourceAlive ? "pending" : "void",
      });
    });
    while (insertedCombo < comboCount) {
      insertedCombo += 1;
      plan.push({
        ...EARTH_THROW,
        actionId: `${EARTH_THROW.id}-${insertedCombo}`,
        values: [2, 9],
        triggeredHeads: ["lion", "dragon"],
        status: "pending",
      });
    }
    return plan;
  }

  async function resolveRound() {
    const token = ++resolutionToken;
    state.phase = "resolving";
    fastResolution = false;
    settlementStep = 0;
    els.skipButton.hidden = true;
    setSpotlight(
      "本轮结算",
      "按规则顺序逐项执行",
      "玩家技能 → 敌人非攻击 → 玩家攻击 → 敌人攻击",
    );
    render();
    await wait(260);
    if (token !== resolutionToken) return;

    await resolvePlayerCards("skill", token);
    if (token !== resolutionToken || checkBattleEnd()) return;

    await resolveEnemySupport(token);
    if (token !== resolutionToken || checkBattleEnd()) return;

    await resolvePlayerCards("attack", token);
    if (token !== resolutionToken || checkBattleEnd()) return;

    await resolveEnemyAttacks(token);
    if (token !== resolutionToken || checkBattleEnd()) return;

    state.allHeadsTriggered = didAllHeadsAct();
    if (state.allHeadsTriggered) {
      state.chimera.disadvantagePending = true;
    }
    await resolveRoundEnd(token);
  }

  async function resolvePlayerCards(resolution, token) {
    const cards = state.staged.filter(
      (item) => item.card.resolution === resolution && !item.card.immediate,
    );
    for (const staged of cards) {
      if (token !== resolutionToken) return;
      const card = staged.card;
      state.settlementLogs = [];
      setSpotlight(
        "玩家卡牌",
        `「${card.name}」`,
        resolution === "skill"
          ? "技能牌先于奇美拉的非攻击行动结算。"
          : "攻击牌在敌方非攻击行动之后结算。",
      );
      addFeed(`玩家：${card.name}`, true);
      render();
      await wait(310);
      if (token !== resolutionToken) return;

      if (
        state.player.statuses.paralysis > 0 &&
        rollDie(2) === 1
      ) {
        addLog(`麻痹发作：「${card.name}」失效。`, "danger");
        setSpotlight("麻痹", `「${card.name}」失效`, "50% 判定未通过，本张卡不产生任何效果。");
        playSound("status");
        render();
        await wait(420);
        await presentSettlementStep();
        if (token !== resolutionToken || checkBattleEnd()) return;
        continue;
      }

      await resolveCard(staged, token);
      render();
      await wait(320);
      await presentSettlementStep();
      if (token !== resolutionToken || checkBattleEnd()) return;
    }
  }

  function successfulPlayerAttack(cardName) {
    if (state.chimera.flightWards <= 0) return false;
    state.chimera.flightWards -= 1;
    addLog(`飞行格挡抵消了「${cardName}」。`, "good");
    setSpotlight(
      "飞行格挡",
      `${cardName} 被挡下`,
      `振翅剩余 ${state.chimera.flightWards} 次格挡。`,
    );
    floatingText(".chimera-hero", "格挡", "good");
    impact(".chimera-hero", "shield");
    playSound("block");
    return true;
  }

  async function resolveCard(staged, token) {
    const card = staged.card;
    const targetId =
      card.target === "single"
        ? state.chimera.taunt && state.chimera.heads.goat.hp > 0
          ? "goat"
          : staged.target ?? selectedHeadId()
        : null;
    const target = targetId ? state.chimera.heads[targetId] : null;

    switch (card.effect) {
      case "shield":
        state.player.shield += card.shield;
        addLog(`获得 ${card.shield} 点临时防御。`, "good");
        playSound("guard");
        break;
      case "dodge":
        state.player.dodge = Math.max(state.player.dodge, card.dodge);
        addLog(`本回合闪避 ${state.player.dodge}%。`, "good");
        playSound("dodge");
        break;
      case "smoke":
        state.player.dodge = Math.max(state.player.dodge, card.dodge);
        state.player.smokeDrawPending = true;
        addLog(`烟幕生效：本回合闪避 ${state.player.dodge}%，成功闪避后抽 1 张。`, "good");
        playSound("smoke");
        break;
      case "feint":
        state.player.nextAttackBonus += 2;
        {
          const drawn = drawCard(1);
          addLog(
            `佯攻抽 ${drawn} 张牌；下一张攻击牌伤害 +2。`,
            "good",
          );
        }
        break;
      case "discard_hand_dodge": {
        const discarded = state.hand.length;
        state.discard.push(...state.hand);
        state.hand = [];
        state.player.dodge = Math.max(state.player.dodge, card.dodge);
        addLog(`弃置 ${discarded} 张手牌，本回合闪避 ${card.dodge}%。`, "good");
        break;
      }
      case "halve_damage":
        state.player.halveDamage = true;
        addLog("本回合受到的伤害减半。", "good");
        break;
      case "scout":
        state.player.damageBonus += 1;
        addLog(`本场伤害 +1，现为 +${state.player.damageBonus}。`, "good");
        break;
      case "ultimate_weakness": {
        const burned = state.hand.length;
        state.exhaust.push(...state.hand);
        state.hand = [];
        state.player.damageBonus += burned;
        addLog(`烧毁 ${burned} 张手牌，本场伤害 +${burned}。`, "good");
        break;
      }
      case "armor":
        state.player.hp = Math.max(0, state.player.hp - card.selfDamage);
        state.totalDamageTaken += card.selfDamage;
        state.player.armor += card.armor;
        floatingText(".player-panel", `-${card.selfDamage}`, "danger");
        addLog(`损失 ${card.selfDamage} 点生命，护甲永久 +${card.armor}。`, "danger");
        playSound("armor");
        break;
      case "poison_all":
        Object.keys(HEADS).forEach((headId) => {
          if (state.chimera.heads[headId].hp > 0) {
            addPoison(headId, card.poison);
          }
        });
        break;
      case "poison":
        if (target?.hp > 0) addPoison(targetId, card.poison);
        break;
      case "taste_venom": {
        if (!target) break;
        const stacks = target.poison;
        target.poison = 0;
        target.poisonActiveRound = null;
        const heal = stacks * 3;
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
        floatingText(".player-panel", `+${heal}`, "good");
        showDamageEffect(".player-panel", "heal");
        playSound("status");
        addLog(`移除${HEADS[targetId].name} ${stacks} 层中毒，回复 ${heal} 点生命。`, "good");
        break;
      }
      case "reduce_dice":
        setSpotlight(
          "龙之威仪",
          "奇美拉少投 1 枚行动骰",
          "该效果已在打出时立即生效。",
        );
        break;
      case "execute":
        if (successfulPlayerAttack(card.name)) break;
        if (target?.hp > 0 && target.hp <= 8) {
          playSound("execute");
          damageHead(targetId, target.hp, "execute", card.name, true);
          addLog(`处决条件满足，${HEADS[targetId].name}被击杀。`, "good");
        } else {
          addLog("处决未生效：所选头部生命高于 8。");
          playSound("status");
        }
        break;
      case "venom_burst":
        if (!target || target.hp <= 0) break;
        if (successfulPlayerAttack(card.name)) break;
        {
          const bonus = state.player.nextAttackBonus;
          state.player.nextAttackBonus = 0;
        attackHead(
          targetId,
          target.poison * 3,
          "poison",
          card.name,
          bonus,
        );
        }
        break;
      case "venom_spray": {
        if (!target || target.hp <= 0) break;
        if (successfulPlayerAttack(card.name)) break;
        const bonus = state.player.nextAttackBonus;
        state.player.nextAttackBonus = 0;
        const result = attackHead(
          targetId,
          card.damage,
          card.damageType,
          card.name,
          bonus,
        );
        if (result.final >= 0) {
          Object.keys(HEADS).forEach((headId) => {
            if (headId !== targetId && state.chimera.heads[headId].hp > 0) {
              addPoison(headId, 1);
            }
          });
        }
        break;
      }
      case "attack": {
        if (successfulPlayerAttack(card.name)) break;
        if (card.id === "flying_knife") playSound("knife");
        const bonus = state.player.nextAttackBonus;
        state.player.nextAttackBonus = 0;
        const targets =
          card.target === "all"
            ? livingHeads()
            : target?.hp > 0
              ? [targetId]
              : [];
        for (const headId of targets) {
          for (let hit = 0; hit < (card.hits ?? 1); hit += 1) {
            if (state.chimera.heads[headId].hp <= 0) break;
            const result = attackHead(
              headId,
              card.damage,
              card.damageType,
              card.hits > 1 ? `${card.name} · 第 ${hit + 1} 击` : card.name,
              bonus,
            );
            if (card.poison > 0 && state.chimera.heads[headId].hp > 0) {
              addPoison(headId, card.poison);
            }
            render();
            if (result.final > 0 && (card.hits ?? 1) > 1) await wait(150);
          }
        }
        break;
      }
      default:
        break;
    }
  }

  function addPoison(headId, amount) {
    const head = state.chimera.heads[headId];
    if (head.poison === 0) {
      head.poison = Math.max(0, amount);
      head.poisonActiveRound = state.round + 1;
      addLog(
        `${HEADS[headId].name}获得中毒 ${head.poison} 层，下回合开始发作。`,
        "good",
      );
    } else {
      head.poison += amount;
      addLog(`${HEADS[headId].name}中毒增至 ${head.poison} 层。`, "good");
    }
    playSound("status");
  }

  function modifierIsNegative(modifier) {
    return typeof modifier === "number" && modifier < 0;
  }

  function drawAttackModifier(forceNegative = false) {
    if (forceNegative) {
      return NEGATIVE_MODIFIERS[Math.floor(Math.random() * NEGATIVE_MODIFIERS.length)];
    }
    return ATTACK_MODIFIERS[Math.floor(Math.random() * ATTACK_MODIFIERS.length)];
  }

  function modifierLabel(modifier) {
    if (modifier === "×") return "×";
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  function attackHead(headId, baseDamage, type, source, cardBonus = 0) {
    const head = state.chimera.heads[headId];
    if (!head || head.hp <= 0) return { final: 0, modifier: 0 };
    const modifier = drawAttackModifier(
      state.player.statuses.disadvantage > 0,
    );
    const raw =
      modifier === "×"
        ? 0
        : Math.max(
            0,
            baseDamage + modifier + state.player.damageBonus + cardBonus,
          );
    setSpotlight(
      `伤害结算 · ${HEADS[headId].name}`,
      source,
      `${baseDamage} ${modifierLabel(modifier)}${
        state.player.damageBonus
          ? ` +${state.player.damageBonus} 本场加成`
          : ""
      }${cardBonus ? ` +${cardBonus} 佯攻` : ""} = ${raw} 点${damageTypeLabel(type)}伤害`,
    );
    addFeed(
      `${source} → ${HEADS[headId].name}：${baseDamage} ${modifierLabel(modifier)}${state.player.damageBonus ? ` +${state.player.damageBonus}` : ""} = ${raw}`,
      true,
    );
    addLog(
      `${source}攻击${HEADS[headId].name}：${baseDamage} ${modifierLabel(modifier)}${state.player.damageBonus ? ` +${state.player.damageBonus}` : ""}${cardBonus ? ` +${cardBonus} 佯攻加成` : ""}，最终 ${raw} 点${damageTypeLabel(type)}伤害。`,
      "good",
    );
    if (raw <= 0) {
      floatingText(".chimera-hero", "0", "good");
      return { final: 0, modifier };
    }
    return damageHead(headId, raw, type, source, false);
  }

  function damageHead(headId, amount, type, source, bypassMotion = false) {
    const head = state.chimera.heads[headId];
    const wasAlive = head.hp > 0;
    const final = Math.min(head.hp, Math.max(0, amount));
    head.hp -= final;
    state.totalDamageDealt += final;
    if (!bypassMotion) {
      shake("enemy-impact", 280);
      els.enemyHitFlash.classList.remove("active");
      void els.enemyHitFlash.offsetWidth;
      els.enemyHitFlash.classList.add("active");
      impact(".chimera-hero");
      floatingText(".chimera-hero", `-${final}`, "good");
      showDamageEffect(
        ".chimera-hero",
        {
          poison: "poison",
          fire: "fire",
          force: "force",
          slashing: "slashing",
          piercing: "piercing",
        }[type] ?? "piercing",
      );
      playSound(
        {
          poison: "poison",
          fire: "fire",
          force: "earth",
          slashing: "slash",
          piercing: "stab",
        }[type] ?? "hit",
      );
    }
    addLog(`${source}对${HEADS[headId].name}造成 ${final} 点${damageTypeLabel(type)}伤害。`, "good");
    if (wasAlive && head.hp === 0) {
      addLog(`${HEADS[headId].name}生命归零，其对应骰面作废。`, "danger");
      addFeed(`${HEADS[headId].name}死亡，骰面作废`);
      queueHeadDeath(headId);
    }
    return { final, modifier: null, killed: head.hp === 0 };
  }

  async function resolveEnemySupport(token) {
    const supportActions = state.plan.filter(
      (action) => action.phase === "support",
    );
    for (const action of supportActions) {
      if (token !== resolutionToken) return;
      state.settlementLogs = [];
      if (action.status === "void" || headDead(action.head)) {
        markAction(action, "voided");
        addFeed(`${dieLabel(action.value)} ${action.name}：头部已死亡，作废`);
        addLog(`${action.name}因对应头部死亡而作废。`);
        setSpotlight(
          `${HEADS[action.head]?.name ?? "身体"} · ${dieLabel(action.value)}`,
          `${action.name}作废`,
          "对应头部已经死亡，本次技能不会产生效果。",
        );
        render();
        await presentSettlementStep();
        if (token !== resolutionToken) return;
        continue;
      }
      markAction(action, "active");
      setSpotlight(
        `${HEADS[action.head]?.name ?? "身体"} · ${dieLabel(action.value)}`,
        action.name,
        action.detail,
      );
      addFeed(`${dieLabel(action.value)} → ${action.name}`, true);
      playEnemyRoar(action);
      render();
      await wait(430);
      if (token !== resolutionToken) return;
      switch (Number(action.value)) {
        case 3:
          if (state.player.meleePlayed) {
            state.player.pending.prone = true;
            addLog("气吼功命中：下回合需要消耗 2 点行动力站起。", "danger");
            playSound("dragonRoar");
          } else {
            addLog("气吼功未命中：本回合没有使用近战攻击牌。");
          }
          break;
        case 5: {
          const status = ["disadvantage", "sleep", "bleed", "slow", "paralysis"][
            Math.floor(Math.random() * 5)
          ];
          applyPendingStatus(status, 1);
          playSound(
            status === "sleep"
              ? "sleep"
              : status === "paralysis"
                ? "paralysis"
                : status === "bleed"
                  ? "bleed"
                  : "status",
          );
          break;
        }
        case 6:
          addLog("法术反射扫过战场：尼克洛姆没有法术牌，无事发生。");
          playSound("spell");
          break;
        case 7:
          state.chimera.taunt = true;
          applyDamagePlayer(2, "psychic", "恶毒嘲笑", { statusDamage: true });
          addLog("羊头获得嘲讽：本回合单体攻击只能选择羊头。", "danger");
          break;
        case 9:
          state.chimera.flightWards += 1;
          addLog(
            `振翅生效：获得 ${state.chimera.flightWards} 次飞行格挡。`,
            "good",
          );
          playSound("wing");
          break;
        case 11:
          addLog("争吵：无事发生。");
          break;
        default:
          break;
      }
      playSound("status");
      render();
      await wait(330);
      markAction(action, "resolved");
      render();
      await presentSettlementStep();
      if (token !== resolutionToken || checkBattleEnd()) return;
    }
  }

  function applyPendingStatus(type, amount) {
    const pending = state.player.pending;
    const labels = {
      disadvantage: "劣势",
      sleep: "睡眠",
      bleed: "流血",
      slow: "缓慢",
      paralysis: "麻痹",
    };
    if (["sleep", "disadvantage", "paralysis"].includes(type)) {
      pending[type] = 1;
    } else {
      pending[type] += amount;
    }
    addLog(`降咒施加【${labels[type]}】，将于下回合生效。`, "danger");
    addFeed(`降咒：下回合【${labels[type]}】`);
  }

  async function resolvePlayerAttackCards(token) {
    await resolvePlayerCards("attack", token);
  }

  async function resolveEnemyAttacks(token) {
    const attacks = state.plan.filter((action) => action.phase === "attack");
    for (const action of attacks) {
      if (token !== resolutionToken) return;
      state.settlementLogs = [];
      if (
        (action.special &&
          (state.chimera.heads.lion.hp <= 0 ||
            state.chimera.heads.dragon.hp <= 0)) ||
        (!action.special && headDead(action.head))
      ) {
        markAction(action, "voided");
        addFeed(`${action.name}：所需头部已死亡，作废`);
        addLog(`${action.name}因头部死亡而作废。`);
        setSpotlight(
          "敌方行动作废",
          action.name,
          action.special
            ? "龙头或狮头已经死亡，地球上投无法发动。"
            : `${HEADS[action.head]?.name ?? "施法者"}已经死亡，本次行动不会结算。`,
        );
        render();
        await presentSettlementStep();
        if (token !== resolutionToken) return;
        continue;
      }

      markAction(action, "active");
      setSpotlight(
        action.special ? "2 + 9 · 组合行动" : `${HEADS[action.head].name} · ${dieLabel(action.value)}`,
        action.name,
        action.detail,
      );
      addFeed(`${dieLabel(action.value)} → ${action.name}`, true);
      render();
      await wait(450);
      if (token !== resolutionToken) return;

      switch (action.special ? "earth" : Number(action.value)) {
        case 1:
          enemyAttackPlayer(6, "piercing", "啃咬");
          break;
        case 2:
          enemyAttackPlayer(3, "slashing", "爪击 · 第一次");
          await wait(270);
          if (token !== resolutionToken) return;
          if (state.player.hp > 0) {
            enemyAttackPlayer(3, "slashing", "爪击 · 第二次");
          }
          break;
        case 4:
          enemyAttackPlayer(5, "bludgeoning", "角撞");
          break;
        case 8:
          enemyAttackPlayer(3, "bludgeoning", "尾击");
          break;
        case 10:
          enemyAttackPlayer(15, "fire", "火焰吐息");
          break;
        case "earth":
          enemyAttackPlayer(17, "force", "地球上投");
          break;
        default:
          break;
      }
      render();
      await wait(420);
      markAction(action, "resolved");
      render();
      await presentSettlementStep();
      if (token !== resolutionToken) return;
      if (checkBattleEnd()) return;
    }
  }

  function headDead(headId) {
    return headId !== "body" && state.chimera.heads[headId]?.hp <= 0;
  }

  function playEnemyRoar(action) {
    if (action.special) {
      playSound("dragonRoar");
      return;
    }
    if (action.head === "dragon") playSound("dragonRoar");
    if (action.head === "lion") playSound("lionRoar");
    if (action.head === "goat") playSound("goatRoar");
  }

  function enemyAttackPlayer(baseDamage, type, source) {
    const modifier = drawAttackModifier(state.chimera.disadvantage);
    const raw =
      modifier === "×" ? 0 : Math.max(0, baseDamage + modifier);
    setSpotlight(
      "敌方伤害结算",
      source,
      `${baseDamage} ${modifierLabel(modifier)} = ${raw} 点${
        state.chimera.disadvantage ? " · 劣势修正" : ""
      }`,
    );
    addFeed(
      `${source}：${baseDamage} ${modifierLabel(modifier)} = ${raw}`,
      true,
    );
    addLog(
      `${source}攻击：基础 ${baseDamage}，修正 ${modifierLabel(modifier)}，进入伤害结算时 ${raw} 点。`,
      "danger",
    );
    if (raw > 0) {
      playSound(
        source.includes("火")
          ? "fire"
          : source.includes("地球")
            ? "earth"
            : type === "slashing" || type === "piercing"
              ? "slash"
              : "hit",
      );
      applyDamagePlayer(raw, type, source);
    }
  }

  function applyDamagePlayer(amount, type, source, options = {}) {
    let damage = Math.max(0, Math.round(amount));
    if (damage <= 0) return 0;

    if (
      !options.statusDamage &&
      state.player.dodge > 0 &&
      rollDie(100) <= state.player.dodge
    ) {
      addFeed("闪避成功：伤害归零", true);
      addLog(`闪避成功，「${source}」没有造成伤害。`, "good");
      floatingText(".player-panel", "闪避", "good");
      playSound("dodge");
      if (state.player.smokeDrawPending) {
        state.player.smokeDrawPending = false;
        const drawn = drawCard(1);
        addLog(`烟幕闪避触发，抽取 ${drawn} 张牌。`, "good");
      }
      return 0;
    }

    if (!options.statusDamage && state.player.halveDamage) {
      damage = Math.ceil(damage / 2);
    }

    if (!options.statusDamage && state.player.armor > 0) {
      const reduction = Math.min(state.player.armor, damage);
      damage -= reduction;
      if (reduction > 0) addFeed(`护甲抵挡 ${reduction}`);
    }

    if (!options.statusDamage && state.player.shield > 0) {
      const absorbed = Math.min(state.player.shield, damage);
      state.player.shield -= absorbed;
      damage -= absorbed;
      if (absorbed > 0) addFeed(`临时防御吸收 ${absorbed}`);
    }

    if (damage > 0) {
      state.player.hp = Math.max(0, state.player.hp - damage);
      state.totalDamageTaken += damage;
      if (state.player.statuses.sleep > 0) {
        state.player.statuses.sleep = 0;
        addLog("受到伤害，睡眠解除。", "good");
      }
      shake("player-impact", 300);
      impact(".player-panel");
      floatingText(".player-panel", `-${damage}`, "danger");
      showDamageEffect(
        ".player-panel",
        {
          fire: "fire",
          force: "force",
          piercing: "piercing",
          slashing: "slashing",
          bleed: "slashing",
        }[type] ?? "piercing",
      );
      playSound(
        {
          fire: "fire",
          force: "earth",
          slashing: "slash",
          piercing: "stab",
          bleed: "bleed",
        }[type] ?? "hurt",
      );
      addLog(`尼克洛姆受到 ${damage} 点${damageTypeLabel(type)}伤害。`, "danger");
    } else {
      addLog(`「${source}」的伤害被防御完全抵消。`, "good");
      playSound("guard");
    }
    render();
    return damage;
  }

  function damageTypeLabel(type) {
    return {
      piercing: "穿刺物理",
      slashing: "挥砍物理",
      bludgeoning: "钝击物理",
      fire: "火焰",
      force: "重力",
      poison: "毒素",
      psychic: "心灵",
    }[type] ?? type;
  }

  async function resolveRoundEnd(token) {
    state.settlementLogs = [];
    setSpotlight(
      "回合结束",
      "持续伤害与状态结算",
      "先结算中毒和流血，再移除本回合状态并启用下回合状态。",
    );
    render();
    await wait(350);
    if (token !== resolutionToken) return;

    if (state.player.statuses.bleed > 0) {
      const bleed = state.player.statuses.bleed;
      applyDamagePlayer(bleed, "bleed", "流血", { statusDamage: true });
      state.player.statuses.bleed -= 1;
    }

    Object.keys(HEADS).forEach((headId) => {
      const head = state.chimera.heads[headId];
      if (
        head.hp > 0 &&
        head.poison > 0 &&
        head.poisonActiveRound !== null &&
        head.poisonActiveRound <= state.round
      ) {
        const poisonDamage = head.poison * 2;
        head.hp = Math.max(0, head.hp - poisonDamage);
        state.totalDamageDealt += Math.min(poisonDamage, head.hp + poisonDamage);
        floatingText(".chimera-hero", `毒 -${poisonDamage}`, "good");
        showDamageEffect(".chimera-hero", "poison");
        addFeed(`${HEADS[headId].name}中毒：${head.poison} × 2 = ${poisonDamage}`);
        addLog(`${HEADS[headId].name}中毒发作，受到 ${poisonDamage} 点毒素伤害。`, "good");
        if (head.hp === 0) {
          addLog(`${HEADS[headId].name}因中毒死亡，对应骰面作废。`, "danger");
          queueHeadDeath(headId);
        }
      }
    });
    playSound("status");
    render();
    await wait(400);
    await presentSettlementStep();
    if (token !== resolutionToken) return;
    if (checkBattleEnd()) return;

    if (state.player.statuses.slow > 0) state.player.statuses.slow -= 1;
    state.player.statuses.paralysis = 0;
    state.player.statuses.disadvantage = 0;
    state.chimera.disadvantage = false;
    state.chimera.taunt = false;
    state.chimera.flightWards = 0;
    state.player.shield = 0;
    state.player.dodge = 0;
    state.player.halveDamage = false;
    state.player.nextAttackBonus = 0;
    state.player.smokeDrawPending = false;

    const pending = state.player.pending;
    if (pending.sleep > 0) state.player.statuses.sleep = 1;
    if (pending.disadvantage > 0) state.player.statuses.disadvantage = 1;
    if (pending.paralysis > 0) state.player.statuses.paralysis = 1;
    if (pending.bleed > 0) state.player.statuses.bleed += pending.bleed;
    if (pending.slow > 0) state.player.statuses.slow += pending.slow;
    if (pending.prone) state.player.statuses.prone = true;
    state.player.pending = emptyStatuses();

    if (state.chimera.disadvantagePending) {
      state.chimera.disadvantage = true;
      state.chimera.disadvantagePending = false;
      addLog("三个头都发动了技能：奇美拉下回合获得劣势。", "good");
    }

    state.settlementLogs = [];
    const activeStatusNames = [];
    if (state.player.statuses.prone) activeStatusNames.push("倒地");
    if (state.player.statuses.sleep > 0) activeStatusNames.push("睡眠");
    if (state.player.statuses.disadvantage > 0) activeStatusNames.push("劣势");
    if (state.player.statuses.slow > 0) activeStatusNames.push(`缓慢 ${state.player.statuses.slow}`);
    if (state.player.statuses.paralysis > 0) activeStatusNames.push("麻痹");
    if (state.player.statuses.bleed > 0) activeStatusNames.push(`流血 ${state.player.statuses.bleed}`);
    addLog(
      activeStatusNames.length
        ? `下回合生效状态：${activeStatusNames.join("、")}`
        : "下回合没有新的控制状态。",
      "good",
    );
    setSpotlight(
      "状态更新",
      "下回合生效",
      activeStatusNames.length
        ? `尼克洛姆将带有：${activeStatusNames.join("、")}`
        : "没有新的控制状态；奇美拉状态与临时防御已经重置。",
    );
    render();
    await presentSettlementStep();
    if (token !== resolutionToken) return;

    let exhaustedCards = 0;
    let discardedCards = 0;
    state.staged.forEach((staged) => {
      if (staged.card.consume) {
        state.exhaust.push(staged.card);
        exhaustedCards += 1;
      } else {
        state.discard.push(staged.card);
        discardedCards += 1;
      }
    });
    if (exhaustedCards > 0) playSound("exhaust");
    if (discardedCards > 0 && exhaustedCards === 0) playSound("discard");

    state.diceReduction = 0;
    state.round += 1;
    state.plan = [];
    state.feed = [];
    state.dice = [];
    state.activeRollCounts = {};
    state.rollHistory = [];
    state.rerollCount = 0;
    state.ap = PLAYER_AP;
    state.staged = [];
    els.skipButton.hidden = true;
    fastResolution = false;
    beginPlayerTurn();
  }

  function beginPlayerTurn() {
    if (state.phase === "won" || state.phase === "lost") return;

    if (state.player.statuses.sleep > 0) {
      playSound("sleep");
      const result = rollDie(6);
      if (result % 2 === 1) {
        state.player.statuses.sleep = 0;
        addLog(`睡眠判定 ${result}：单数，睡眠解除。`, "good");
      } else {
        state.phase = "sleep";
        state.ap = 0;
        setSpotlight(
          "睡眠",
          `D6 = ${result}`,
          "偶数判定失败，跳过本次玩家阶段。",
        );
        addLog(`睡眠判定 ${result}：跳过玩家阶段。`, "danger");
        render();
        actionTimer = window.setTimeout(beginEnemyPhase, 900);
        return;
      }
    }

    state.phase = "player";
    state.ap = PLAYER_AP;
    const drawn = drawCard(2);
    addLog(`第 ${state.round} 轮：获得 3 点行动力，抽取 ${drawn} 张牌。`);
    setSpotlight(
      "完整信息",
      "奇美拉行动表已公开",
      state.player.statuses.prone
        ? "你正处于倒地状态：消耗 2 点行动力站起后才能使用卡牌。"
        : "指定一个头部，布置卡牌；结束阶段后才会掷骰。",
    );
    render();
    animateHand();
  }

  function animateHand() {
    clearTimeout(handTimer);
    els.cardTrack.classList.remove("dealing");
    void els.cardTrack.offsetWidth;
    els.cardTrack.classList.add("dealing");
    handTimer = window.setTimeout(
      () => els.cardTrack.classList.remove("dealing"),
      620,
    );
  }

  function endPlayerTurn() {
    if (state.phase !== "player") return;
    if (state.player.statuses.prone) {
      showToast("倒地状态下必须先用 2 点行动力站起。");
      return;
    }
    state.phase = "enemy";
    state.feed = [];
    state.player.meleePlayed = state.staged.some((item) => item.card.melee);
    const played = [...state.staged];
    played.forEach((staged) => {
      state.hand = state.hand.filter(
        (card) => card.instanceId !== staged.card.instanceId,
      );
    });
    setSpotlight(
      "行动锁定",
      played.length ? `${played.length} 张卡牌等待结算` : "保留手牌并结束阶段",
      "行动骰落定后，将按“玩家技能 → 敌方非攻击 → 玩家攻击 → 敌方攻击”执行。",
    );
    render();
    playSound("play");
    actionTimer = window.setTimeout(beginEnemyPhase, reducedMotion.matches ? 30 : 370);
  }

  function checkBattleEnd() {
    if (state.player.hp <= 0) {
      finishBattle(false);
      return true;
    }
    if (allHeadsDead()) {
      finishBattle(true);
      return true;
    }
    return false;
  }

  function finishBattle(won) {
    if (state.phase === "won" || state.phase === "lost") return;
    cancelPlayback();
    state.phase = won ? "won" : "lost";
    state.ap = 0;
    addLog(
      won ? "战斗胜利：奇美拉三颗头全部死亡。" : "战斗失败：尼克洛姆生命归零。",
      won ? "good" : "danger",
    );
    setSpotlight(
      won ? "遭遇完成" : "遭遇中止",
      won ? "奇美拉倒下" : "刺客失去战斗能力",
      won ? "三颗头颅均已死亡，斗兽场恢复寂静。" : "重新开始并调整目标与防御顺序。",
    );
    render();
    playSound(won ? "win" : "lose");
    els.resultKicker.textContent = won ? "遭遇完成" : "遭遇中止";
    els.resultTitle.textContent = won ? "奇美拉倒下" : "斗兽场吞没退路";
    els.resultCopy.textContent = won
      ? "你依次击破了龙、狮、羊三颗头。重新开战可以尝试不同的头部顺序与防守时机。"
      : "奇美拉仍在场上。重新开始，优先处理持续伤害并利用头部状态。";
    els.resultStats.replaceChildren(
      makeResultStat("轮数", state.round),
      makeResultStat("造成伤害", state.totalDamageDealt),
      makeResultStat("承受伤害", state.totalDamageTaken),
    );
    window.setTimeout(() => {
      if (!els.resultDialog.open) els.resultDialog.showModal();
    }, reducedMotion.matches ? 60 : 520);
  }

  function makeResultStat(label, value) {
    const wrapper = document.createElement("div");
    const caption = document.createElement("span");
    const output = document.createElement("strong");
    caption.textContent = label;
    output.textContent = String(value);
    wrapper.append(caption, output);
    return wrapper;
  }

  function renderCard(card) {
    const selected = state.staged.some(
      (staged) => staged.card.instanceId === card.instanceId,
    );
    const cost = cardCost(card);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `game-card${selected ? " selected" : ""}`;
    button.dataset.instanceId = card.instanceId;
    button.dataset.category = card.category;
    button.title = card.copy;
    button.disabled =
      state.phase !== "player" ||
      state.player.statuses.prone ||
      (!selected && state.ap < cost);
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute(
      "aria-label",
      `${card.name}，消耗 ${cost} 点行动力。${card.copy}`,
    );

    const topline = document.createElement("div");
    topline.className = "card-topline";
    const category = document.createElement("span");
    category.textContent = card.category;
    const costNode = document.createElement("span");
    costNode.className = "card-cost";
    costNode.textContent = String(cost);
    topline.append(category, costNode);

    const title = document.createElement("h3");
    title.textContent = card.name;
    const copy = document.createElement("p");
    copy.className = "card-copy";
    copy.textContent = card.copy;
    const keywords = document.createElement("div");
    keywords.className = "card-keywords";
    card.tags.forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "keyword";
      chip.textContent = tag;
      keywords.append(chip);
    });
    if (selected) {
      const marker = document.createElement("span");
      marker.className = "card-status";
      marker.textContent = "已布置";
      keywords.append(marker);
    }
    button.append(topline, title, copy, keywords);
    button.addEventListener("click", () => selectCard(card.instanceId));
    return button;
  }

  function renderHeadTargets() {
    els.headTargets.replaceChildren(
      ...Object.entries(HEADS).map(([headId, head]) => {
        const hp = state.chimera.heads[headId];
        const effectiveTarget =
          state.chimera.taunt && state.chimera.heads.goat.hp > 0
            ? "goat"
            : state.selectedTarget;
        const button = document.createElement("button");
        button.type = "button";
        button.className = `head-target${effectiveTarget === headId ? " selected" : ""}${hp.hp <= 0 ? " dead" : ""}`;
        button.dataset.head = headId;
        button.disabled = hp.hp <= 0 || state.phase !== "player";
        button.setAttribute(
          "aria-label",
          `${head.name}，生命 ${hp.hp} / ${hp.maxHp}，中毒 ${hp.poison} 层`,
        );
        button.innerHTML = `
          <span class="head-mark" aria-hidden="true">${head.short}</span>
          <span class="head-copy">
            <strong>${head.name}${hp.poison ? ` · 毒 ${hp.poison}` : ""}</strong>
            <span>${head.note}</span>
          </span>
          <span class="head-hp">${hp.hp}<small> / ${hp.maxHp}</small></span>
          <span class="head-progress"><span style="width:${(hp.hp / hp.maxHp) * 100}%"></span></span>
        `;
        button.addEventListener("click", () => setTarget(headId));
        return button;
      }),
    );
  }

  function createActionGroup(title, subtitle, values) {
    const group = document.createElement("section");
    const heading = document.createElement("div");
    heading.className = "action-group-heading";
    heading.innerHTML = `<strong>${title}</strong><span>${subtitle}</span>`;
    group.append(heading);
    values.forEach((value) => group.append(renderActionRow(value)));
    return group;
  }

  function renderActionRow(value) {
    const action = ACTIONS[value];
    const row = document.createElement("div");
    row.className = "action-row";
    row.dataset.head = action.head;
    row.dataset.action = String(value);
    row.title = `${action.name}：${action.detail}`;
    row.setAttribute("aria-label", `骰面 ${value}，${action.name}：${action.detail}`);
    const count = state.activeRollCounts[value] ?? 0;
    const related = state.plan.filter(
      (entry) => !entry.special && Number(entry.value) === value,
    );
    row.classList.toggle(
      "active",
      related.some((entry) => entry.status === "active"),
    );
    row.classList.toggle(
      "resolved",
      related.length > 0 &&
        related.every(
          (entry) => entry.status === "resolved" || entry.status === "void",
        ),
    );
    row.classList.toggle(
      "voided",
      headDead(action.head) ||
        (related.length > 0 &&
          related.every((entry) => entry.status === "void")),
    );
    const replacedByCombo =
      [2, 9].includes(value) &&
      count === 0 &&
      state.plan.some((entry) => entry.special);
    row.classList.toggle("resolved", replacedByCombo);
    if (replacedByCombo) {
      row.title = `${action.name}：本次已被「地球上投」替换`;
    }
    if (count === 0 && headDead(action.head)) row.title = "对应头部已死亡，此骰面作废";
    row.innerHTML = `
      <span class="action-die" aria-hidden="true">${value}</span>
      <span class="action-copy">
        <strong>${action.name}</strong>
        <span>${action.detail}</span>
      </span>
      <span class="roll-marker${count > 1 ? " multiple" : ""}">${count ? `×${count}` : "—"}</span>
    `;
    return row;
  }

  function renderActions() {
    const groups = [
      createActionGroup("龙头", "3 · 6 · 9 · 10", [3, 6, 9, 10]),
      createActionGroup("狮头", "1 · 2 · 8", [1, 2, 8]),
      createActionGroup("羊头", "4 · 5 · 7 · 11", [4, 5, 7, 11]),
    ];
    const special = document.createElement("section");
    const heading = document.createElement("div");
    heading.className = "action-group-heading";
    heading.innerHTML = "<strong>身体与组合</strong><span>规则补充</span>";
    special.append(heading);
    special.append(renderActionRow(12));
    const earth = document.createElement("div");
    earth.className = "action-row special";
    earth.dataset.head = "body";
    earth.dataset.action = "earth";
    const earthActions = state.plan.filter((action) => action.special);
    const activeEarth = earthActions.some((action) => action.status === "active");
    const triggeredEarth = earthActions.some(
      (action) => action.status !== "resolved" && action.status !== "void",
    );
    const voidEarth = earthActions.length > 0 &&
      earthActions.every((action) => action.status === "void");
    earth.classList.toggle(
      "active",
      earthActions.some((action) => action.status === "active"),
    );
    earth.classList.toggle(
      "resolved",
      earthActions.length > 0 &&
        earthActions.every(
          (action) => action.status === "resolved" || action.status === "void",
        ),
    );
    earth.innerHTML = `
      <span class="action-die" aria-hidden="true">2+9</span>
      <span class="action-copy">
        <strong>${EARTH_THROW.name}</strong>
        <span>${EARTH_THROW.detail}</span>
      </span>
      <span class="roll-marker${triggeredEarth ? " multiple" : ""}">${
        voidEarth
          ? "作废"
          : activeEarth
            ? "执行中"
            : triggeredEarth
              ? "触发"
              : earthActions.length
                ? "完成"
                : "—"
      }</span>
    `;
    special.append(earth);
    groups.push(special);
    els.enemyActionList.replaceChildren(...groups);
  }

  function renderDice(rolling = false) {
    if (!state.dice.length) {
      els.enemyDice.innerHTML =
        '<span class="dice-placeholder">结束玩家阶段后掷出</span>';
      return;
    }
    els.enemyDice.replaceChildren(
      ...state.dice.map((value) => {
        const die = document.createElement("span");
        die.className = `die${rolling ? " rolling" : ""}`;
        die.textContent = String(value);
        if (headDead(ACTIONS[value]?.head)) die.classList.add("void");
        die.setAttribute("aria-label", `${value} 点`);
        return die;
      }),
    );
  }

  function markAction(action, status) {
    action.status = status;
    const rowSelector = action.special
      ? '[data-action="earth"]'
      : `[data-action="${action.value}"]`;
    document.querySelectorAll(rowSelector).forEach((row) => {
      row.classList.remove("active", "resolved", "voided");
      row.classList.add(status);
    });
  }

  function didAllHeadsAct() {
    const actedHeads = new Set();
    state.plan
      .filter((action) => action.status === "resolved")
      .forEach((action) => {
        const heads = action.triggeredHeads ?? [action.head];
        heads
          .filter((headId) => headId !== "body")
          .forEach((headId) => actedHeads.add(headId));
      });
    return actedHeads.size === 3;
  }

  function dieLabel(value) {
    return value === undefined ? "2+9" : `骰面 ${value}`;
  }

  function renderFeed() {
    els.resolutionFeed.replaceChildren(
      ...state.feed.map((item) => {
        const chip = document.createElement("span");
        chip.className = `feed-chip${item.current ? " current" : ""}`;
        chip.textContent = item.text;
        return chip;
      }),
    );
  }

  function renderStatuses() {
    const active = state.player.statuses;
    const pending = state.player.pending;
    const chips = [];
    const add = (label, tone = "") => chips.push([label, tone]);

    if (active.prone) add("倒地：需 2 行动站起", "danger");
    if (active.sleep > 0) add("睡眠", "danger");
    if (active.disadvantage > 0) add("劣势：伤害骰取减值", "danger");
    if (active.slow > 0) add(`缓慢 ${active.slow}：卡费 +${active.slow}`, "danger");
    if (active.paralysis > 0) add("麻痹：卡牌 50% 失效", "danger");
    if (active.bleed > 0) add(`流血 ${active.bleed}`, "danger");
    add("中毒免疫", "muted");

    if (pending.prone) add("待生效：倒地", "danger");
    if (pending.sleep > 0) add("待生效：睡眠", "danger");
    if (pending.disadvantage > 0) add("待生效：劣势", "danger");
    if (pending.slow > 0) add(`待生效：缓慢 ${pending.slow}`, "danger");
    if (pending.paralysis > 0) add("待生效：麻痹", "danger");
    if (pending.bleed > 0) add(`待生效：流血 ${pending.bleed}`, "danger");

    els.playerStatuses.replaceChildren(
      ...chips.map(([label, tone]) => {
        const chip = document.createElement("span");
        chip.className = `status-token ${tone}`.trim();
        chip.textContent = label;
        return chip;
      }),
    );
  }

  function render() {
    els.roundLabel.textContent = `第 ${state.round} 轮`;
    els.phaseLabel.textContent = phaseLabel();
    document.body.dataset.phase = state.phase;

    els.playerHp.textContent = state.player.hp;
    els.playerHpTrack.setAttribute("aria-valuenow", String(state.player.hp));
    els.playerHpBar.style.width = `${(state.player.hp / state.player.maxHp) * 100}%`;
    els.playerArmor.textContent = state.player.armor;
    els.playerShield.textContent = state.player.shield;
    els.playerDodge.textContent = `${state.player.dodge}%`;
    els.enemyTotalHp.textContent = totalEnemyHp();

    els.apValue.textContent = `${state.ap} / ${PLAYER_AP}`;
    const pipCount = Math.max(PLAYER_AP, state.ap);
    if (els.apTrack.children.length !== pipCount) {
      els.apTrack.replaceChildren(
        ...Array.from({ length: pipCount }, () => document.createElement("span")),
      );
    }
    els.apTrack.style.gridTemplateColumns = `repeat(${pipCount}, 1fr)`;
    els.apTrack.setAttribute("aria-valuemax", String(pipCount));
    els.apTrack.setAttribute("aria-valuenow", String(state.ap));
    [...els.apTrack.children].forEach((segment, index) => {
      segment.classList.toggle("available", index < state.ap);
    });
    els.deckCount.textContent = state.deck.length;
    els.discardCount.textContent = state.discard.length;
    els.exhaustCount.textContent = state.exhaust.length;

    els.flightBadge.hidden = state.chimera.flightWards <= 0;
    els.flightValue.textContent = state.chimera.flightWards;
    els.tauntBadge.hidden = !state.chimera.taunt;
    els.disadvantageBadge.hidden = !state.chimera.disadvantage;

    renderHeadTargets();
    renderStatuses();
    renderActions();
    renderDice();
    renderFeed();

    const lives = livingHeads().length;
    els.handInstruction.textContent =
      state.player.statuses.prone
        ? "倒地：先消耗 2 点行动力站起，才能使用卡牌。"
        : state.chimera.taunt
          ? "嘲讽生效：单体攻击只能指定羊头。"
          : "选择手牌布置；单体攻击会作用于当前指定的头部。";

    els.cardTrack.replaceChildren(...state.hand.map(renderCard));
    els.emptyHand.hidden = state.hand.length > 0;
    els.stagedCount.textContent = String(state.staged.length);
    els.stagedCopy.textContent = state.staged.length
      ? state.staged.map((item) => item.card.name).join("、")
      : "尚未选择手牌";

    els.standButton.hidden = !state.player.statuses.prone || state.phase !== "player";
    els.standButton.disabled = state.ap < 2;
    els.endTurnButton.disabled =
      state.phase !== "player" || state.player.statuses.prone;
    els.endTurnButton.textContent =
      state.phase === "enemy"
        ? "等待敌方投骰"
        : state.phase === "resolving"
          ? "正在结算"
          : "结束玩家阶段";
    const hasImmediateStaged = state.staged.some(
      (item) => item.card.immediate,
    );
    els.clearSelectionButton.disabled =
      state.phase !== "player" ||
      state.staged.length === 0 ||
      hasImmediateStaged;
    els.clearSelectionButton.textContent = hasImmediateStaged
      ? "已生效的即时牌不可撤回"
      : state.staged.length
      ? `清空布置（返还 ${state.staged.reduce((sum, item) => sum + item.cost, 0)} AP）`
      : "清空布置";

    els.combatLog.replaceChildren(
      ...state.log.map((entry) => {
        const item = document.createElement("li");
        item.className = entry.tone;
        item.textContent = `第 ${entry.round} 轮 · ${entry.text}`;
        return item;
      }),
    );

    if (lives === 0) {
      els.handInstruction.textContent = "三颗头均已死亡。";
    }
  }

  function renderPileCard(card) {
    const element = document.createElement("article");
    element.className = "pile-card";
    const head = document.createElement("div");
    head.className = "pile-card-head";
    const category = document.createElement("span");
    category.textContent = card.category;
    const cost = document.createElement("strong");
    cost.textContent = String(cardCost(card));
    head.append(category, cost);
    const title = document.createElement("h3");
    title.textContent = card.name;
    const copy = document.createElement("p");
    copy.textContent = card.copy;
    const tags = document.createElement("div");
    tags.className = "pile-card-tags";
    card.tags.forEach((tag) => {
      const item = document.createElement("span");
      item.textContent = tag;
      tags.append(item);
    });
    element.append(head, title, copy, tags);
    return element;
  }

  function openPile(type) {
    const piles = {
      deck: {
        cards: [...state.deck],
        kicker: "按当前抽牌顺序",
        title: "牌库",
        description: "牌库顶在上方。抽牌时会从这里取牌。",
      },
      discard: {
        cards: [...state.discard].reverse(),
        kicker: "最近弃置优先",
        title: "弃牌堆",
        description: "打出后未消耗的卡牌会进入这里；牌库耗尽时洗回抽牌堆。",
      },
      exhaust: {
        cards: [...state.exhaust].reverse(),
        kicker: "本场已移除",
        title: "消耗牌堆",
        description: "带有“消耗”或“烧毁”效果的卡牌进入这里，本场战斗不再回到牌库。",
      },
    };
    const pile = piles[type];
    els.pileKicker.textContent = `${pile.kicker} · ${pile.cards.length} 张`;
    els.pileTitle.textContent = pile.title;
    els.pileDescription.textContent = pile.description;
    els.pileCardGrid.replaceChildren(
      ...(pile.cards.length
        ? pile.cards.map(renderPileCard)
        : [Object.assign(document.createElement("div"), {
            className: "pile-empty",
            textContent: `${pile.title}目前为空。`,
          })]),
    );
    if (!els.pileDialog.open) els.pileDialog.showModal();
  }

  function bindDialog(dialog, openButton, closeButton) {
    openButton?.addEventListener("click", () => {
      if (!dialog.open) dialog.showModal();
    });
    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  function resetGame() {
    cancelPlayback();
    clearTimeout(actionTimer);
    clearTimeout(handTimer);
    state = createInitialState();
    if (els.resultDialog.open) els.resultDialog.close();
    if (els.logDialog.open) els.logDialog.close();
    if (els.cardDialog.open) els.cardDialog.close();
    if (els.pileDialog.open) els.pileDialog.close();
    if (els.resolutionDialog.open) els.resolutionDialog.close();
    activeSettlementResolve = null;
    settlementStep = 0;
    els.skipButton.hidden = true;
    els.rollNote.textContent = "3D12";
    state.feed = [];
    addLog("奇美拉踏入斗兽场。三颗头分别拥有 20 点生命。", "good");
    setSpotlight(
      "第 1 轮",
      "完整行动表已公开",
      "指定一个头部并布置卡牌。结束阶段后才会确定奇美拉的技能。",
    );
    render();
    animateHand();
  }

  async function runSelfTests() {
    const visibleImages = [...document.querySelectorAll(".app-shell img")];
    await Promise.all(
      visibleImages
        .filter((image) => !image.complete)
        .map(
          (image) =>
            new Promise((resolve) => {
              image.addEventListener("load", resolve, { once: true });
              image.addEventListener("error", resolve, { once: true });
            }),
        ),
    );
    await document.fonts.ready;
    const checks = [];
    const check = (name, pass) => checks.push({ name, pass: Boolean(pass) });
    check("玩家生命 38", PLAYER_MAX_HP === 38);
    check("三头生命各 20", Object.values(createInitialState().chimera.heads).every((head) => head.hp === 20));
    check("十二个原始骰面", Object.keys(ACTIONS).length === 12);
    check("龙头映射完整", [3, 6, 9, 10].every((value) => ACTIONS[value].head === "dragon"));
    check("狮头映射完整", [1, 2, 8].every((value) => ACTIONS[value].head === "lion"));
    check("羊头映射完整", [4, 5, 7, 11].every((value) => ACTIONS[value].head === "goat"));
    const comboPlan = buildEnemyPlan([2, 9, 7]);
    check(
      "2+9 被地球上投替换",
      comboPlan.some((action) => action.special) &&
        !comboPlan.some(
          (action) => !action.special && [2, 9].includes(Number(action.value)),
        ),
    );
    check(
      "范围攻击同时指定三头",
      CARD_DEFS.find((card) => card.id === "flying_knife")?.target === "all",
    );
    check("24 种刺客卡牌", CARD_DEFS.length === 24);
    check("34 张测试牌库", createDeck().length === 34);
    check(
      "重复卡数量正确",
      CARD_DEFS.find((card) => card.id === "strike")?.copies === 4 &&
        CARD_DEFS.find((card) => card.id === "defend")?.copies === 4 &&
        CARD_DEFS.find((card) => card.id === "poison_dagger")?.copies === 3 &&
        CARD_DEFS.find((card) => card.id === "dragon_awe")?.copies === 2 &&
        CARD_DEFS.find((card) => card.id === "dragon_breath")?.copies === 2,
    );
    check(
      "扩展牌已加入",
      ["search", "blood_trade", "multi_stab", "venom_spray", "smoke", "feint"].every(
        (id) => CARD_DEFS.some((card) => card.id === id),
      ),
    );
    check("初始手牌 5 张", createInitialState().hand.length === 5);
    check("偷袭为固有牌", createInitialState().hand.some((card) => card.innate));
    check("完整行动表已渲染", document.querySelectorAll(".action-row").length === 13);
    check("三个头目标按钮", document.querySelectorAll(".head-target").length === 3);
    check(
      "无横向溢出",
      document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    check(
      "音乐与音效入口存在",
      Boolean(els.audioButton && window.AudioContext !== undefined),
    );
    check(
      "三类牌堆可打开",
      Boolean(els.deckButton && els.discardButton && els.exhaustButton && els.pileDialog),
    );
    check(
      "结算需要人工确认",
      Boolean(els.resolutionDialog && els.continueResolutionButton),
    );
    check(
      "战斗图像加载",
      visibleImages.every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    );
    const failures = checks.filter((item) => !item.pass);
    els.selfTestOutput.textContent = JSON.stringify({
      passed: checks.length - failures.length,
      failed: failures.length,
      viewport: [window.innerWidth, window.innerHeight],
      documentWidth: document.documentElement.scrollWidth,
      checks,
    });
    document.body.dataset.selftest = failures.length ? "fail" : "pass";
  }

  function runSmokeTest() {
    let autoContinue = null;
    window.setTimeout(() => {
      state.forcedDice = [1, 3, 10];
      const card = state.hand.find((item) => item.effect === "attack");
      if (card) selectCard(card.instanceId);
      endPlayerTurn();
      autoContinue = window.setInterval(() => {
        if (els.resolutionDialog.open) els.continueResolutionButton.click();
      }, 160);
    }, 50);
    window.setTimeout(() => {
      if (autoContinue) window.clearInterval(autoContinue);
      const result = {
        pass:
          state.log.length >= 4 &&
          ["enemy", "resolving", "player", "won", "lost"].includes(state.phase),
        phase: state.phase,
        round: state.round,
        dice: state.dice,
        plan: state.plan.map((action) => action.name),
        feed: state.feed.map((item) => item.text),
      };
      els.selfTestOutput.textContent = JSON.stringify(result);
      document.body.dataset.smoke = result.pass ? "pass" : "fail";
    }, 7200);
  }

  els.endTurnButton.addEventListener("click", endPlayerTurn);
  els.clearSelectionButton.addEventListener("click", clearSelection);
  els.standButton.addEventListener("click", standUp);
  els.skipButton.addEventListener("click", skipPlayback);
  document.querySelector("#reset-button").addEventListener("click", resetGame);
  document.querySelector("#play-again-button").addEventListener("click", resetGame);
  els.audioButton.addEventListener("click", () => {
    ensureAudio();
    setAudioEnabled(!audio.enabled);
    if (audio.enabled) playSound("select");
  });

  bindDialog(
    els.rulesDialog,
    document.querySelector("#rules-button"),
    document.querySelector("#close-rules-button"),
  );
  bindDialog(
    els.cardDialog,
    document.querySelector("#enemy-card-button"),
    document.querySelector("#close-card-button"),
  );
  bindDialog(
    els.logDialog,
    document.querySelector("#log-button"),
    document.querySelector("#close-log-button"),
  );
  els.deckButton.addEventListener("click", () => {
    playSound("pileDeck");
    openPile("deck");
  });
  els.discardButton.addEventListener("click", () => {
    playSound("pileDiscard");
    openPile("discard");
  });
  els.exhaustButton.addEventListener("click", () => {
    playSound("pileExhaust");
    openPile("exhaust");
  });
  document
    .querySelector("#close-pile-button")
    .addEventListener("click", () => els.pileDialog.close());
  els.pileDialog.addEventListener("click", (event) => {
    if (event.target === els.pileDialog) els.pileDialog.close();
  });
  els.continueResolutionButton.addEventListener("click", continueSettlement);
  els.resolutionDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    els.continueResolutionButton.focus();
  });

  const unlockAudio = () => {
    ensureAudio();
    if (!introRoarPlayed) {
      introRoarPlayed = true;
      window.setTimeout(() => playSound("introRoar"), 120);
    }
  };
  document.addEventListener("pointerdown", unlockAudio, { once: true, capture: true });
  document.addEventListener("keydown", unlockAudio, { once: true, capture: true });
  document.addEventListener("visibilitychange", () => {
    if (!audio.context || !audio.musicGain) return;
    audio.musicGain.gain.setTargetAtTime(
      document.hidden ? 0.0001 : 1.22,
      audio.context.currentTime,
      0.15,
    );
  });
  document.body.dataset.audio = "on";

  resetGame();

  const params = new URLSearchParams(window.location.search);
  if (params.has("selftest")) runSelfTests();
  if (params.has("smoke")) runSmokeTest();

  window.__chimeraDemo = {
    state: () => state,
    resetGame,
    endPlayerTurn,
    selectCard,
    setTarget,
    finishBattle,
    debugAddCard: (id) => {
      const definition = CARD_DEFS.find((card) => card.id === id);
      if (!definition) return null;
      const card = makeInstance(definition);
      state.hand.push(card);
      render();
      return card.instanceId;
    },
    debugDamageHead: (headId, amount, type = "slashing") => {
      damageHead(headId, amount, type, "测试伤害");
    },
    queueDice: (dice) => {
      state.forcedDice = [...dice];
    },
  };
})();
