/**
 * Passive Gain Calculator Module
 *
 * Calculates wait times for passive resource accumulation and
 * emerald availability for daily pulls.
 *
 * Module interface: init(container), destroy(), getState(), setState(state)
 */

const REWARD_STORAGE_KEY = 'digimemory-passive-config';
const EMERALD_STORAGE_KEY = 'digimemory-emerald-config';

const REWARD_MAX = 999999999;
const EMERALD_MAX = 99999;

/** @type {HTMLElement|null} */
let containerEl = null;

/** @type {{ floor: number, bits: number, hologramTickets: number, digiEmeralds: number }} */
let rewardConfig = { floor: 0, bits: 0, hologramTickets: 0, digiEmeralds: 0 };

/** @type {{ dailyPullCost: number, pullTime: string }} */
let emeraldConfig = { dailyPullCost: 5700, pullTime: '08:00' };

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

  // Parse pullTime
  const [pullHour, pullMinute] = pullTime.split(':').map(Number);

  // Calculate how many intervals needed to accumulate dailyPullCost from zero
  // This determines how much time before pullTime we need to stop spending
  const intervalsNeeded = emeraldRate > 0 ? Math.ceil(dailyPullCost / emeraldRate) : 0;
  const minutesNeeded = intervalsNeeded * 5;

  // Calculate deadline: pullTime minus minutesNeeded (modulo 24 hours)
  // Use proper modulo to handle cases where minutesNeeded > 1440
  let deadlineTotalMinutes = ((pullHour * 60 + pullMinute) - minutesNeeded) % 1440;
  if (deadlineTotalMinutes < 0) {
    deadlineTotalMinutes += 1440;
  }

  const deadlineHour = Math.floor(deadlineTotalMinutes / 60) % 24;
  const deadlineMinute = deadlineTotalMinutes % 60;
  const deadlineTime = `${String(deadlineHour).padStart(2, '0')}:${String(deadlineMinute).padStart(2, '0')}`;

  // Determine current time in minutes
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const nowTotalMinutes = nowHour * 60 + nowMinute;

  // Determine pull time for comparison (use next day if pull time already passed)
  let pullTotalMinutes = pullHour * 60 + pullMinute;
  if (pullTotalMinutes <= nowTotalMinutes) {
    // Pull time is tomorrow
    pullTotalMinutes += 1440;
  }

  // Determine deadline for comparison
  let deadlineForComparison = deadlineTotalMinutes;
  // If deadline is after pull time in raw minutes, it means it wrapped to previous day
  if (deadlineTotalMinutes > pullHour * 60 + pullMinute) {
    // Deadline is today (before midnight), pull is tomorrow
    // Deadline applies if now is before it
  } else {
    // Deadline is same day as pull
    // If pull is tomorrow, deadline might also need adjustment
    if (pullTotalMinutes > 1440) {
      // Pull is tomorrow
      deadlineForComparison = deadlineTotalMinutes;
      if (deadlineTotalMinutes < nowTotalMinutes && deadlineTotalMinutes <= pullHour * 60 + pullMinute) {
        deadlineForComparison += 1440;
      }
    }
  }

  // Check if we're past the deadline
  const canSpend = nowTotalMinutes < deadlineForComparison || deadlineForComparison > nowTotalMinutes;

  // Calculate emeralds that will be generated between now and pull time
  const minutesUntilPull = pullTotalMinutes - nowTotalMinutes;
  const intervalsUntilPull = Math.floor(minutesUntilPull / 5);
  const emeraldsGenerated = intervalsUntilPull * emeraldRate;

  // Available to spend = current + will be generated - dailyPullCost
  const availableToSpend = Math.max(0, Math.floor(currentEmeralds + emeraldsGenerated - dailyPullCost));

  // Recalculate canSpend: can spend if availableToSpend > 0 and current time is before deadline
  const actualCanSpend = nowTotalMinutes < deadlineForComparison;

  return {
    deadlineTime,
    availableToSpend,
    canSpend: actualCanSpend
  };
}

/**
 * Calculates reward values (Bits, Hologram Tickets, and DigiEmeralds) based on floor number.
 * @param {number} floor - The floor number (0+)
 * @returns {{ bits: number, hologramTickets: number, digiEmeralds: number }}
 */
export function calculateFloorRewards(floor) {
  const bits = (Math.floor(floor / 20) + 3) * 25;
  const hologramTickets = 1 + Math.floor(floor / 20);
  const digiEmeralds = 1 + Math.floor(floor / 20);
  return { bits, hologramTickets, digiEmeralds };
}

