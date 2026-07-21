/**
 * Passive Gain Calculator Module
 *
 * Calculates wait times for passive resource accumulation,
 * emerald availability for daily pulls, and gacha level-up costs.
 *
 * Module interface: init(container), destroy(), getState(), setState(state)
 */

const REWARD_STORAGE_KEY = 'digimemory-passive-config';
const EMERALD_STORAGE_KEY = 'digimemory-emerald-config';
const GACHA_STORAGE_KEY = 'digimemory-gacha-config';
const TAB_STORAGE_KEY = 'digimemory-passive-tab';

const REWARD_MAX = 999999999;
const EMERALD_MAX = 99999;
const GACHA_PULL_MAX = 9999;
const GACHA_TICKET_MAX = 99999;

// A multi-pull costs 30 tickets and gives 35 pulls.
// Each ticket costs 20 digiesmeraldas.
const GACHA_MULTI_PULL_SIZE = 35;
const GACHA_MULTI_TICKET_COST = 30;
const GACHA_TICKET_EMERALD_COST = 20;

/** @type {HTMLElement|null} */
let containerEl = null;

/** @type {{ floor: number, bits: number, hologramTickets: number, digiEmeralds: number }} */
let rewardConfig = { floor: 0, bits: 0, hologramTickets: 0, digiEmeralds: 0 };

/** @type {{ dailyPullCost: number, pullTime: string }} */
let emeraldConfig = { dailyPullCost: 5700, pullTime: '08:00' };

/** @type {{ cardsDone: number, cardsTarget: number, cardsTickets: number, supportDone: number, supportTarget: number, supportTickets: number, currentEmeralds: number, lastCollectedTs: number|null }} */
let gachaConfig = { cardsDone: 0, cardsTarget: 0, cardsTickets: 0, supportDone: 0, supportTarget: 0, supportTickets: 0, currentEmeralds: 0, lastCollectedTs: null };

/** Maximum passive accumulation time in minutes */
const PASSIVE_MAX_MINUTES = 480; // 8 hours
/** Collection interval in minutes (collect every 7h to have margin) */
const COLLECTION_INTERVAL_MINUTES = 420; // 7 hours

/** @type {string} */
let activeTab = 'wait-time';

/**
 * Tracks last valid values for each input so we can revert on invalid input.
 * @type {Map<string, string>}
 */
const lastValidValues = new Map();

/** @type {AbortController|null} */
let eventController = null;

// ─── Pure Calculation Functions (exported for testing) ───────────────────────

/**
 * Calculates the time needed to accumulate a target amount of a resource.
 * @param {number} target - Target amount (1 - 999,999,999)
 * @param {number} ratePerInterval - Amount earned per 5-minute interval
 * @returns {{ days: number, hours: number, minutes: number } | null} null if rate is 0
 */
export function calculateWaitTime(target, ratePerInterval) {
  if (!ratePerInterval || ratePerInterval <= 0) return null;
  if (!target || target <= 0) return { days: 0, hours: 0, minutes: 0 };

  const intervals = Math.ceil(target / ratePerInterval);
  const totalMinutes = intervals * 5;

  const days = Math.floor(totalMinutes / 1440);
  const remainingAfterDays = totalMinutes % 1440;
  const hours = Math.floor(remainingAfterDays / 60);
  const minutes = remainingAfterDays % 60;

  return { days, hours, minutes };
}

/**
 * Calculates the maximum wait time across multiple resource pairs.
 * @param {Array<{ target: number, rate: number }>} resources
 * @returns {{ days: number, hours: number, minutes: number } | null}
 */
export function calculateMaxWaitTime(resources) {
  if (!resources || resources.length === 0) return null;

  let maxTotalMinutes = 0;
  let anyValid = false;

  for (const { target, rate } of resources) {
    if (!rate || rate <= 0) continue;
    if (!target || target <= 0) {
      anyValid = true;
      continue;
    }
    anyValid = true;
    const intervals = Math.ceil(target / rate);
    const totalMinutes = intervals * 5;
    if (totalMinutes > maxTotalMinutes) {
      maxTotalMinutes = totalMinutes;
    }
  }

  if (!anyValid) return null;

  const days = Math.floor(maxTotalMinutes / 1440);
  const remainingAfterDays = maxTotalMinutes % 1440;
  const hours = Math.floor(remainingAfterDays / 60);
  const minutes = remainingAfterDays % 60;

  return { days, hours, minutes };
}

/**
 * Calculates available emeralds to spend while still meeting daily pull cost.
 * @param {number} currentEmeralds - Current emerald count
 * @param {number} dailyPullCost - Cost of daily pulls
 * @param {string} pullTime - Time of daily pull in HH:MM format
 * @param {number} emeraldRate - Emeralds earned per 5-minute interval
 * @param {Date} [now] - Current time (injectable for testing)
 * @returns {{ deadlineTime: string, availableToSpend: number, canSpend: boolean }}
 */
