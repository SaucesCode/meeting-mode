/**
 * MeetingMode Service Worker (Background)
 * Coordinates global shield state, keyboard shortcuts, toolbar badge indicators,
 * and broadcast synchronization across open browser tabs.
 */

const DEFAULT_SETTINGS = {
  isEnabled: false,
  shieldScope: "window", // "tab" (Single active tab) | "window" (Active presentation window) | "global" (All windows/monitors)
  armedTabIds: [], // Tab IDs where shield is active (when scope === "tab")
  armedWindowIds: [], // Window IDs where shield is currently active
  maskMode: "blur", // "blur" | "scramble"
  maskFinancials: true,
  maskEmails: true,
  maskSecrets: true,
  maskNumbers: false,
  maskMessages: true,
  maskAvatars: true, // Auto-mask user avatars & profile photos
  maskInputs: true, // Auto-mask prefilled form inputs (ghost inputs)
  autoArmOnMeetings: false, // Default to FALSE so shield never arms unexpectedly
  alwaysCloakedDomains: ["stripe.com", "paypal.com", "quickbooks.intuit.com"],
  silenceNotifications: true, // Suppress web notification popups & audio chimes while armed
  spotlightMode: false, // Presentation Spotlight beam mode
  dockPosition: null, // Draggable floating dock coords { left, top }
  cloakTabs: true,
  protectClipboard: true, // Auto-redacts masked PII, secrets, and financials from clipboard buffer
  showFloatingBadge: true,
  domainOverrides: {},
  customKeywords: [],
  theme: "dark"
};

const MEETING_DOMAINS = [
  "meet.google.com",
  "zoom.us",
  "teams.microsoft.com",
  "loom.com",
  "webex.com",
  "chime.aws",
  "around.co"
];

// Initialize settings on installation or reload
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const existing = await chrome.storage.local.get("meetingModeSettings");
    let current = existing?.meetingModeSettings || DEFAULT_SETTINGS;
    // Clean out stale armed IDs and ensure autoArmOnMeetings defaults to false
    current.autoArmOnMeetings = false;
    current.armedTabIds = [];
    current.armedWindowIds = [];
    current.isEnabled = false;
    if (current.alwaysCloakedDomains) {
      current.alwaysCloakedDomains = current.alwaysCloakedDomains.filter(d => d && !d.includes("discord.com"));
    }
    await chrome.storage.local.set({ meetingModeSettings: current });
    await updateBadgeForActiveTab(current);
  } catch (err) {
    // Storage fallback
  }
});

// Sync badge state and clear dead IDs on browser startup
chrome.runtime.onStartup.addListener(async () => {
  const settings = await getSettings();
  settings.armedTabIds = [];
  settings.armedWindowIds = [];
  settings.isEnabled = false;
  await chrome.storage.local.set({ meetingModeSettings: settings });
  await updateBadgeForActiveTab(settings);
});

// Keyboard Commands (Alt+Shift+M, Alt+Shift+S, Alt+Shift+P, Alt+Shift+B)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-shield") {
    const settings = await getSettings();
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentWindowId = activeTab?.windowId;
    const currentTabId = activeTab?.id;

    if (settings.shieldScope === "tab" && currentTabId) {
      let armedTabs = settings.armedTabIds || [];
      const isCurrentlyArmed = armedTabs.includes(currentTabId);

      if (isCurrentlyArmed) {
        armedTabs = armedTabs.filter(id => id !== currentTabId);
      } else {
        armedTabs.push(currentTabId);
      }

      settings.armedTabIds = armedTabs;
      settings.isEnabled = armedTabs.length > 0;
      await chrome.storage.local.set({ meetingModeSettings: settings });
      updateBadge(!isCurrentlyArmed);
      broadcastScopeAware(settings);
    } else if (settings.shieldScope === "window" && currentWindowId) {
      let armedList = settings.armedWindowIds || [];
      const isCurrentlyArmed = armedList.includes(currentWindowId);

      if (isCurrentlyArmed) {
        armedList = armedList.filter(id => id !== currentWindowId);
      } else {
        armedList.push(currentWindowId);
      }

      settings.armedWindowIds = armedList;
      settings.isEnabled = armedList.length > 0;
      await chrome.storage.local.set({ meetingModeSettings: settings });
      updateBadge(!isCurrentlyArmed);
      broadcastScopeAware(settings);
    } else {
      settings.isEnabled = !settings.isEnabled;
      await chrome.storage.local.set({ meetingModeSettings: settings });
      updateBadge(settings.isEnabled);
      broadcastScopeAware(settings);
    }
  }

  if (command === "pick-element") {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "START_PICKER" }, () => {
        if (chrome.runtime.lastError) {
          // Tab not scriptable
        }
      });
    }
  }

  if (command === "toggle-spotlight") {
    const settings = await getSettings();
    settings.spotlightMode = !settings.spotlightMode;
    await chrome.storage.local.set({ meetingModeSettings: settings });
    broadcastToAllTabs({ type: "SPOTLIGHT_TOGGLED", spotlightMode: settings.spotlightMode });
  }

  if (command === "panic-curtain") {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "TOGGLE_PANIC" }, () => {
        if (chrome.runtime.lastError) {
          // Tab not scriptable
        }
      });
    }
  }
});

