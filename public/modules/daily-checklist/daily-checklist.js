/**
 * Daily Checklist Module
 *
 * A daily task checklist that:
 * - Persists checked state by stable item ID (not position or text)
 * - Resets daily at 08:00 with user confirmation
 * - Shows a reset prompt on next visit if the reset time passed while offline
 * - Has a manual reset button
 * - Supports tags/badges per item (inline, no line break)
 * - Supports the DemiDevimon Loop conditional section (toggle in-list)
 *
 * Module interface: init(container), destroy(), getState(), setState(state)
 */

import { t } from '/js/i18n.js';

const STORAGE_KEY = 'mod-checklist-state';
const RESET_HOUR = 8; // 08:00 local time

/**
 * Each item has a stable `id` that never changes even if text is corrected.
 * `i18nKey` references `modules.dailyChecklist.steps.<key>` in locale files.
 * Tags reference `modules.dailyChecklist.tags.<key>` for translated badge text.
 * `loopOnly: true` items only show when loop is active.
 * `elseOnly: true` items only show when loop is NOT active.
 * `loopRepeat: true` items are duplicated based on ticket count (1 per 2 tickets).
 */
const CHECKLIST_ITEMS = [
  { id: "collect-idle", i18nKey: "collectIdle", tags: [] },
  { id: "gacha-pull", i18nKey: "gachaPull", tags: [] },
  { id: "spend-combat-tickets", i18nKey: "spendCombatTickets", tags: ["pvp"] },
  { id: "spend-grandprix-tickets", i18nKey: "spendGrandprixTickets", tags: ["pvp"] },
  { id: "dimensional-house", i18nKey: "dimensionalHouse", tags: [] },
  { id: "hologram-auto", i18nKey: "hologramAuto", tags: [] },

  { id: "optional-x2-speed-1", i18nKey: "optionalX2Speed1", tags: ["opcional"] },
  { id: "optional-x2-speed-2", i18nKey: "optionalX2Speed2", tags: ["opcional"] },

  { id: "loop-toggle", type: "loopToggle" },

  { id: "loop-mission-demidev", i18nKey: "loopMissionDemidev", tags: ["mision"], loopOnly: true, loopRepeat: true },
  { id: "loop-mission-bakemon", i18nKey: "loopMissionBakemon", tags: ["mision"], loopOnly: true, loopRepeat: true },
  { id: "loop-mission-hologram50-1", i18nKey: "loopMissionHologram50", tags: ["mision"], loopOnly: true, loopRepeat: true },
  { id: "loop-mission-enemies50-1", i18nKey: "loopMissionEnemies50", tags: ["mision"], loopOnly: true, loopRepeat: true },
  { id: "loop-mission-skillcard35", i18nKey: "loopMissionSkillcard35", tags: ["mision"], loopOnly: true, loopRepeat: true },
  { id: "loop-mission-support35", i18nKey: "loopMissionSupport35", tags: ["mision"], loopOnly: true, loopRepeat: true },
  { id: "loop-mission-hologram50-2", i18nKey: "loopMissionHologram50", tags: ["mision"], loopOnly: true, loopRepeat: true },
  { id: "loop-mission-enemies100", i18nKey: "loopMissionEnemies100", tags: ["mision"], loopOnly: true, loopRepeat: true },
  { id: "loop-mission-phase", i18nKey: "loopMissionPhase", tags: ["mision"], loopOnly: true, loopRepeat: true },
  { id: "loop-mission-hologram50-3", i18nKey: "loopMissionHologram50", tags: ["mision"], loopOnly: true, loopRepeat: true },
  { id: "loop-mission-enemies50-2", i18nKey: "loopMissionEnemies50", tags: ["mision"], loopOnly: true, loopRepeat: true },
  { id: "loop-mission-skillcard35-2", i18nKey: "loopMissionSkillcard35", tags: ["mision"], loopOnly: true, loopRepeat: true },
  { id: "loop-mission-support35-2", i18nKey: "loopMissionSupport35", tags: ["mision"], loopOnly: true, loopRepeat: true },
  { id: "loop-mission-hologram50-4", i18nKey: "loopMissionHologram50", tags: ["mision"], loopOnly: true, loopRepeat: true },
  { id: "loop-mission-enemies100-2", i18nKey: "loopMissionEnemies100", tags: ["mision"], loopOnly: true, loopRepeat: true },

  { id: "else-demidev4", i18nKey: "elseDemidev4", tags: [], elseOnly: true },
  { id: "else-bakemon4", i18nKey: "elseBakemon4", tags: [], elseOnly: true },

  { id: "claim-4h-ads", i18nKey: "claim4hAds", tags: [] },
  { id: "free-emeralds-shop", i18nKey: "freeEmeraldsShop", tags: ["tienda"] },
  { id: "buy-skill-tickets", i18nKey: "buySkillTickets", tags: ["tienda"] },
  { id: "buy-support-tickets", i18nKey: "buySupportTickets", tags: ["tienda"] },
  { id: "buy-hologram500", i18nKey: "buyHologram500", tags: ["tienda"] },
  { id: "camp-register", i18nKey: "campRegister", tags: ["campamento"] },
  { id: "camp-support10", i18nKey: "campSupport10", tags: ["campamento"] },
  { id: "camp-piximon", i18nKey: "campPiximon", tags: ["campamento"] },
  { id: "camp-leomon", i18nKey: "campLeomon", tags: ["campamento"] },
  { id: "send-gifts", i18nKey: "sendGifts", tags: [] },
  { id: "daily-mail", i18nKey: "dailyMail", tags: [] },
  { id: "digifactory4", i18nKey: "digifactory4", tags: [] },
  { id: "network-defense4", i18nKey: "networkDefense4", tags: [] },
  { id: "metallic-sea4", i18nKey: "metallicSea4", tags: [] },
  { id: "equip-memories", i18nKey: "equipMemories", tags: [] },
  { id: "switch-99", i18nKey: "switch99", tags: [] },
  { id: "apocalymon", i18nKey: "apocalymon", tags: [] },
  { id: "combat-terminal-spend", i18nKey: "combatTerminalSpend", tags: ["pvp"] },
  { id: "buy-combat-tickets", i18nKey: "buyCombatTickets", tags: ["tienda", "pvp"] },
  { id: "combat-terminal-spend2", i18nKey: "combatTerminalSpend", tags: ["pvp"] },
  { id: "grandprix-spend", i18nKey: "grandprixSpend", tags: ["pvp"] },
  { id: "buy-hologram-bt", i18nKey: "buyHologramBt", tags: ["tienda", "pvp"] },
  { id: "daily-missions-reward", i18nKey: "dailyMissionsReward", tags: [] },
  { id: "check-passes", i18nKey: "checkPasses", tags: [] },
  { id: "camp-piximon-fight", i18nKey: "campPiximonFight", tags: ["campamento"] },
  { id: "camp-leomon-fight", i18nKey: "campLeomonFight", tags: ["campamento"] },
  { id: "spend-buddy-souls", i18nKey: "spendBuddySouls", tags: [] },
  { id: "spend-digichips", i18nKey: "spendDigichips", tags: [] },
  { id: "spend-digiplacas", i18nKey: "spendDigiplacas", tags: [] },

  { id: "check-gifts", i18nKey: "checkGifts", tags: [] },

  { id: "burn-hologram", i18nKey: "burnHologram", tags: ["quemaDeRecursos"] },
  { id: "burn-skillcard-ads", i18nKey: "burnSkillcardAds", tags: ["quemaDeRecursos"] },
  { id: "burn-support-ads", i18nKey: "burnSupportAds", tags: ["quemaDeRecursos"] },
  { id: "burn-emeralds-gacha", i18nKey: "burnEmeraldsGacha", tags: ["quemaDeRecursos"] },

  { id: "apocalymon-ranking", i18nKey: "apocalymonRanking", tags: [] },

  { id: "rank-missions", i18nKey: "rankMissions", tags: [] },

  { id: "optional-memory-game", i18nKey: "optionalMemoryGame", tags: ["opcional"] },
  { id: "optional-daily-bonus", i18nKey: "optionalDailyBonus", tags: ["opcional"] },

  { id: "dim-box-round1", i18nKey: "dimBoxRound1", tags: ["espera"] },
  { id: "dim-box-16h", i18nKey: "dimBox16h", tags: ["espera"] }
];