export function calculateAvailableEmeralds(currentEmeralds, dailyPullCost, pullTime, emeraldRate, now) {
  if (!now) now = new Date();

  const [pullHour, pullMinute] = pullTime.split(':').map(Number);
  const intervalsNeeded = emeraldRate > 0 ? Math.ceil(dailyPullCost / emeraldRate) : 0;
  const minutesNeeded = intervalsNeeded * 5;

  let deadlineTotalMinutes = ((pullHour * 60 + pullMinute) - minutesNeeded) % 1440;
  if (deadlineTotalMinutes < 0) deadlineTotalMinutes += 1440;

  const deadlineHour = Math.floor(deadlineTotalMinutes / 60) % 24;
  const deadlineMinute = deadlineTotalMinutes % 60;
  const deadlineTime = `${String(deadlineHour).padStart(2, '0')}:${String(deadlineMinute).padStart(2, '0')}`;

  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const nowTotalMinutes = nowHour * 60 + nowMinute;

  let pullTotalMinutes = pullHour * 60 + pullMinute;
  if (pullTotalMinutes <= nowTotalMinutes) pullTotalMinutes += 1440;

  let deadlineForComparison = deadlineTotalMinutes;
  if (deadlineTotalMinutes > pullHour * 60 + pullMinute) {
    // Deadline is today (before midnight), pull is tomorrow
  } else {
    if (pullTotalMinutes > 1440) {
      deadlineForComparison = deadlineTotalMinutes;
      if (deadlineTotalMinutes < nowTotalMinutes && deadlineTotalMinutes <= pullHour * 60 + pullMinute) {
        deadlineForComparison += 1440;
      }
    }
  }

  const minutesUntilPull = pullTotalMinutes - nowTotalMinutes;
  const intervalsUntilPull = Math.floor(minutesUntilPull / 5);
  const emeraldsGenerated = intervalsUntilPull * emeraldRate;
  const availableToSpend = Math.max(0, Math.floor(currentEmeralds + emeraldsGenerated - dailyPullCost));
  const actualCanSpend = nowTotalMinutes < deadlineForComparison;

  return { deadlineTime, availableToSpend, canSpend: actualCanSpend };
}

/**
 * Calculates reward values based on floor number.
 * @param {number} floor - The floor number (0+)
 * @returns {{ bits: number, hologramTickets: number, digiEmeralds: number }}
 */
export function calculateFloorRewards(floor) {
  const bits = (Math.floor(floor / 20) + 3) * 25;
  const hologramTickets = 1 + Math.floor(floor / 20);
  const digiEmeralds = 1 + Math.floor(floor / 20);
  return { bits, hologramTickets, digiEmeralds };
}

/**
 * Calculates gacha level-up requirements.
 * A multi-pull gives 35 pulls, costs 30 tickets, each ticket = 20 digiesmeraldas.
 * If only one gacha has remaining pulls, focus on that one.
 * If both have remaining pulls, calculate both to level together.
 *
 * @param {number} cardsRemaining - Pulls remaining for cards gacha
 * @param {number} supportRemaining - Pulls remaining for support gacha
 * @param {number} cardsTickets - Current tickets for cards gacha
 * @param {number} supportTickets - Current tickets for support gacha
 * @param {number} currentEmeralds - Current digiemerald count
 * @param {number} emeraldRate - DigiEmeralds earned per 5-minute interval
 * @returns {object}
 */
export function calculateGachaLevelUp(cardsRemaining, supportRemaining, cardsTickets, supportTickets, currentEmeralds, emeraldRate) {
  const cardsMultis = cardsRemaining > 0 ? Math.ceil(cardsRemaining / GACHA_MULTI_PULL_SIZE) : 0;
  const supportMultis = supportRemaining > 0 ? Math.ceil(supportRemaining / GACHA_MULTI_PULL_SIZE) : 0;

  const cardsTicketsNeeded = Math.max(0, cardsMultis * GACHA_MULTI_TICKET_COST - cardsTickets);
  const supportTicketsNeeded = Math.max(0, supportMultis * GACHA_MULTI_TICKET_COST - supportTickets);

  const cardsEmeraldCost = cardsTicketsNeeded * GACHA_TICKET_EMERALD_COST;
  const supportEmeraldCost = supportTicketsNeeded * GACHA_TICKET_EMERALD_COST;
  const totalCost = cardsEmeraldCost + supportEmeraldCost;

  const emeraldsNeeded = Math.max(0, totalCost - currentEmeralds);
  const waitTime = calculateWaitTime(emeraldsNeeded, emeraldRate);

  return {
    cards: { multis: cardsMultis, ticketsNeeded: cardsTicketsNeeded, emeraldCost: cardsEmeraldCost },
    support: { multis: supportMultis, ticketsNeeded: supportTicketsNeeded, emeraldCost: supportEmeraldCost },
    totalCost,
    emeraldsNeeded,
    waitTime
  };
}

/**
 * Calculates gacha level-up requirements accounting for elapsed passive time.
 * The game accumulates passively up to 8h. If elapsedMinutes > 0, we account
 * for resources already accumulated but not yet collected.
 *
 * @param {number} cardsRemaining
 * @param {number} supportRemaining
 * @param {number} cardsTickets
 * @param {number} supportTickets
 * @param {number} currentEmeralds
 * @param {number} emeraldRate
 * @param {number} elapsedMinutes - Minutes elapsed since last collection
 * @returns {object}
 */