// ─── localStorage Helpers ────────────────────────────────────────────────────

/**
 * Safely read from localStorage.
 * @param {string} key
 * @returns {object|null}
 */
function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // localStorage unavailable or invalid JSON — operate without persistence
  }
  return null;
}

/**
 * Safely write to localStorage.
 * @param {string} key
 * @param {object} value
 */
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // localStorage unavailable — operate without persistence
  }
}

// ─── Input Validation ────────────────────────────────────────────────────────

/**
 * Validates a numeric input value and returns the validated integer, or null if invalid.
 * @param {string} rawValue - The raw input value
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number|null} The valid integer or null if invalid
 */
export function validateNumericInput(rawValue, min, max) {
  // Empty string is treated as 0
  if (rawValue === '' || rawValue === null || rawValue === undefined) return min;

  // Check if it's a valid integer (allow leading zeros in input but parse normally)
  const trimmed = String(rawValue).trim();
  if (trimmed === '') return min;

  // Reject non-numeric characters (allow optional leading minus, but our ranges start at 0)
  if (!/^-?\d+$/.test(trimmed)) return null;

  const num = parseInt(trimmed, 10);

  if (isNaN(num)) return null;
  if (num < min) return null;
  if (num > max) return null;

  return num;
}

// ─── Module Lifecycle ────────────────────────────────────────────────────────

/**
 * Initialize the Passive Calc module in the given container.
 * @param {HTMLElement} container - The DOM container element
 */
export function init(container) {
  containerEl = container;
  eventController = new AbortController();

  // Load saved config from localStorage
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

  // Set input values from loaded config
  setInputValues();

  // Bind event listeners
  bindRewardInputs();
  bindEmeraldInputs();
  bindWaitTimeCalculation();
  bindEmeraldCalculation();
}

/**
 * Cleanup when the module is unloaded.
 */
export function destroy() {
  if (eventController) {
    eventController.abort();
    eventController = null;
  }
  lastValidValues.clear();
  containerEl = null;
}

/**
 * Returns the current state of the module for persistence across module switches.
 * @returns {{ rewardConfig: object, emeraldConfig: object }}
 */
export function getState() {
  return {
    rewardConfig: { ...rewardConfig },
    emeraldConfig: { ...emeraldConfig }
  };
}

/**
 * Restores a previously saved state.
 * @param {{ rewardConfig: object, emeraldConfig: object }} state
 */
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
  setInputValues();
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

/**
 * Set DOM input values from the current config state.
 */
function setInputValues() {
  if (!containerEl) return;

  const floorInput = containerEl.querySelector('#mod-calc-floor');
  const bitsInput = containerEl.querySelector('#mod-calc-bits');
  const hologramInput = containerEl.querySelector('#mod-calc-hologram-tickets');
  const emeraldsInput = containerEl.querySelector('#mod-calc-digi-emeralds');
  const dailyPullCostInput = containerEl.querySelector('#mod-calc-daily-pull-cost');
  const pullTimeInput = containerEl.querySelector('#mod-calc-pull-time');

  if (floorInput) {
    floorInput.value = String(rewardConfig.floor);
    lastValidValues.set('mod-calc-floor', String(rewardConfig.floor));
  }
  if (bitsInput) {
    bitsInput.value = String(rewardConfig.bits);
    lastValidValues.set('mod-calc-bits', String(rewardConfig.bits));
  }
  if (hologramInput) {
    hologramInput.value = String(rewardConfig.hologramTickets);
    lastValidValues.set('mod-calc-hologram-tickets', String(rewardConfig.hologramTickets));
  }
  if (emeraldsInput) {
    emeraldsInput.value = String(rewardConfig.digiEmeralds);
    lastValidValues.set('mod-calc-digi-emeralds', String(rewardConfig.digiEmeralds));
  }
  if (dailyPullCostInput) {
    dailyPullCostInput.value = String(emeraldConfig.dailyPullCost);
    lastValidValues.set('mod-calc-daily-pull-cost', String(emeraldConfig.dailyPullCost));
  }
  if (pullTimeInput) {
    pullTimeInput.value = emeraldConfig.pullTime;
    lastValidValues.set('mod-calc-pull-time', emeraldConfig.pullTime);
  }
}

/**
 * Bind input event listeners for reward configuration fields.
 */