/** @type {Set<string>} */
let checkedItems = new Set();

/** @type {string|null} last access ISO timestamp */
let lastAccess = null;

/** @type {boolean} */
let loopActive = true;

/** @type {number} */
let ticketCount = 4;

/** @type {boolean} whether a reset has been dismissed this session */
let resetDismissed = false;

/** @type {boolean} whether to hide checked items */
let hideCompleted = true;

/** @type {HTMLElement|null} */
let containerEl = null;

/** @type {MutationObserver|null} */
let langObserver = null;

/**
 * Initialize the Daily Checklist module.
 * @param {HTMLElement} container
 */
export function init(container) {
  containerEl = container;
  loadFromStorage();
  bindEvents();
  checkDailyReset();
  render();
  updateProgress();
  saveLastAccess();
  observeLangChanges();
}

/**
 * Cleanup when module is unloaded.
 */
export function destroy() {
  if (langObserver) {
    langObserver.disconnect();
    langObserver = null;
  }
  containerEl = null;
}

/**
 * Returns the current state for in-memory preservation (router).
 */
export function getState() {
  return {
    checkedItems: [...checkedItems],
    lastAccess,
    loopActive,
    ticketCount,
    resetDismissed,
    hideCompleted
  };
}

/**
 * Restores a previously saved in-memory state.
 */