export function calculateGachaWithElapsed(cardsRemaining, supportRemaining, cardsTickets, supportTickets, currentEmeralds, emeraldRate, elapsedMinutes) {
  const base = calculateGachaLevelUp(cardsRemaining, supportRemaining, cardsTickets, supportTickets, currentEmeralds, emeraldRate);

  if (!elapsedMinutes || elapsedMinutes <= 0) return base;

  // Effective elapsed is capped at 8h (passive cap).
  const effectiveElapsed = Math.min(elapsedMinutes, PASSIVE_MAX_MINUTES);
  const effectiveIntervals = Math.floor(effectiveElapsed / 5);
  const emeraldsAlreadyAccumulated = effectiveIntervals * emeraldRate;

  // Recalculate with the extra emeralds from elapsed time
  const adjustedEmeralds = currentEmeralds + emeraldsAlreadyAccumulated;
  const adjusted = calculateGachaLevelUp(cardsRemaining, supportRemaining, cardsTickets, supportTickets, adjustedEmeralds, emeraldRate);

  return { ...adjusted, elapsedMinutes, emeraldsAlreadyAccumulated, overflowed: elapsedMinutes >= PASSIVE_MAX_MINUTES };
}

/**
 * Gets the elapsed minutes from a lastCollectedTs timestamp.
 * @param {number|null} lastCollectedTs - Epoch ms of last collection
 * @param {Date} [now] - Current time (injectable for testing)
 * @returns {number} Minutes elapsed since last collection (0 if no timestamp)
 */
export function getElapsedMinutes(lastCollectedTs, now) {
  if (!lastCollectedTs) return 0;
  if (!now) now = new Date();
  return Math.max(0, Math.floor((now.getTime() - lastCollectedTs) / 60000));
}

/**
 * Calculates the next collection time based on a 7h interval.
 * Only returns the NEXT one.
 *
 * @param {Date} [now] - Current time
 * @returns {string} Next collection time in HH:MM format
 */
