/**
 * MeetingMode Popup Controller
 * Manages Master Shield toggle, auto-detection heuristics,
 * mode switching (Blur vs Scramble), and live tab telemetry.
 */

let currentSettings = {
  isEnabled: false,
  shieldScope: "window", // "tab" | "window" | "global"
  armedTabIds: [],
  armedWindowIds: [],
  maskMode: "blur",
  maskFinancials: true,
  maskEmails: true,
  maskSecrets: true,
  maskNumbers: false,
  maskMessages: true,
  maskAvatars: true,
  maskInputs: true,
  cloakTabs: true,
  protectClipboard: true,
  domainOverrides: {},
  theme: "dark"
};

let activeTabId = null;
let activeWindowId = null;

document.addEventListener("DOMContentLoaded", async () => {
  await initActiveTab();
  await loadSettings();
  initEventListeners();
});

/**
 * Loads settings from local storage and reflects in UI
 */
async function loadSettings() {
  try {
    const res = await chrome.storage.local.get("meetingModeSettings");
    if (res && res.meetingModeSettings) {
      currentSettings = Object.assign(currentSettings, res.meetingModeSettings);
    }
  } catch (err) {
    // Storage fallback
  }

  applyTheme(currentSettings.theme || "dark");
  renderUI();
}

/**
 * Renders UI based on current settings and active scope context
 */
function renderUI() {
  // Determine if active context (current tab, window, or global) is armed
  let isArmed = false;
  if (currentSettings.shieldScope === "tab") {
    isArmed = activeTabId ? (currentSettings.armedTabIds || []).includes(activeTabId) : false;
  } else if (currentSettings.shieldScope === "window") {
    isArmed = activeWindowId ? (currentSettings.armedWindowIds || []).includes(activeWindowId) : false;
  } else {
    isArmed = !!currentSettings.isEnabled;
  }

  // Master Switch Card
  const masterCard = document.getElementById("card-master-switch");
  const masterToggle = document.getElementById("master-toggle-btn");
  const masterTitle = document.getElementById("master-title");
  const masterDesc = document.getElementById("master-desc");
  const statusPill = document.getElementById("shield-status-pill");

  if (masterCard) {
    if (isArmed) {
      masterCard.classList.add("armed");
      masterTitle.textContent = "Screen Shield: ARMED";
      if (currentSettings.shieldScope === "tab") {
        masterDesc.textContent = "Active tab cloaked (other tabs in this window stay clean)";
      } else if (currentSettings.shieldScope === "window") {
        masterDesc.textContent = "Active window cloaked (notes safe on 2nd monitor)";
      } else {
        masterDesc.textContent = "Sensitive data cloaked across all windows & monitors";
      }
      statusPill.textContent = "ARMED";
      statusPill.className = "status-pill pill-armed";
      masterToggle.setAttribute("aria-checked", "true");
    } else {
      masterCard.classList.remove("armed");
      masterTitle.textContent = "Screen Shield: OFF";
      if (currentSettings.shieldScope === "tab") {
        masterDesc.textContent = "Click to arm privacy cloak on this active tab only";
      } else if (currentSettings.shieldScope === "window") {
        masterDesc.textContent = "Click to arm privacy cloak on active presentation window";
      } else {
        masterDesc.textContent = "Click to arm privacy cloak across all windows";
      }
      statusPill.textContent = "STANDBY";
      statusPill.className = "status-pill pill-off";
      masterToggle.setAttribute("aria-checked", "false");
    }
  }

  // 3-Way Shield Scope Segment Buttons (Tab | Window | All)
  const scopeTabBtn = document.getElementById("btn-scope-tab");
  const scopeWindowBtn = document.getElementById("btn-scope-window");
  const scopeGlobalBtn = document.getElementById("btn-scope-global");
  scopeTabBtn?.classList.toggle("active", currentSettings.shieldScope === "tab");
  scopeWindowBtn?.classList.toggle("active", currentSettings.shieldScope === "window");
  scopeGlobalBtn?.classList.toggle("active", currentSettings.shieldScope === "global");

  // 3-Way Mode Segment Buttons (Blur vs Lockdown vs Scramble)
  const blurBtn = document.getElementById("btn-mode-blur");
  const lockdownBtn = document.getElementById("btn-mode-lockdown");
  const scrambleBtn = document.getElementById("btn-mode-scramble");
  const isLockdown = currentSettings.maskMode === "lockdown";
  const isScramble = currentSettings.maskMode === "scramble";
  const isBlur = !isLockdown && !isScramble;

  blurBtn?.classList.toggle("active", isBlur);
  lockdownBtn?.classList.toggle("active", isLockdown);
  scrambleBtn?.classList.toggle("active", isScramble);

  // Telemetry Peek Hint
  const peekHintEl = document.querySelector(".telemetry-peek-hint span:last-child");
  if (peekHintEl) {
    if (isLockdown) {
      peekHintEl.textContent = "Lockdown: Hold Alt to peek";
    } else if (isScramble) {
      peekHintEl.textContent = "Hover item to reveal real data";
    } else {
      peekHintEl.textContent = "Hover item to peek";
    }
  }

  // Checkbox Filters
  setChecked("filter-financials", currentSettings.maskFinancials !== false);
  setChecked("filter-emails", currentSettings.maskEmails !== false);
  setChecked("filter-secrets", currentSettings.maskSecrets !== false);
  setChecked("filter-numbers", currentSettings.maskNumbers === true);
  setChecked("filter-avatars", currentSettings.maskAvatars !== false);
  setChecked("filter-inputs", currentSettings.maskInputs !== false);
  setChecked("filter-spotlight", currentSettings.spotlightMode === true);
  setChecked("filter-messages", currentSettings.maskMessages !== false);
  setChecked("toggle-cloak-tabs", currentSettings.cloakTabs !== false);
  setChecked("toggle-protect-clipboard", currentSettings.protectClipboard !== false);
  setChecked("toggle-notifications", currentSettings.silenceNotifications !== false);
  setChecked("toggle-floating-dock", currentSettings.showFloatingBadge !== false);

  // Preset Buttons
  document.getElementById("popup-preset-demo")?.classList.toggle("active", currentSettings.maskMode === "scramble");
  document.getElementById("popup-preset-meeting")?.classList.toggle("active", (currentSettings.maskMode === "blur" || currentSettings.maskMode === "lockdown") && !currentSettings.spotlightMode);
  document.getElementById("popup-preset-loom")?.classList.toggle("active", currentSettings.spotlightMode === true);
}