// Runtime Message Listener (Synchronizes scope-aware state from popup & HUD)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_TAB_SHIELD_STATE") {
    (async () => {
      const settings = await getSettings();
      const tabId = sender.tab?.id;
      const windowId = sender.tab?.windowId;
      let tabIsEnabled = false;

      if (settings.shieldScope === "global") {
        tabIsEnabled = !!settings.isEnabled;
      } else if (settings.shieldScope === "tab") {
        tabIsEnabled = tabId ? (settings.armedTabIds || []).includes(tabId) : false;
      } else {
        tabIsEnabled = windowId ? (settings.armedWindowIds || []).includes(windowId) : false;
      }

      const tabSettings = Object.assign({}, settings, { isEnabled: tabIsEnabled });
      sendResponse({
        settings: tabSettings,
        tabId,
        windowId
      });
    })();
    return true;
  }

  if (message.type === "STATE_CHANGED") {
    (async () => {
      const incoming = message.settings;
      if (incoming) {
        // If sent from an in-page content script dock/panel
        if (sender.tab) {
          if (incoming.shieldScope === "tab" && sender.tab.id) {
            let armedTabs = incoming.armedTabIds || [];
            if (incoming.isEnabled && !armedTabs.includes(sender.tab.id)) {
              armedTabs.push(sender.tab.id);
            } else if (!incoming.isEnabled && armedTabs.includes(sender.tab.id)) {
              armedTabs = armedTabs.filter(id => id !== sender.tab.id);
            }
            incoming.armedTabIds = armedTabs;
            incoming.isEnabled = armedTabs.length > 0;
          } else if (incoming.shieldScope === "window" && sender.tab.windowId) {
            let armedList = incoming.armedWindowIds || [];
            if (incoming.isEnabled && !armedList.includes(sender.tab.windowId)) {
              armedList.push(sender.tab.windowId);
            } else if (!incoming.isEnabled && armedList.includes(sender.tab.windowId)) {
              armedList = armedList.filter(id => id !== sender.tab.windowId);
            }
            incoming.armedWindowIds = armedList;
            incoming.isEnabled = armedList.length > 0;
          }
        }

        await chrome.storage.local.set({ meetingModeSettings: incoming });
        await updateBadgeForActiveTab(incoming);
        broadcastScopeAware(incoming);
      }
      sendResponse({ success: true });
    })();
    return true;
  }
});

// Update badge when user switches active tab (Tab Scope Aware)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const settings = await getSettings();
  if (settings.shieldScope === "tab") {
    const isArmed = (settings.armedTabIds || []).includes(activeInfo.tabId);
    updateBadge(isArmed);
  } else if (settings.shieldScope === "window") {
    const isArmed = (settings.armedWindowIds || []).includes(activeInfo.windowId);
    updateBadge(isArmed);
  } else {
    updateBadge(settings.isEnabled);
  }
});

// Update badge when focus moves between different monitors/windows
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const settings = await getSettings();
  if (settings.shieldScope === "tab") {
    const [activeTab] = await chrome.tabs.query({ active: true, windowId: windowId });
    const isArmed = activeTab ? (settings.armedTabIds || []).includes(activeTab.id) : false;
    updateBadge(isArmed);
  } else if (settings.shieldScope === "window") {
    const isArmed = (settings.armedWindowIds || []).includes(windowId);
    updateBadge(isArmed);
  } else {
    updateBadge(settings.isEnabled);
  }
});

// Clean up closed tabs from armed tab list
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const settings = await getSettings();
  if (settings.armedTabIds && settings.armedTabIds.includes(tabId)) {
    settings.armedTabIds = settings.armedTabIds.filter(id => id !== tabId);
    if (settings.shieldScope === "tab") {
      settings.isEnabled = settings.armedTabIds.length > 0;
    }
    await chrome.storage.local.set({ meetingModeSettings: settings });
    await updateBadgeForActiveTab(settings);
  }
});

// Clean up closed windows from armed window list
chrome.windows.onRemoved.addListener(async (windowId) => {
  const settings = await getSettings();
  if (settings.armedWindowIds && settings.armedWindowIds.includes(windowId)) {
    settings.armedWindowIds = settings.armedWindowIds.filter(id => id !== windowId);
    if (settings.shieldScope === "window") {
      settings.isEnabled = settings.armedWindowIds.length > 0;
    }
    await chrome.storage.local.set({ meetingModeSettings: settings });
    await updateBadgeForActiveTab(settings);
  }
});