export function setState(state) {
  if (state) {
    checkedItems = new Set(state.checkedItems || []);
    lastAccess = state.lastAccess || null;
    loopActive = state.loopActive !== undefined ? state.loopActive : true;
    ticketCount = state.ticketCount || 4;
    resetDismissed = state.resetDismissed || false;
    hideCompleted = state.hideCompleted !== undefined ? state.hideCompleted : true;
    render();
    updateProgress();
  }
}

// --- Persistence ---

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      checkedItems = new Set(data.checkedItems || []);
      lastAccess = data.lastAccess || null;
      loopActive = data.loopActive !== undefined ? data.loopActive : true;
      ticketCount = data.ticketCount || 4;
      hideCompleted = data.hideCompleted !== undefined ? data.hideCompleted : true;
    }
  } catch (e) {
    console.warn('daily-checklist: failed to load state from localStorage', e);
  }
}

function saveToStorage() {
  try {
    const data = {
      checkedItems: [...checkedItems],
      lastAccess,
      loopActive,
      ticketCount,
      hideCompleted
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('daily-checklist: failed to save state to localStorage', e);
  }
}

function saveLastAccess() {
  lastAccess = new Date().toISOString();
  saveToStorage();
}

// --- Daily Reset Logic ---

function checkDailyReset() {
  if (!lastAccess) return;

  const now = new Date();
  const lastDate = new Date(lastAccess);

  const todayReset = new Date(now);
  todayReset.setHours(RESET_HOUR, 0, 0, 0);

  const relevantReset = now >= todayReset
    ? todayReset
    : new Date(todayReset.getTime() - 24 * 60 * 60 * 1000);

  if (lastDate < relevantReset && !resetDismissed) {
    showResetBanner();
  }
}

function showResetBanner() {
  if (!containerEl) return;
  const banner = containerEl.querySelector('#mod-checklist-reset-banner');
  if (banner) banner.classList.remove('mod-checklist-hidden');
}

function hideResetBanner() {
  if (!containerEl) return;
  const banner = containerEl.querySelector('#mod-checklist-reset-banner');
  if (banner) banner.classList.add('mod-checklist-hidden');
}

function performReset() {
  checkedItems.clear();
  resetDismissed = false;
  saveLastAccess();
  hideResetBanner();
  render();
  updateProgress();
}

// --- Event Binding ---

function bindEvents() {
  if (!containerEl) return;

  const resetBtn = containerEl.querySelector('#mod-checklist-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const msg = t('modules.dailyChecklist.confirmManualReset');
      if (confirm(msg)) {
        performReset();
      }
    });
  }

  const confirmReset = containerEl.querySelector('#mod-checklist-confirm-reset');
  if (confirmReset) {
    confirmReset.addEventListener('click', () => performReset());
  }

  const dismissReset = containerEl.querySelector('#mod-checklist-dismiss-reset');
  if (dismissReset) {
    dismissReset.addEventListener('click', () => {
      resetDismissed = true;
      hideResetBanner();
    });
  }

  const hideToggle = containerEl.querySelector('#mod-checklist-hide-completed');
  if (hideToggle) {
    hideToggle.checked = hideCompleted;
    hideToggle.addEventListener('change', (e) => {
      hideCompleted = e.target.checked;
      saveToStorage();
      render();
      updateProgress();
    });
  }
}