export function calculateNextCollection(now) {
  if (!now) now = new Date();
  const nextMs = now.getTime() + COLLECTION_INTERVAL_MINUTES * 60 * 1000;
  const next = new Date(nextMs);
  return `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;
}

function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
}

// ─── Input Validation ────────────────────────────────────────────────────────

/**
 * Validates a numeric input value.
 * @param {string} rawValue
 * @param {number} min
 * @param {number} max
 * @returns {number|null}
 */
export function validateNumericInput(rawValue, min, max) {
  if (rawValue === '' || rawValue === null || rawValue === undefined) return min;
  const trimmed = String(rawValue).trim();
  if (trimmed === '') return min;
  if (!/^-?\d+$/.test(trimmed)) return null;
  const num = parseInt(trimmed, 10);
  if (isNaN(num)) return null;
  if (num < min) return null;
  if (num > max) return null;
  return num;
}

/**
 * Returns true if reward config has any rate > 0 (configured).
 */
function hasRewardConfig() {
  return rewardConfig.bits > 0 || rewardConfig.hologramTickets > 0 || rewardConfig.digiEmeralds > 0;
}

// ─── Module Lifecycle ────────────────────────────────────────────────────────

export function init(container) {
  containerEl = container;
  eventController = new AbortController();

  const savedReward = loadFromStorage(REWARD_STORAGE_KEY);
  if (savedReward) {
    rewardConfig = {
      floor: typeof savedReward.floor === 'number' ? savedReward.floor : 0,
      bits: typeof savedReward.bits === 'number' ? savedReward.bits : 0,
      hologramTickets: typeof savedReward.hologramTickets === 'number' ? savedReward.hologramTickets : 0,
      digiEmeralds: typeof savedReward.digiEmeralds === 'number' ? savedReward.digiEmeralds : 0
    };
  } else {
    rewardConfig = { floor: 0, bits: 0, hologramTickets: 0, digiEmeralds: 0 };
  }

  const savedEmerald = loadFromStorage(EMERALD_STORAGE_KEY);
  if (savedEmerald) {
    emeraldConfig = {
      dailyPullCost: typeof savedEmerald.dailyPullCost === 'number' ? savedEmerald.dailyPullCost : 5700,
      pullTime: typeof savedEmerald.pullTime === 'string' ? savedEmerald.pullTime : '08:00'
    };
  } else {
    emeraldConfig = { dailyPullCost: 5700, pullTime: '08:00' };
  }

  const savedGacha = loadFromStorage(GACHA_STORAGE_KEY);
  if (savedGacha) {
    gachaConfig = {
      cardsDone: typeof savedGacha.cardsDone === 'number' ? savedGacha.cardsDone : 0,
      cardsTarget: typeof savedGacha.cardsTarget === 'number' ? savedGacha.cardsTarget : 0,
      cardsTickets: typeof savedGacha.cardsTickets === 'number' ? savedGacha.cardsTickets : 0,
      supportDone: typeof savedGacha.supportDone === 'number' ? savedGacha.supportDone : 0,
      supportTarget: typeof savedGacha.supportTarget === 'number' ? savedGacha.supportTarget : 0,
      supportTickets: typeof savedGacha.supportTickets === 'number' ? savedGacha.supportTickets : 0,
      currentEmeralds: typeof savedGacha.currentEmeralds === 'number' ? savedGacha.currentEmeralds : 0,
      lastCollectedTs: typeof savedGacha.lastCollectedTs === 'number' ? savedGacha.lastCollectedTs : null
    };
  } else {
    gachaConfig = { cardsDone: 0, cardsTarget: 0, cardsTickets: 0, supportDone: 0, supportTarget: 0, supportTickets: 0, currentEmeralds: 0, lastCollectedTs: null };
  }

  const savedTab = loadFromStorage(TAB_STORAGE_KEY);
  if (savedTab && typeof savedTab === 'string') activeTab = savedTab;

  setInputValues();
  setActiveTab(activeTab);
  updateGachaRemaining();
  updateCollectionReminder();

  bindTabNavigation();
  bindRewardInputs();
  bindEmeraldInputs();
  bindWaitTimeCalculation();
  bindEmeraldCalculation();
  bindGachaInputs();
  bindGachaCalculation();
  bindGachaQuickAdd();
  bindGachaElapsed();
}

export function destroy() {
  if (eventController) { eventController.abort(); eventController = null; }
  lastValidValues.clear();
  containerEl = null;
}

export function getState() {
  return { rewardConfig: { ...rewardConfig }, emeraldConfig: { ...emeraldConfig }, gachaConfig: { ...gachaConfig }, activeTab };
}

export function setState(state) {
  if (state && state.rewardConfig) {
    rewardConfig = {
      floor: typeof state.rewardConfig.floor === 'number' ? state.rewardConfig.floor : 0,
      bits: typeof state.rewardConfig.bits === 'number' ? state.rewardConfig.bits : 0,
      hologramTickets: typeof state.rewardConfig.hologramTickets === 'number' ? state.rewardConfig.hologramTickets : 0,
      digiEmeralds: typeof state.rewardConfig.digiEmeralds === 'number' ? state.rewardConfig.digiEmeralds : 0
    };
  }
  if (state && state.emeraldConfig) {
    emeraldConfig = {
      dailyPullCost: typeof state.emeraldConfig.dailyPullCost === 'number' ? state.emeraldConfig.dailyPullCost : 5700,
      pullTime: typeof state.emeraldConfig.pullTime === 'string' ? state.emeraldConfig.pullTime : '08:00'
    };
  }
  if (state && state.gachaConfig) {
    gachaConfig = {
      cardsDone: typeof state.gachaConfig.cardsDone === 'number' ? state.gachaConfig.cardsDone : 0,
      cardsTarget: typeof state.gachaConfig.cardsTarget === 'number' ? state.gachaConfig.cardsTarget : 0,
      cardsTickets: typeof state.gachaConfig.cardsTickets === 'number' ? state.gachaConfig.cardsTickets : 0,
      supportDone: typeof state.gachaConfig.supportDone === 'number' ? state.gachaConfig.supportDone : 0,
      supportTarget: typeof state.gachaConfig.supportTarget === 'number' ? state.gachaConfig.supportTarget : 0,
      supportTickets: typeof state.gachaConfig.supportTickets === 'number' ? state.gachaConfig.supportTickets : 0,
      currentEmeralds: typeof state.gachaConfig.currentEmeralds === 'number' ? state.gachaConfig.currentEmeralds : 0,
      lastCollectedTs: typeof state.gachaConfig.lastCollectedTs === 'number' ? state.gachaConfig.lastCollectedTs : null
    };
  }
  if (state && state.activeTab) activeTab = state.activeTab;
  setInputValues();
  setActiveTab(activeTab);
  updateGachaRemaining();
  updateCollectionReminder();
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function setActiveTab(tabId) {
  if (!containerEl) return;
  const tabs = containerEl.querySelectorAll('.mod-calc-tab');
  for (const tab of tabs) tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
  const contents = containerEl.querySelectorAll('.mod-calc-tab-content');
  for (const content of contents) content.classList.toggle('active', content.getAttribute('data-tab-content') === tabId);
  activeTab = tabId;
}

function setInputValues() {
  if (!containerEl) return;

  const setVal = (id, val) => {
    const el = containerEl.querySelector(`#${id}`);
    if (el) { el.value = String(val); lastValidValues.set(id, String(val)); }
  };

  setVal('mod-calc-floor', rewardConfig.floor);
  setVal('mod-calc-bits', rewardConfig.bits);
  setVal('mod-calc-hologram-tickets', rewardConfig.hologramTickets);
  setVal('mod-calc-digi-emeralds', rewardConfig.digiEmeralds);
  setVal('mod-calc-daily-pull-cost', emeraldConfig.dailyPullCost);

  const pullTimeInput = containerEl.querySelector('#mod-calc-pull-time');
  if (pullTimeInput) { pullTimeInput.value = emeraldConfig.pullTime; lastValidValues.set('mod-calc-pull-time', emeraldConfig.pullTime); }

  // Gacha fields — show empty string for 0
  const setGacha = (id, val) => {
    const el = containerEl.querySelector(`#${id}`);
    if (el) { el.value = val ? String(val) : ''; lastValidValues.set(id, String(val)); }
  };
  setGacha('mod-calc-gacha-cards-done', gachaConfig.cardsDone);
  setGacha('mod-calc-gacha-cards-target', gachaConfig.cardsTarget);
  setGacha('mod-calc-gacha-cards-tickets', gachaConfig.cardsTickets);
  setGacha('mod-calc-gacha-support-done', gachaConfig.supportDone);
  setGacha('mod-calc-gacha-support-target', gachaConfig.supportTarget);
  setGacha('mod-calc-gacha-support-tickets', gachaConfig.supportTickets);
  setGacha('mod-calc-gacha-current-emeralds', gachaConfig.currentEmeralds);

  // Elapsed time: compute from lastCollectedTs and display in HH:MM:SS fields
  updateElapsedDisplay();
}