function setChecked(id, bool) {
  const el = document.getElementById(id);
  if (el) el.checked = bool;
}

let currentHost = "";

/**
 * Connects with the active browser tab to get live telemetry
 */
async function initActiveTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || !tabs[0]) return;
    const tab = tabs[0];
    activeTabId = tab.id;
    activeWindowId = tab.windowId;

    const domainEl = document.getElementById("current-tab-domain");
    if (domainEl && tab.url) {
      try {
        const u = new URL(tab.url);
        currentHost = u.hostname || "";
        domainEl.textContent = u.hostname || "Active Page";
      } catch (e) {
        currentHost = "";
        domainEl.textContent = "Internal Page";
      }
    }

    // Query content script for live shielded element count and custom overrides
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, { type: "GET_STATS" }, (response) => {
        if (chrome.runtime.lastError || !response) {
          updateCountBadge(0);
          updateCustomSiteRulesUI(0);
        } else {
          updateCountBadge(response.count || 0);
          updateCustomSiteRulesUI(response.customCount || 0);
        }
      });
    }
  } catch (err) {
    // Active tab fallback
  }
}

function updateCountBadge(count) {
  const badge = document.getElementById("masked-count-badge");
  if (badge) {
    badge.textContent = `${count} ${count === 1 ? "item" : "items"}`;
  }
}

function updateCustomSiteRulesUI(customCount) {
  const row = document.getElementById("site-custom-rules-row");
  const countSpan = document.getElementById("site-custom-count");
  if (!row || !countSpan) return;

  if (customCount > 0) {
    countSpan.textContent = customCount;
    row.classList.remove("hidden");
  } else {
    row.classList.add("hidden");
  }
}

/**
 * Initializes all click and toggle listeners
 */