// --- Rendering ---

function getVisibleItems() {
  const items = [];
  const loopRepeatCount = Math.floor(ticketCount / 2);
  const loopRepeatItems = [];

  for (const item of CHECKLIST_ITEMS) {
    if (item.type === 'loopToggle') {
      items.push({ ...item, instanceId: item.id });
      continue;
    }

    if (item.loopOnly && !loopActive) continue;
    if (item.elseOnly && loopActive) continue;

    if (item.loopRepeat && loopActive) {
      loopRepeatItems.push(item);
    } else {
      if (loopRepeatItems.length > 0) {
        for (let cycle = 0; cycle < loopRepeatCount; cycle++) {
          for (const ri of loopRepeatItems) {
            items.push({ ...ri, instanceId: `${ri.id}__${cycle}` });
          }
        }
        loopRepeatItems.length = 0;
      }
      items.push({ ...item, instanceId: item.id });
    }
  }

  if (loopRepeatItems.length > 0) {
    for (let cycle = 0; cycle < loopRepeatCount; cycle++) {
      for (const ri of loopRepeatItems) {
        items.push({ ...ri, instanceId: `${ri.id}__${cycle}` });
      }
    }
  }

  return items;
}

/**
 * Resolves the display text for an item via i18n.
 */
function getItemText(item) {
  if (item.i18nKey) {
    return t(`modules.dailyChecklist.steps.${item.i18nKey}`);
  }
  return item.id;
}

/**
 * Resolves the display text for a tag via i18n.
 */
function getTagText(tagKey) {
  return t(`modules.dailyChecklist.tags.${tagKey}`);
}