function updateGachaRemaining() {
  if (!containerEl) return;
  const cardsEl = containerEl.querySelector('#mod-calc-gacha-cards-remaining');
  const supportEl = containerEl.querySelector('#mod-calc-gacha-support-remaining');

  const cardsRem = Math.max(0, gachaConfig.cardsTarget - gachaConfig.cardsDone);
  const supportRem = Math.max(0, gachaConfig.supportTarget - gachaConfig.supportDone);

  if (cardsEl) cardsEl.textContent = (gachaConfig.cardsTarget > 0) ? String(cardsRem) : '—';
  if (supportEl) supportEl.textContent = (gachaConfig.supportTarget > 0) ? String(supportRem) : '—';
}

function bindTabNavigation() {
  if (!containerEl || !eventController) return;
  const tabs = containerEl.querySelectorAll('.mod-calc-tab');
  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      if (tabId) { setActiveTab(tabId); saveToStorage(TAB_STORAGE_KEY, tabId); }
    }, { signal: eventController.signal });
  }
}

function bindRewardInputs() {
  if (!containerEl || !eventController) return;

  const floorInput = containerEl.querySelector('#mod-calc-floor');
  if (floorInput) {
    const handleFloor = () => {
      const validated = validateNumericInput(floorInput.value, 0, REWARD_MAX);
      if (validated !== null) {
        rewardConfig.floor = validated;
        lastValidValues.set('mod-calc-floor', String(validated));
        floorInput.value = String(validated);
        const { bits, hologramTickets, digiEmeralds } = calculateFloorRewards(validated);
        rewardConfig.bits = bits;
        rewardConfig.hologramTickets = hologramTickets;
        rewardConfig.digiEmeralds = digiEmeralds;
        const bitsInput = containerEl.querySelector('#mod-calc-bits');
        const hologramInput = containerEl.querySelector('#mod-calc-hologram-tickets');
        const emeraldsInput = containerEl.querySelector('#mod-calc-digi-emeralds');
        if (bitsInput) { bitsInput.value = String(bits); lastValidValues.set('mod-calc-bits', String(bits)); }
        if (hologramInput) { hologramInput.value = String(hologramTickets); lastValidValues.set('mod-calc-hologram-tickets', String(hologramTickets)); }
        if (emeraldsInput) { emeraldsInput.value = String(digiEmeralds); lastValidValues.set('mod-calc-digi-emeralds', String(digiEmeralds)); }
        saveToStorage(REWARD_STORAGE_KEY, rewardConfig);
      } else {
        floorInput.value = lastValidValues.get('mod-calc-floor') || '0';
      }
    };
    floorInput.addEventListener('input', handleFloor, { signal: eventController.signal });
    floorInput.addEventListener('paste', () => setTimeout(handleFloor, 0), { signal: eventController.signal });
  }

  const fields = [
    { id: 'mod-calc-bits', key: 'bits', max: REWARD_MAX },
    { id: 'mod-calc-hologram-tickets', key: 'hologramTickets', max: REWARD_MAX },
    { id: 'mod-calc-digi-emeralds', key: 'digiEmeralds', max: REWARD_MAX }
  ];
  for (const { id, key, max } of fields) {
    const input = containerEl.querySelector(`#${id}`);
    if (!input) continue;
    const handle = () => {
      const validated = validateNumericInput(input.value, 0, max);
      if (validated !== null) {
        rewardConfig[key] = validated;
        lastValidValues.set(id, String(validated));
        input.value = String(validated);
        saveToStorage(REWARD_STORAGE_KEY, rewardConfig);
      } else {
        input.value = lastValidValues.get(id) || '0';
      }
    };
    input.addEventListener('input', handle, { signal: eventController.signal });
    input.addEventListener('paste', () => setTimeout(handle, 0), { signal: eventController.signal });
  }
}

function bindEmeraldInputs() {
  if (!containerEl || !eventController) return;

  const dailyCostInput = containerEl.querySelector('#mod-calc-daily-pull-cost');
  if (dailyCostInput) {
    const handle = () => {
      const validated = validateNumericInput(dailyCostInput.value, 0, EMERALD_MAX);
      if (validated !== null) {
        emeraldConfig.dailyPullCost = validated;
        lastValidValues.set('mod-calc-daily-pull-cost', String(validated));
        dailyCostInput.value = String(validated);
        saveToStorage(EMERALD_STORAGE_KEY, emeraldConfig);
      } else {
        dailyCostInput.value = lastValidValues.get('mod-calc-daily-pull-cost') || '5700';
      }
    };
    dailyCostInput.addEventListener('input', handle, { signal: eventController.signal });
    dailyCostInput.addEventListener('paste', () => setTimeout(handle, 0), { signal: eventController.signal });
  }

  const pullTimeInput = containerEl.querySelector('#mod-calc-pull-time');
  if (pullTimeInput) {
    pullTimeInput.addEventListener('input', () => {
      const value = pullTimeInput.value;
      if (/^\d{2}:\d{2}$/.test(value)) {
        const [h, m] = value.split(':').map(Number);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          emeraldConfig.pullTime = value;
          lastValidValues.set('mod-calc-pull-time', value);
          saveToStorage(EMERALD_STORAGE_KEY, emeraldConfig);
          return;
        }
      }
      pullTimeInput.value = lastValidValues.get('mod-calc-pull-time') || '08:00';
    }, { signal: eventController.signal });
  }
}