function bindRewardInputs() {
  if (!containerEl || !eventController) return;

  // Floor input — auto-calculates Bits and Hologram Tickets
  const floorInput = containerEl.querySelector('#mod-calc-floor');
  if (floorInput) {
    floorInput.addEventListener('input', () => {
      const validated = validateNumericInput(floorInput.value, 0, REWARD_MAX);
      if (validated !== null) {
        rewardConfig.floor = validated;
        lastValidValues.set('mod-calc-floor', String(validated));
        floorInput.value = String(validated);

        // Auto-calculate Bits, Hologram Tickets, and DigiEmeralds from floor
        const { bits, hologramTickets, digiEmeralds } = calculateFloorRewards(validated);
        rewardConfig.bits = bits;
        rewardConfig.hologramTickets = hologramTickets;
        rewardConfig.digiEmeralds = digiEmeralds;

        // Update DOM inputs
        const bitsInput = containerEl.querySelector('#mod-calc-bits');
        const hologramInput = containerEl.querySelector('#mod-calc-hologram-tickets');
        const emeraldsInput = containerEl.querySelector('#mod-calc-digi-emeralds');
        if (bitsInput) {
          bitsInput.value = String(bits);
          lastValidValues.set('mod-calc-bits', String(bits));
        }
        if (hologramInput) {
          hologramInput.value = String(hologramTickets);
          lastValidValues.set('mod-calc-hologram-tickets', String(hologramTickets));
        }
        if (emeraldsInput) {
          emeraldsInput.value = String(digiEmeralds);
          lastValidValues.set('mod-calc-digi-emeralds', String(digiEmeralds));
        }

        saveToStorage(REWARD_STORAGE_KEY, rewardConfig);
      } else {
        // Revert to last valid value
        const lastValid = lastValidValues.get('mod-calc-floor') || '0';
        floorInput.value = lastValid;
      }
    }, { signal: eventController.signal });

    floorInput.addEventListener('paste', (e) => {
      setTimeout(() => {
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
          if (bitsInput) {
            bitsInput.value = String(bits);
            lastValidValues.set('mod-calc-bits', String(bits));
          }
          if (hologramInput) {
            hologramInput.value = String(hologramTickets);
            lastValidValues.set('mod-calc-hologram-tickets', String(hologramTickets));
          }
          if (emeraldsInput) {
            emeraldsInput.value = String(digiEmeralds);
            lastValidValues.set('mod-calc-digi-emeralds', String(digiEmeralds));
          }

          saveToStorage(REWARD_STORAGE_KEY, rewardConfig);
        } else {
          const lastValid = lastValidValues.get('mod-calc-floor') || '0';
          floorInput.value = lastValid;
        }
      }, 0);
    }, { signal: eventController.signal });
  }

  const fields = [
    { id: 'mod-calc-bits', key: 'bits', max: REWARD_MAX },
    { id: 'mod-calc-hologram-tickets', key: 'hologramTickets', max: REWARD_MAX },
    { id: 'mod-calc-digi-emeralds', key: 'digiEmeralds', max: REWARD_MAX }
  ];

  for (const { id, key, max } of fields) {
    const input = containerEl.querySelector(`#${id}`);
    if (!input) continue;

    input.addEventListener('input', () => {
      const validated = validateNumericInput(input.value, 0, max);
      if (validated !== null) {
        rewardConfig[key] = validated;
        lastValidValues.set(id, String(validated));
        input.value = String(validated);
        saveToStorage(REWARD_STORAGE_KEY, rewardConfig);
      } else {
        // Revert to last valid value
        const lastValid = lastValidValues.get(id) || '0';
        input.value = lastValid;
      }
    }, { signal: eventController.signal });

    input.addEventListener('paste', (e) => {
      // Let the input event handle validation after paste
      setTimeout(() => {
        const validated = validateNumericInput(input.value, 0, max);
        if (validated !== null) {
          rewardConfig[key] = validated;
          lastValidValues.set(id, String(validated));
          input.value = String(validated);
          saveToStorage(REWARD_STORAGE_KEY, rewardConfig);
        } else {
          const lastValid = lastValidValues.get(id) || '0';
          input.value = lastValid;
        }
      }, 0);
    }, { signal: eventController.signal });
  }
}

/**
 * Bind input event listeners for emerald configuration fields.
 */