function initEventListeners() {
  // View Tab Switcher (Shield vs Tools)
  const tabNavShield = document.getElementById("tab-nav-shield");
  const tabNavTools = document.getElementById("tab-nav-tools");
  const viewShield = document.getElementById("view-shield");
  const viewTools = document.getElementById("view-tools");

  tabNavShield?.addEventListener("click", () => {
    tabNavShield.classList.add("active");
    tabNavTools?.classList.remove("active");
    viewShield?.classList.remove("hidden");
    viewTools?.classList.add("hidden");
  });

  tabNavTools?.addEventListener("click", () => {
    tabNavTools.classList.add("active");
    tabNavShield?.classList.remove("active");
    viewTools?.classList.remove("hidden");
    viewShield?.classList.add("hidden");
  });

  // Master Switch Card Click
  document.getElementById("card-master-switch")?.addEventListener("click", toggleMasterShield);

  // Prevent clicks inside sub-controls strip from bubbling up to master card toggle
  document.getElementById("master-sub-controls")?.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // 3-Way Shield Scope Segment Buttons (with stopPropagation)
  document.getElementById("btn-scope-tab")?.addEventListener("click", async (e) => {
    e.stopPropagation();
    currentSettings.shieldScope = "tab";
    if (currentSettings.isEnabled && activeTabId) {
      if (!currentSettings.armedTabIds) currentSettings.armedTabIds = [];
      if (!currentSettings.armedTabIds.includes(activeTabId)) currentSettings.armedTabIds.push(activeTabId);
    }
    renderUI();
    await saveSettings();
    notifyContentScripts();
  });

  document.getElementById("btn-scope-window")?.addEventListener("click", async (e) => {
    e.stopPropagation();
    currentSettings.shieldScope = "window";
    if (currentSettings.isEnabled && activeWindowId) {
      if (!currentSettings.armedWindowIds) currentSettings.armedWindowIds = [];
      if (!currentSettings.armedWindowIds.includes(activeWindowId)) currentSettings.armedWindowIds.push(activeWindowId);
    }
    renderUI();
    await saveSettings();
    notifyContentScripts();
  });

  document.getElementById("btn-scope-global")?.addEventListener("click", async (e) => {
    e.stopPropagation();
    currentSettings.shieldScope = "global";
    renderUI();
    await saveSettings();
    notifyContentScripts();
  });

  // Segment Mode Buttons (with stopPropagation)
  document.getElementById("btn-mode-blur")?.addEventListener("click", (e) => {
    e.stopPropagation();
    setMaskMode("blur");
  });
  document.getElementById("btn-mode-lockdown")?.addEventListener("click", (e) => {
    e.stopPropagation();
    setMaskMode("lockdown");
  });
  document.getElementById("btn-mode-scramble")?.addEventListener("click", (e) => {
    e.stopPropagation();
    setMaskMode("scramble");
  });

  // Auto Heuristic Checkboxes
  bindCheckbox("filter-financials", "maskFinancials");
  bindCheckbox("filter-emails", "maskEmails");
  bindCheckbox("filter-secrets", "maskSecrets");
  bindCheckbox("filter-numbers", "maskNumbers");
  bindCheckbox("filter-avatars", "maskAvatars");
  bindCheckbox("filter-inputs", "maskInputs");
  bindCheckbox("filter-spotlight", "spotlightMode");
  bindCheckbox("filter-messages", "maskMessages");
  bindCheckbox("toggle-cloak-tabs", "cloakTabs");
  bindCheckbox("toggle-protect-clipboard", "protectClipboard");
  bindCheckbox("toggle-notifications", "silenceNotifications");
  bindCheckbox("toggle-floating-dock", "showFloatingBadge");

  // Preset Buttons
  document.getElementById("popup-preset-demo")?.addEventListener("click", async () => {
    armCurrentScope();
    currentSettings.maskMode = "scramble";
    currentSettings.maskFinancials = true;
    currentSettings.maskAvatars = true;
    currentSettings.maskMessages = true;
    currentSettings.spotlightMode = false;
    renderUI();
    await saveSettings();
    notifyContentScripts();
  });

  document.getElementById("popup-preset-meeting")?.addEventListener("click", async () => {
    armCurrentScope();
    currentSettings.maskMode = "lockdown";
    currentSettings.maskMessages = true;
    currentSettings.maskAvatars = true;
    currentSettings.silenceNotifications = true;
    currentSettings.cloakTabs = true;
    currentSettings.spotlightMode = false;
    renderUI();
    await saveSettings();
    notifyContentScripts();
  });

  document.getElementById("popup-preset-loom")?.addEventListener("click", async () => {
    armCurrentScope();
    currentSettings.maskMode = "blur";
    currentSettings.maskSecrets = true;
    currentSettings.maskFinancials = true;
    currentSettings.cloakTabs = true;
    currentSettings.spotlightMode = true;
    renderUI();
    await saveSettings();
    notifyContentScripts();
  });

  // Emergency Panic Curtain Trigger
  document.getElementById("btn-panic-curtain")?.addEventListener("click", () => {
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, { type: "TOGGLE_PANIC" }, () => {
        window.close();
      });
    }
  });

  // Element Picker Trigger
  document.getElementById("btn-start-picker")?.addEventListener("click", () => {
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, { type: "START_PICKER" }, () => {
        if (chrome.runtime.lastError) {
          alert("Cannot shield elements on this browser internal page.");
        } else {
          window.close(); // Close popup so user can target element on page
        }
      });
    }
  });

  // Clear All Custom Blocks for Current Site
  document.getElementById("btn-clear-site-custom")?.addEventListener("click", async () => {
    if (activeTabId && currentHost) {
      if (currentSettings.domainOverrides && currentSettings.domainOverrides[currentHost]) {
        delete currentSettings.domainOverrides[currentHost];
        await saveSettings();
      }

      chrome.tabs.sendMessage(activeTabId, { type: "CLEAR_DOMAIN_CUSTOM" }, () => {
        updateCustomSiteRulesUI(0);
      });
    }
  });

  // Theme Toggle Button
  document.getElementById("btn-theme-toggle")?.addEventListener("click", () => {
    const nextTheme = currentSettings.theme === "dark" ? "light" : "dark";
    currentSettings.theme = nextTheme;
    applyTheme(nextTheme);
    saveSettings();
  });

  // Options Portal Button
  document.getElementById("btn-open-options")?.addEventListener("click", () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options.html"));
    }
  });
}