// Update badge and Auto-Arm when tabs refresh or navigate
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab && tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://")) {
    const settings = await getSettings();
    const url = tab.url.toLowerCase();

    // Check Auto-Arming on Meeting Apps or Always-Cloaked Domains (Strict opt-in: only when autoArmOnMeetings === true)
    if (settings.autoArmOnMeetings === true && !settings.isEnabled) {
      const isMeetingApp = MEETING_DOMAINS.some(d => url.includes(d));
      const isAlwaysCloaked = (settings.alwaysCloakedDomains || []).some(d => d && url.includes(d.toLowerCase()));

      if (isMeetingApp || isAlwaysCloaked) {
        settings.isEnabled = true;
        if (settings.shieldScope === "tab" && tab.id) {
          settings.armedTabIds = Array.from(new Set([...(settings.armedTabIds || []), tab.id]));
        } else if (settings.shieldScope === "window" && tab.windowId) {
          settings.armedWindowIds = Array.from(new Set([...(settings.armedWindowIds || []), tab.windowId]));
        }
        await chrome.storage.local.set({ meetingModeSettings: settings });
        await updateBadgeForActiveTab(settings);
        broadcastScopeAware(settings);
        return;
      }
    }

    let shouldBeArmed = false;
    if (settings.shieldScope === "global") {
      shouldBeArmed = !!settings.isEnabled;
    } else if (settings.shieldScope === "tab") {
      shouldBeArmed = (settings.armedTabIds || []).includes(tabId);
    } else {
      shouldBeArmed = (settings.armedWindowIds || []).includes(tab.windowId);
    }

    // Always inform the tab of its authoritative state (arms if true, disarms if false)
    const payload = Object.assign({}, settings, { isEnabled: shouldBeArmed });
    chrome.tabs.sendMessage(tabId, { type: "STATE_CHANGED", settings: payload }, () => {
      if (chrome.runtime.lastError) {
        // Ignore unscriptable pages
      }
    });
  }
});

/**
 * Updates extension action badge for the currently active tab in active window
 */
async function updateBadgeForActiveTab(settings) {
  try {
    const s = settings || await getSettings();
    const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!activeTab) {
      updateBadge(s.isEnabled);
      return;
    }

    if (s.shieldScope === "tab") {
      const isArmed = (s.armedTabIds || []).includes(activeTab.id);
      updateBadge(isArmed);
    } else if (s.shieldScope === "window") {
      const isArmed = (s.armedWindowIds || []).includes(activeTab.windowId);
      updateBadge(isArmed);
    } else {
      updateBadge(s.isEnabled);
    }
  } catch (e) {
    updateBadge(false);
  }
}

/**
 * Broadcasts settings tab-by-tab / window-by-window (Scope Aware)
 */
async function broadcastScopeAware(settings) {
  try {
    const tabs = await chrome.tabs.query({});
    const armedTabs = new Set(settings.armedTabIds || []);
    const armedWindows = new Set(settings.armedWindowIds || []);

    for (const tab of tabs) {
      if (!tab.id || !tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("edge://")) continue;

      let tabIsEnabled = false;
      if (settings.shieldScope === "global") {
        tabIsEnabled = settings.isEnabled;
      } else if (settings.shieldScope === "tab") {
        tabIsEnabled = armedTabs.has(tab.id);
      } else {
        tabIsEnabled = armedWindows.has(tab.windowId);
      }

      const payload = Object.assign({}, settings, { isEnabled: tabIsEnabled });
      chrome.tabs.sendMessage(tab.id, { type: "STATE_CHANGED", settings: payload }, () => {
        if (chrome.runtime.lastError) {}
      });
    }
  } catch (err) {}
}

/**
 * Updates extension action badge
 */
async function updateBadge(isEnabled) {
  try {
    if (isEnabled) {
      await chrome.action.setBadgeText({ text: "SAFE" });
      await chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
      await chrome.action.setTitle({ title: "MeetingMode: ARMED (Screen Shield Active • Alt+Shift+M to toggle)" });
    } else {
      await chrome.action.setBadgeText({ text: "" });
      await chrome.action.setTitle({ title: "MeetingMode: OFF (Alt+Shift+M to arm)" });
    }
  } catch (err) {
    // Badge API fallback
  }
}

/**
 * Broadcasts an event to all open tabs
 */
async function broadcastToAllTabs(message) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://")) {
        chrome.tabs.sendMessage(tab.id, message, () => {
          if (chrome.runtime.lastError) {
            // Unscriptable tab safely ignored
          }
        });
      }
    }
  } catch (err) {
    // Broadcast fallback
  }
}

async function getSettings() {
  try {
    const res = await chrome.storage.local.get("meetingModeSettings");
    return res?.meetingModeSettings || DEFAULT_SETTINGS;
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}