function bindEmeraldInputs() {
  if (!containerEl || !eventController) return;

  // Daily pull cost
  const dailyCostInput = containerEl.querySelector('#mod-calc-daily-pull-cost');
  if (dailyCostInput) {
    dailyCostInput.addEventListener('input', () => {
      const validated = validateNumericInput(dailyCostInput.value, 0, EMERALD_MAX);
      if (validated !== null) {
        emeraldConfig.dailyPullCost = validated;
        lastValidValues.set('mod-calc-daily-pull-cost', String(validated));
        dailyCostInput.value = String(validated);
        saveToStorage(EMERALD_STORAGE_KEY, emeraldConfig);
      } else {
        const lastValid = lastValidValues.get('mod-calc-daily-pull-cost') || '5700';
        dailyCostInput.value = lastValid;
      }
    }, { signal: eventController.signal });

    dailyCostInput.addEventListener('paste', (e) => {
      setTimeout(() => {
        const validated = validateNumericInput(dailyCostInput.value, 0, EMERALD_MAX);
        if (validated !== null) {
          emeraldConfig.dailyPullCost = validated;
          lastValidValues.set('mod-calc-daily-pull-cost', String(validated));
          dailyCostInput.value = String(validated);
          saveToStorage(EMERALD_STORAGE_KEY, emeraldConfig);
        } else {
          const lastValid = lastValidValues.get('mod-calc-daily-pull-cost') || '5700';
          dailyCostInput.value = lastValid;
        }
      }, 0);
    }, { signal: eventController.signal });
  }

  // Pull time
  const pullTimeInput = containerEl.querySelector('#mod-calc-pull-time');
  if (pullTimeInput) {
    pullTimeInput.addEventListener('input', () => {
      const value = pullTimeInput.value;
      // Validate HH:MM format
      if (/^\d{2}:\d{2}$/.test(value)) {
        const [h, m] = value.split(':').map(Number);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          emeraldConfig.pullTime = value;
          lastValidValues.set('mod-calc-pull-time', value);
          saveToStorage(EMERALD_STORAGE_KEY, emeraldConfig);
          return;
        }
      }
      // Revert on invalid
      const lastValid = lastValidValues.get('mod-calc-pull-time') || '08:00';
      pullTimeInput.value = lastValid;
    }, { signal: eventController.signal });
  }
}

/**
 * Bind input validation and click handler for the emerald availability calculator.
 */
function bindEmeraldCalculation() {
  if (!containerEl || !eventController) return;

  // Validate current emeralds input (range [0, 99999])
  const currentEmeraldsInput = containerEl.querySelector('#mod-calc-current-emeralds');
  if (currentEmeraldsInput) {
    currentEmeraldsInput.addEventListener('input', () => {
      const validated = validateNumericInput(currentEmeraldsInput.value, 0, EMERALD_MAX);
      if (validated !== null) {
        lastValidValues.set('mod-calc-current-emeralds', String(validated));
        currentEmeraldsInput.value = String(validated);
      } else {
        const lastValid = lastValidValues.get('mod-calc-current-emeralds') || '0';
        currentEmeraldsInput.value = lastValid;
      }
    }, { signal: eventController.signal });

    currentEmeraldsInput.addEventListener('paste', () => {
      setTimeout(() => {
        const validated = validateNumericInput(currentEmeraldsInput.value, 0, EMERALD_MAX);
        if (validated !== null) {
          lastValidValues.set('mod-calc-current-emeralds', String(validated));
          currentEmeraldsInput.value = String(validated);
        } else {
          const lastValid = lastValidValues.get('mod-calc-current-emeralds') || '0';
          currentEmeraldsInput.value = lastValid;
        }
      }, 0);
    }, { signal: eventController.signal });
  }

  // Bind calculate button
  const emeraldBtn = containerEl.querySelector('#mod-calc-emerald-btn');
  if (!emeraldBtn) return;

  emeraldBtn.addEventListener('click', () => {
    const deadlineEl = containerEl.querySelector('#mod-calc-deadline-value');
    const canSpendEl = containerEl.querySelector('#mod-calc-can-spend-value');
    const messageEl = containerEl.querySelector('#mod-calc-emerald-message');
    const detailsEl = containerEl.querySelector('.mod-calc-emerald-details');

    if (!deadlineEl || !canSpendEl || !messageEl) return;

    // Get emerald rate from reward config
    const emeraldRate = rewardConfig.digiEmeralds;

    // If rate is 0, show "configure rewards first" warning
    if (!emeraldRate || emeraldRate <= 0) {
      if (detailsEl) detailsEl.hidden = true;
      messageEl.hidden = false;
      messageEl.setAttribute('data-i18n', 'modules.passiveCalc.configRequired');
      messageEl.textContent = messageEl.getAttribute('data-i18n-resolved') || 'Configure rewards first';
      // Attempt to use i18n translation if available
      if (typeof window !== 'undefined' && window.__i18n_t) {
        messageEl.textContent = window.__i18n_t('modules.passiveCalc.configRequired');
      }
      return;
    }

    // Read current emeralds
    const currentEmeraldsInput = containerEl.querySelector('#mod-calc-current-emeralds');
    const currentEmeralds = parseInt(currentEmeraldsInput?.value, 10) || 0;

    // Get config values
    const dailyPullCost = emeraldConfig.dailyPullCost;
    const pullTime = emeraldConfig.pullTime;

    // Calculate
    const result = calculateAvailableEmeralds(currentEmeralds, dailyPullCost, pullTime, emeraldRate);

    if (result.canSpend) {
      // Show details, hide warning
      if (detailsEl) detailsEl.hidden = false;
      messageEl.hidden = true;
      deadlineEl.textContent = result.deadlineTime;
      canSpendEl.textContent = String(result.availableToSpend);
    } else {
      // Show warning, hide details (or show grayed out)
      if (detailsEl) detailsEl.hidden = true;
      messageEl.hidden = false;
      messageEl.setAttribute('data-i18n', 'modules.passiveCalc.cannotSpend');
      messageEl.textContent = 'Cannot spend emeralds and reach the goal';
      if (typeof window !== 'undefined' && window.__i18n_t) {
        messageEl.textContent = window.__i18n_t('modules.passiveCalc.cannotSpend');
      }
    }
  }, { signal: eventController.signal });
}