function bindWaitTimeCalculation() {
  if (!containerEl || !eventController) return;
  const waitBtn = containerEl.querySelector('#mod-calc-wait-btn');
  if (!waitBtn) return;

  waitBtn.addEventListener('click', () => {
    const resultEl = containerEl.querySelector('#mod-calc-wait-result');
    const resultValueEl = containerEl.querySelector('#mod-calc-wait-result-value');
    const messageEl = containerEl.querySelector('#mod-calc-wait-message');
    const daysEl = containerEl.querySelector('#mod-calc-days-value');
    const hoursEl = containerEl.querySelector('#mod-calc-hours-value');
    const minutesEl = containerEl.querySelector('#mod-calc-minutes-value');

    if (!resultValueEl || !messageEl) return;

    // Check reward config
    if (!hasRewardConfig()) {
      if (resultEl) resultEl.hidden = false;
      resultValueEl.hidden = true;
      messageEl.hidden = false;
      messageEl.setAttribute('data-i18n', 'modules.passiveCalc.configRequired');
      messageEl.textContent = 'Configure rewards first';
      if (typeof window !== 'undefined' && window.__i18n_t) messageEl.textContent = window.__i18n_t('modules.passiveCalc.configRequired');
      return;
    }

    const targetBits = parseInt(containerEl.querySelector('#mod-calc-target-bits')?.value, 10) || 0;
    const targetHologram = parseInt(containerEl.querySelector('#mod-calc-target-hologram-tickets')?.value, 10) || 0;
    const targetEmeralds = parseInt(containerEl.querySelector('#mod-calc-target-digi-emeralds')?.value, 10) || 0;

    const resources = [];
    if (targetBits > 0) resources.push({ target: targetBits, rate: rewardConfig.bits });
    if (targetHologram > 0) resources.push({ target: targetHologram, rate: rewardConfig.hologramTickets });
    if (targetEmeralds > 0) resources.push({ target: targetEmeralds, rate: rewardConfig.digiEmeralds });

    if (resources.length === 0) {
      if (resultEl) resultEl.hidden = false;
      resultValueEl.hidden = false;
      messageEl.hidden = true;
      if (daysEl) daysEl.textContent = '0';
      if (hoursEl) hoursEl.textContent = '0';
      if (minutesEl) minutesEl.textContent = '0';
      return;
    }

    const hasZeroRate = resources.some(r => !r.rate || r.rate <= 0);
    if (hasZeroRate) {
      if (resultEl) resultEl.hidden = false;
      resultValueEl.hidden = true;
      messageEl.hidden = false;
      return;
    }

    const result = calculateMaxWaitTime(resources);
    if (result) {
      if (resultEl) resultEl.hidden = false;
      resultValueEl.hidden = false;
      messageEl.hidden = true;
      if (daysEl) daysEl.textContent = String(result.days);
      if (hoursEl) hoursEl.textContent = String(result.hours);
      if (minutesEl) minutesEl.textContent = String(result.minutes);
    } else {
      if (resultEl) resultEl.hidden = false;
      resultValueEl.hidden = true;
      messageEl.hidden = false;
    }
  }, { signal: eventController.signal });
}

function bindEmeraldCalculation() {
  if (!containerEl || !eventController) return;

  const currentEmeraldsInput = containerEl.querySelector('#mod-calc-current-emeralds');
  if (currentEmeraldsInput) {
    const handle = () => {
      const validated = validateNumericInput(currentEmeraldsInput.value, 0, EMERALD_MAX);
      if (validated !== null) {
        lastValidValues.set('mod-calc-current-emeralds', String(validated));
        currentEmeraldsInput.value = String(validated);
      } else {
        currentEmeraldsInput.value = lastValidValues.get('mod-calc-current-emeralds') || '0';
      }
    };
    currentEmeraldsInput.addEventListener('input', handle, { signal: eventController.signal });
    currentEmeraldsInput.addEventListener('paste', () => setTimeout(handle, 0), { signal: eventController.signal });
  }

  const emeraldBtn = containerEl.querySelector('#mod-calc-emerald-btn');
  if (!emeraldBtn) return;

  emeraldBtn.addEventListener('click', () => {
    const resultEl = containerEl.querySelector('#mod-calc-emerald-result');
    const detailsEl = containerEl.querySelector('.mod-calc-emerald-details');
    const messageEl = containerEl.querySelector('#mod-calc-emerald-message');

    if (!messageEl) return;

    // Check reward config
    if (!hasRewardConfig()) {
      if (resultEl) resultEl.hidden = false;
      if (detailsEl) detailsEl.hidden = true;
      messageEl.hidden = false;
      messageEl.setAttribute('data-i18n', 'modules.passiveCalc.configRequired');
      messageEl.textContent = 'Configure rewards first';
      if (typeof window !== 'undefined' && window.__i18n_t) messageEl.textContent = window.__i18n_t('modules.passiveCalc.configRequired');
      return;
    }

    const emeraldRate = rewardConfig.digiEmeralds;
    const currentEmeralds = parseInt(containerEl.querySelector('#mod-calc-current-emeralds')?.value, 10) || 0;
    const result = calculateAvailableEmeralds(currentEmeralds, emeraldConfig.dailyPullCost, emeraldConfig.pullTime, emeraldRate);

    if (resultEl) resultEl.hidden = false;
    if (result.canSpend) {
      if (detailsEl) detailsEl.hidden = false;
      messageEl.hidden = true;
      const deadlineEl = containerEl.querySelector('#mod-calc-deadline-value');
      const canSpendEl = containerEl.querySelector('#mod-calc-can-spend-value');
      if (deadlineEl) deadlineEl.textContent = result.deadlineTime;
      if (canSpendEl) canSpendEl.textContent = String(result.availableToSpend);
    } else {
      if (detailsEl) detailsEl.hidden = true;
      messageEl.hidden = false;
      messageEl.setAttribute('data-i18n', 'modules.passiveCalc.cannotSpend');
      messageEl.textContent = 'Cannot spend emeralds and reach the goal';
      if (typeof window !== 'undefined' && window.__i18n_t) messageEl.textContent = window.__i18n_t('modules.passiveCalc.cannotSpend');
    }
  }, { signal: eventController.signal });
}