function bindCheckbox(id, settingKey) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("change", (e) => {
    currentSettings[settingKey] = e.target.checked;
    saveSettings();
    notifyContentScripts();
  });
}

function armCurrentScope() {
  currentSettings.isEnabled = true;
  if (currentSettings.shieldScope === "tab" && activeTabId) {
    if (!currentSettings.armedTabIds) currentSettings.armedTabIds = [];
    if (!currentSettings.armedTabIds.includes(activeTabId)) {
      currentSettings.armedTabIds.push(activeTabId);
    }
  } else if (currentSettings.shieldScope === "window" && activeWindowId) {
    if (!currentSettings.armedWindowIds) currentSettings.armedWindowIds = [];
    if (!currentSettings.armedWindowIds.includes(activeWindowId)) {
      currentSettings.armedWindowIds.push(activeWindowId);
    }
  }
}

async function toggleMasterShield() {
  if (!activeTabId || !activeWindowId) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        activeTabId = tab.id;
        activeWindowId = tab.windowId;
      }
    } catch (e) {}
  }

  if (currentSettings.shieldScope === "tab") {
    let armedTabs = currentSettings.armedTabIds || [];
    const isCurrentlyArmed = activeTabId ? armedTabs.includes(activeTabId) : false;

    if (isCurrentlyArmed) {
      armedTabs = armedTabs.filter(id => id !== activeTabId);
    } else if (activeTabId) {
      armedTabs.push(activeTabId);
    }

    currentSettings.armedTabIds = armedTabs;
    currentSettings.isEnabled = armedTabs.length > 0;
  } else if (currentSettings.shieldScope === "window") {
    let armedList = currentSettings.armedWindowIds || [];
    const isCurrentlyArmed = activeWindowId ? armedList.includes(activeWindowId) : false;

    if (isCurrentlyArmed) {
      armedList = armedList.filter(id => id !== activeWindowId);
    } else if (activeWindowId) {
      armedList.push(activeWindowId);
    }

    currentSettings.armedWindowIds = armedList;
    currentSettings.isEnabled = armedList.length > 0;
  } else {
    currentSettings.isEnabled = !currentSettings.isEnabled;
  }

  renderUI();
  await saveSettings();
  notifyContentScripts();

  // Re-query stats after a brief moment to update count
  setTimeout(() => {
    if (activeTabId) {
      chrome.tabs.sendMessage(activeTabId, { type: "GET_STATS" }, (res) => {
        if (!chrome.runtime.lastError && res) {
          updateCountBadge(res.count || 0);
        }
      });
    }
  }, 180);
}

function setMaskMode(mode) {
  currentSettings.maskMode = mode;
  renderUI();
  saveSettings();
  notifyContentScripts();
}

async function saveSettings() {
  try {
    await chrome.storage.local.set({ meetingModeSettings: currentSettings });
  } catch (err) {
    // Storage fallback
  }
}

function notifyContentScripts() {
  // Sync to background service worker for badge and scope-state routing
  chrome.runtime.sendMessage({
    type: "STATE_CHANGED",
    settings: currentSettings
  }, () => {
    if (chrome.runtime.lastError) {}
  });

  // Broadcast scope-aware state to all tabs
  chrome.tabs.query({}, (tabs) => {
    const armedTabs = new Set(currentSettings.armedTabIds || []);
    const armedWindows = new Set(currentSettings.armedWindowIds || []);

    for (const tab of tabs) {
      if (tab.id && tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://")) {
        let tabIsEnabled = false;
        if (currentSettings.shieldScope === "global") {
          tabIsEnabled = currentSettings.isEnabled;
        } else if (currentSettings.shieldScope === "tab") {
          tabIsEnabled = armedTabs.has(tab.id);
        } else {
          tabIsEnabled = armedWindows.has(tab.windowId);
        }

        const payload = Object.assign({}, currentSettings, { isEnabled: tabIsEnabled });
        chrome.tabs.sendMessage(tab.id, {
          type: "STATE_CHANGED",
          settings: payload
        }, () => {
          if (chrome.runtime.lastError) {
            // Ignored
          }
        });
      }
    }
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const sun = document.getElementById("icon-sun");
  const moon = document.getElementById("icon-moon");

  if (theme === "light") {
    sun?.classList.remove("hidden");
    moon?.classList.add("hidden");
  } else {
    sun?.classList.add("hidden");
    moon?.classList.remove("hidden");
  }
}