/**
 * Bind click handler for the wait time calculate button.
 */
function bindWaitTimeCalculation() {
  if (!containerEl || !eventController) return;

  const waitBtn = containerEl.querySelector('#mod-calc-wait-btn');
  if (!waitBtn) return;

  waitBtn.addEventListener('click', () => {
    const targetBitsInput = containerEl.querySelector('#mod-calc-target-bits');
    const targetHologramInput = containerEl.querySelector('#mod-calc-target-hologram-tickets');
    const targetEmeraldsInput = containerEl.querySelector('#mod-calc-target-digi-emeralds');
    const resultValueEl = containerEl.querySelector('#mod-calc-wait-result-value');
    const messageEl = containerEl.querySelector('#mod-calc-wait-message');
    const daysEl = containerEl.querySelector('#mod-calc-days-value');
    const hoursEl = containerEl.querySelector('#mod-calc-hours-value');
    const minutesEl = containerEl.querySelector('#mod-calc-minutes-value');

    if (!resultValueEl || !messageEl) return;

    // Read target values (treat empty/invalid as 0)
    const targetBits = parseInt(targetBitsInput?.value, 10) || 0;
    const targetHologram = parseInt(targetHologramInput?.value, 10) || 0;
    const targetEmeralds = parseInt(targetEmeraldsInput?.value, 10) || 0;

    // Build resources array with only non-zero targets
    const resources = [];
    if (targetBits > 0) resources.push({ target: targetBits, rate: rewardConfig.bits });
    if (targetHologram > 0) resources.push({ target: targetHologram, rate: rewardConfig.hologramTickets });
    if (targetEmeralds > 0) resources.push({ target: targetEmeralds, rate: rewardConfig.digiEmeralds });

    // If no targets specified, show zero result
    if (resources.length === 0) {
      resultValueEl.hidden = false;
      messageEl.hidden = true;
      if (daysEl) daysEl.textContent = '0';
      if (hoursEl) hoursEl.textContent = '0';
      if (minutesEl) minutesEl.textContent = '0';
      return;
    }

    // Check if any target resource has rate = 0
    const hasZeroRate = resources.some(r => !r.rate || r.rate <= 0);
    if (hasZeroRate) {
      // Show warning message, hide result values
      resultValueEl.hidden = true;
      messageEl.hidden = false;
      return;
    }

    // Calculate and display result
    const result = calculateMaxWaitTime(resources);
    if (result) {
      resultValueEl.hidden = false;
      messageEl.hidden = true;
      if (daysEl) daysEl.textContent = String(result.days);
      if (hoursEl) hoursEl.textContent = String(result.hours);
      if (minutesEl) minutesEl.textContent = String(result.minutes);
    } else {
      // Shouldn't reach here since we filtered, but handle gracefully
      resultValueEl.hidden = true;
      messageEl.hidden = false;
    }
  }, { signal: eventController.signal });
}