function bindGachaInputs() {
  if (!containerEl || !eventController) return;

  const gachaFields = [
    { id: 'mod-calc-gacha-cards-done', key: 'cardsDone', max: GACHA_PULL_MAX },
    { id: 'mod-calc-gacha-cards-target', key: 'cardsTarget', max: GACHA_PULL_MAX },
    { id: 'mod-calc-gacha-cards-tickets', key: 'cardsTickets', max: GACHA_TICKET_MAX },
    { id: 'mod-calc-gacha-support-done', key: 'supportDone', max: GACHA_PULL_MAX },
    { id: 'mod-calc-gacha-support-target', key: 'supportTarget', max: GACHA_PULL_MAX },
    { id: 'mod-calc-gacha-support-tickets', key: 'supportTickets', max: GACHA_TICKET_MAX },
    { id: 'mod-calc-gacha-current-emeralds', key: 'currentEmeralds', max: EMERALD_MAX }
  ];

  for (const { id, key, max } of gachaFields) {
    const input = containerEl.querySelector(`#${id}`);
    if (!input) continue;
    const handle = () => {
      const validated = validateNumericInput(input.value, 0, max);
      if (validated !== null) {
        gachaConfig[key] = validated;
        lastValidValues.set(id, String(validated));
        input.value = String(validated);
        saveToStorage(GACHA_STORAGE_KEY, gachaConfig);
        updateGachaRemaining();
      } else {
        input.value = lastValidValues.get(id) || '0';
      }
    };
    input.addEventListener('input', handle, { signal: eventController.signal });
    input.addEventListener('paste', () => setTimeout(handle, 0), { signal: eventController.signal });
  }
}

function bindGachaCalculation() {
  if (!containerEl || !eventController) return;
  const gachaBtn = containerEl.querySelector('#mod-calc-gacha-btn');
  if (!gachaBtn) return;

  gachaBtn.addEventListener('click', () => {
    const resultEl = containerEl.querySelector('#mod-calc-gacha-result');
    const detailsEl = containerEl.querySelector('#mod-calc-gacha-details');
    const messageEl = containerEl.querySelector('#mod-calc-gacha-message');
    const cardsBreakdown = containerEl.querySelector('#mod-calc-gacha-cards-breakdown');
    const supportBreakdown = containerEl.querySelector('#mod-calc-gacha-support-breakdown');

    if (!resultEl || !detailsEl || !messageEl) return;

    // Check reward config
    if (!hasRewardConfig()) {
      resultEl.hidden = false;
      detailsEl.hidden = true;
      messageEl.hidden = false;
      messageEl.setAttribute('data-i18n', 'modules.passiveCalc.configRequired');
      messageEl.textContent = 'Configure rewards first';
      if (typeof window !== 'undefined' && window.__i18n_t) messageEl.textContent = window.__i18n_t('modules.passiveCalc.configRequired');
      return;
    }

    const cardsRemaining = Math.max(0, gachaConfig.cardsTarget - gachaConfig.cardsDone);
    const supportRemaining = Math.max(0, gachaConfig.supportTarget - gachaConfig.supportDone);

    if (cardsRemaining <= 0 && supportRemaining <= 0) {
      resultEl.hidden = false;
      detailsEl.hidden = true;
      messageEl.hidden = false;
      messageEl.setAttribute('data-i18n', 'modules.passiveCalc.gachaEmpty');
      messageEl.textContent = 'Enter pulls needed for at least one gacha';
      if (typeof window !== 'undefined' && window.__i18n_t) messageEl.textContent = window.__i18n_t('modules.passiveCalc.gachaEmpty');
      return;
    }

    const emeraldRate = rewardConfig.digiEmeralds;
    const elapsedMin = getElapsedMinutes(gachaConfig.lastCollectedTs);
    const result = calculateGachaWithElapsed(
      cardsRemaining, supportRemaining,
      gachaConfig.cardsTickets, gachaConfig.supportTickets,
      gachaConfig.currentEmeralds, emeraldRate, elapsedMin
    );

    resultEl.hidden = false;
    detailsEl.hidden = false;
    messageEl.hidden = true;

    if (cardsBreakdown) cardsBreakdown.hidden = cardsRemaining <= 0;
    if (supportBreakdown) supportBreakdown.hidden = supportRemaining <= 0;

    const setEl = (id, val) => { const el = containerEl.querySelector(`#${id}`); if (el) el.textContent = String(val); };

    setEl('mod-calc-gacha-cards-multi', result.cards.multis);
    setEl('mod-calc-gacha-cards-ticket-cost', result.cards.ticketsNeeded);
    setEl('mod-calc-gacha-cards-cost', result.cards.emeraldCost);
    setEl('mod-calc-gacha-support-multi', result.support.multis);
    setEl('mod-calc-gacha-support-ticket-cost', result.support.ticketsNeeded);
    setEl('mod-calc-gacha-support-cost', result.support.emeraldCost);
    setEl('mod-calc-gacha-total-cost', result.totalCost);
    setEl('mod-calc-gacha-needed', result.emeraldsNeeded);

    const timeEl = containerEl.querySelector('#mod-calc-gacha-time');
    if (timeEl) {
      if (result.emeraldsNeeded === 0) {
        timeEl.textContent = '✓';
      } else if (result.waitTime) {
        const { days, hours, minutes } = result.waitTime;
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        timeEl.textContent = parts.length > 0 ? parts.join(' ') : '0m';
      } else {
        timeEl.textContent = '∞';
      }
    }
  }, { signal: eventController.signal });
}