function render() {
  if (!containerEl) return;

  const listEl = containerEl.querySelector('#mod-checklist-list');
  if (!listEl) return;

  listEl.innerHTML = '';
  const visibleItems = getVisibleItems();

  for (const item of visibleItems) {
    // Section dividers
    if (item.type === 'section') {
      const sectionEl = document.createElement('div');
      sectionEl.className = `mod-checklist-section mod-checklist-section-${item.sectionType}`;
      sectionEl.textContent = getItemText(item);
      listEl.appendChild(sectionEl);
      continue;
    }

    // Loop toggle (in-list)
    if (item.type === 'loopToggle') {
      const toggleEl = document.createElement('div');
      toggleEl.className = 'mod-checklist-loop-toggle';

      const label = document.createElement('label');
      label.className = 'mod-checklist-checkbox-label';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'mod-checklist-check';
      checkbox.checked = loopActive;
      checkbox.addEventListener('change', (e) => {
        loopActive = e.target.checked;
        saveToStorage();
        render();
        updateProgress();
      });

      const text = document.createElement('span');
      text.className = 'mod-checklist-loop-label';
      text.textContent = t('modules.dailyChecklist.loopActive');

      label.appendChild(checkbox);
      label.appendChild(text);
      toggleEl.appendChild(label);

      if (loopActive) {
        const ticketRow = document.createElement('div');
        ticketRow.className = 'mod-checklist-loop-ticket-row';

        const ticketLabel = document.createElement('span');
        ticketLabel.className = 'mod-checklist-loop-ticket-label';
        ticketLabel.textContent = t('modules.dailyChecklist.loopTickets');

        const ticketInput = document.createElement('input');
        ticketInput.type = 'number';
        ticketInput.className = 'mod-checklist-input';
        ticketInput.min = '2';
        ticketInput.value = String(ticketCount);
        ticketInput.addEventListener('change', (e) => {
          ticketCount = Math.max(2, parseInt(e.target.value, 10) || 4);
          saveToStorage();
          render();
          updateProgress();
        });

        ticketRow.appendChild(ticketLabel);
        ticketRow.appendChild(ticketInput);
        toggleEl.appendChild(ticketRow);
      }

      listEl.appendChild(toggleEl);
      continue;
    }

    // Normal checklist item
    const itemEl = document.createElement('div');
    const isChecked = checkedItems.has(item.instanceId);

    // Hide completed items if the option is enabled
    if (isChecked && hideCompleted) continue;

    itemEl.className = 'mod-checklist-item' + (isChecked ? ' mod-checklist-item-checked' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'mod-checklist-check';
    checkbox.checked = isChecked;
    checkbox.addEventListener('change', () => {
      toggleItem(item.instanceId);
    });

    const content = document.createElement('div');
    content.className = 'mod-checklist-item-content';

    const textRow = document.createElement('span');
    textRow.className = 'mod-checklist-item-text';

    // Inline badges before text
    if (item.tags && item.tags.length > 0) {
      for (const tag of item.tags) {
        const badge = document.createElement('span');
        badge.className = `mod-checklist-badge mod-checklist-badge-${getBadgeClass(tag)}`;
        badge.textContent = getTagText(tag);
        textRow.appendChild(badge);
      }
    }

    const textNode = document.createTextNode(getItemText(item));
    textRow.appendChild(textNode);

    content.appendChild(textRow);
    itemEl.appendChild(checkbox);
    itemEl.appendChild(content);

    itemEl.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        toggleItem(item.instanceId);
      }
    });

    listEl.appendChild(itemEl);
  }

  // Update last access display
  const lastAccessEl = containerEl.querySelector('#mod-checklist-last-access');
  if (lastAccessEl && lastAccess) {
    const d = new Date(lastAccess);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = d.toLocaleDateString();
    lastAccessEl.textContent = `${t('modules.dailyChecklist.lastAccess')}: ${dateStr} ${timeStr}`;
  }

  // Update i18n texts in static HTML parts
  const resetBtnText = containerEl.querySelector('#mod-checklist-reset-btn [data-i18n]');
  if (resetBtnText) resetBtnText.textContent = t(resetBtnText.getAttribute('data-i18n'));

  const bannerI18n = containerEl.querySelectorAll('#mod-checklist-reset-banner [data-i18n]');
  for (const el of bannerI18n) {
    el.textContent = t(el.getAttribute('data-i18n'));
  }

  // Update hide toggle state and label
  const hideToggle = containerEl.querySelector('#mod-checklist-hide-completed');
  if (hideToggle) hideToggle.checked = hideCompleted;
  const hideLabel = containerEl.querySelector('.mod-checklist-hide-toggle [data-i18n]');
  if (hideLabel) hideLabel.textContent = t(hideLabel.getAttribute('data-i18n'));
}

function toggleItem(instanceId) {
  if (checkedItems.has(instanceId)) {
    checkedItems.delete(instanceId);
  } else {
    checkedItems.add(instanceId);
  }
  saveToStorage();
  render();
  updateProgress();
}

function updateProgress() {
  if (!containerEl) return;
  const progressEl = containerEl.querySelector('#mod-checklist-progress');
  if (!progressEl) return;

  const visibleItems = getVisibleItems().filter(i => !i.type);
  const total = visibleItems.length;
  const done = visibleItems.filter(i => checkedItems.has(i.instanceId)).length;
  progressEl.textContent = `${done}/${total}`;
}

function getBadgeClass(tagKey) {
  const map = {
    'mision': 'mision',
    'quemaDeRecursos': 'quema',
    'tienda': 'tienda',
    'campamento': 'campamento',
    'pvp': 'pvp',
    'opcional': 'opcional',
    'espera': 'espera'
  };
  return map[tagKey] || 'mision';
}

/**
 * Observes changes to <html lang="..."> to re-render UI texts on language change.
 */
function observeLangChanges() {
  langObserver = new MutationObserver(() => {
    render();
    updateProgress();
  });
  langObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang']
  });
}