function updateCollectionReminder() {
  if (!containerEl) return;
  const reminderEl = containerEl.querySelector('#mod-calc-collection-reminder');
  if (!reminderEl) return;

  const elapsedMin = getElapsedMinutes(gachaConfig.lastCollectedTs);

  if (elapsedMin >= PASSIVE_MAX_MINUTES) {
    reminderEl.hidden = false;
    const nextTimeEl = containerEl.querySelector('#mod-calc-next-collection-time');
    if (nextTimeEl) {
      nextTimeEl.textContent = calculateNextCollection(new Date());
    }
  } else {
    reminderEl.hidden = true;
  }
}

function bindGachaQuickAdd() {
  if (!containerEl || !eventController) return;
  const buttons = containerEl.querySelectorAll('.mod-calc-btn-quick[data-add]');
  for (const btn of buttons) {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.getAttribute('data-add'), 10) || 0;
      const newVal = Math.min(gachaConfig.currentEmeralds + amount, EMERALD_MAX);
      gachaConfig.currentEmeralds = newVal;
      const input = containerEl.querySelector('#mod-calc-gacha-current-emeralds');
      if (input) { input.value = String(newVal); lastValidValues.set('mod-calc-gacha-current-emeralds', String(newVal)); }
      saveToStorage(GACHA_STORAGE_KEY, gachaConfig);
    }, { signal: eventController.signal });
  }
}

function bindGachaElapsed() {
  if (!containerEl || !eventController) return;
  const btn = containerEl.querySelector('#mod-calc-gacha-elapsed-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const elH = containerEl.querySelector('#mod-calc-gacha-elapsed-h');
    const elM = containerEl.querySelector('#mod-calc-gacha-elapsed-m');
    const elS = containerEl.querySelector('#mod-calc-gacha-elapsed-s');
    const h = Math.max(0, Math.min(99, parseInt(elH?.value, 10) || 0));
    const m = Math.max(0, Math.min(59, parseInt(elM?.value, 10) || 0));
    const s = Math.max(0, Math.min(59, parseInt(elS?.value, 10) || 0));

    // Calculate lastCollectedTs = now - elapsed
    const elapsedMs = (h * 3600 + m * 60 + s) * 1000;
    gachaConfig.lastCollectedTs = Date.now() - elapsedMs;
    saveToStorage(GACHA_STORAGE_KEY, gachaConfig);
    updateElapsedDisplay();
    updateCollectionReminder();
  }, { signal: eventController.signal });
}

function updateElapsedDisplay() {
  if (!containerEl) return;

  const elH = containerEl.querySelector('#mod-calc-gacha-elapsed-h');
  const elM = containerEl.querySelector('#mod-calc-gacha-elapsed-m');
  const elS = containerEl.querySelector('#mod-calc-gacha-elapsed-s');
  const lastCollectedEl = containerEl.querySelector('#mod-calc-last-collected-time');

  if (gachaConfig.lastCollectedTs) {
    const elapsedMs = Date.now() - gachaConfig.lastCollectedTs;
    const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (elH) elH.value = String(h);
    if (elM) elM.value = String(m);
    if (elS) elS.value = String(s);

    // Show last collected time
    if (lastCollectedEl) {
      const d = new Date(gachaConfig.lastCollectedTs);
      lastCollectedEl.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  } else {
    if (elH) elH.value = '0';
    if (elM) elM.value = '0';
    if (elS) elS.value = '0';
    if (lastCollectedEl) lastCollectedEl.textContent = '--:--';
  }
}
