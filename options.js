/**
 * MeetingMode Options Controller
 * Manages domain overrides, confidential keywords, and global preferences.
 */

let settings = {
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
  autoArmOnMeetings: false,
  alwaysCloakedDomains: ["stripe.com", "paypal.com", "quickbooks.intuit.com"],
  silenceNotifications: true,
  spotlightMode: false,
  cloakTabs: true,
  protectClipboard: true,
  domainOverrides: {},
  customKeywords: ["Project Titan", "Acme Confidential", "Stealth Launch"],
  theme: "dark"
};

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  initNavigation();
  initFormHandlers();
  renderDomainRules();
  renderKeywords();
  renderCloakedDomains();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("welcome") === "true") {
    const welcomeBanner = document.getElementById("welcome-banner");
    if (welcomeBanner) welcomeBanner.style.display = "block";
  }
});

async function loadSettings() {
  try {
    const res = await chrome.storage.local.get("meetingModeSettings");
    if (res && res.meetingModeSettings) {
      settings = Object.assign(settings, res.meetingModeSettings);
      if (!settings.customKeywords) {
        settings.customKeywords = ["Project Titan", "Acme Confidential", "Stealth Launch"];
      }
      if (!settings.alwaysCloakedDomains) {
        settings.alwaysCloakedDomains = ["stripe.com", "paypal.com", "quickbooks.intuit.com"];
      }
    }
  } catch (err) {
    // Storage fallback
  }

  applyTheme(settings.theme || "dark");

  const themeSelect = document.getElementById("setting-theme");
  if (themeSelect) themeSelect.value = settings.theme || "dark";

  const modeSelect = document.getElementById("setting-mask-mode");
  if (modeSelect) modeSelect.value = settings.maskMode || "blur";

  const scopeSelect = document.getElementById("setting-shield-scope");
  if (scopeSelect) scopeSelect.value = settings.shieldScope || "window";

  const autoArmCheck = document.getElementById("setting-auto-arm-meetings");
  if (autoArmCheck) autoArmCheck.checked = settings.autoArmOnMeetings === true;

  const silenceCheck = document.getElementById("setting-silence-notifications");
  if (silenceCheck) silenceCheck.checked = settings.silenceNotifications !== false;

  const clipboardCheck = document.getElementById("setting-protect-clipboard");
  if (clipboardCheck) clipboardCheck.checked = settings.protectClipboard !== false;
}

function initNavigation() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-view").forEach((v) => v.classList.remove("active"));

      tab.classList.add("active");
      const targetId = tab.getAttribute("data-tab");
      document.getElementById(targetId)?.classList.add("active");
    });
  });
}

function initFormHandlers() {
  // Theme Switch
  document.getElementById("setting-theme")?.addEventListener("change", async (e) => {
    settings.theme = e.target.value;
    applyTheme(settings.theme);
    await saveSettings();
  });

  // Mask Mode
  document.getElementById("setting-mask-mode")?.addEventListener("change", async (e) => {
    settings.maskMode = e.target.value;
    await saveSettings();
  });

  // Shield Scope (Window vs Global)
  document.getElementById("setting-shield-scope")?.addEventListener("change", async (e) => {
    settings.shieldScope = e.target.value;
    await saveSettings();
  });

  // Auto-Arm on Meetings
  document.getElementById("setting-auto-arm-meetings")?.addEventListener("change", async (e) => {
    settings.autoArmOnMeetings = e.target.checked;
    await saveSettings();
  });

  // Silence Notifications
  document.getElementById("setting-silence-notifications")?.addEventListener("change", async (e) => {
    settings.silenceNotifications = e.target.checked;
    await saveSettings();
  });

  // Protect Clipboard
  document.getElementById("setting-protect-clipboard")?.addEventListener("change", async (e) => {
    settings.protectClipboard = e.target.checked;
    await saveSettings();
  });

  // Add Keyword
  document.getElementById("btn-add-keyword")?.addEventListener("click", addKeyword);
  document.getElementById("new-keyword-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addKeyword();
  });

  // Add Always-Cloaked Domain
  document.getElementById("btn-add-cloaked-domain")?.addEventListener("click", addCloakedDomain);
  document.getElementById("new-cloaked-domain-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addCloakedDomain();
  });
}

function renderDomainRules() {
  const container = document.getElementById("domain-rules-list");
  if (!container) return;
  container.innerHTML = "";

  const domains = Object.keys(settings.domainOverrides || {});
  if (domains.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); font-size: 12.5px; padding: 12px 0;">No custom element rules yet. Use <kbd>Alt+Shift+S</kbd> on any webpage to shield specific cards or sidebars.</div>`;
    return;
  }

  domains.forEach((host) => {
    const selectors = settings.domainOverrides[host] || [];
    if (selectors.length === 0) return;

    const group = document.createElement("div");
    group.className = "domain-group";

    const header = document.createElement("div");
    header.className = "domain-header";
    header.innerHTML = `<span class="domain-name font-mono">${escapeHtml(host)}</span>`;

    const tagList = document.createElement("div");

    selectors.forEach((sel) => {
      const tag = document.createElement("span");
      tag.className = "selector-tag";
      tag.innerHTML = `
        <span>${escapeHtml(sel)}</span>
        <button class="btn-tag-remove" title="Remove Rule"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
      `;

      tag.querySelector(".btn-tag-remove")?.addEventListener("click", async () => {
        settings.domainOverrides[host] = settings.domainOverrides[host].filter(s => s !== sel);
        if (settings.domainOverrides[host].length === 0) {
          delete settings.domainOverrides[host];
        }
        await saveSettings();
        renderDomainRules();
      });

      tagList.appendChild(tag);
    });

    group.appendChild(header);
    group.appendChild(tagList);
    container.appendChild(group);
  });
}

function renderKeywords() {
  const list = document.getElementById("keywords-chips-list");
  if (!list) return;
  list.innerHTML = "";

  const keywords = settings.customKeywords || [];
  keywords.forEach((kw) => {
    const chip = document.createElement("div");
    chip.className = "keyword-chip";
    chip.innerHTML = `
      <span>${escapeHtml(kw)}</span>
      <button title="Remove keyword"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
    `;

    chip.querySelector("button")?.addEventListener("click", async () => {
      settings.customKeywords = settings.customKeywords.filter(k => k !== kw);
      await saveSettings();
      renderKeywords();
    });

    list.appendChild(chip);
  });
}

async function addKeyword() {
  const input = document.getElementById("new-keyword-input");
  const val = input ? input.value.trim() : "";
  if (!val) return;

  if (!settings.customKeywords) settings.customKeywords = [];
  if (!settings.customKeywords.includes(val)) {
    settings.customKeywords.push(val);
    await saveSettings();
    renderKeywords();
  }

  if (input) input.value = "";
}

function renderCloakedDomains() {
  const list = document.getElementById("cloaked-domains-chips-list");
  if (!list) return;
  list.innerHTML = "";

  const domains = settings.alwaysCloakedDomains || [];
  domains.forEach((dom) => {
    const chip = document.createElement("div");
    chip.className = "keyword-chip";
    chip.innerHTML = `
      <span>${escapeHtml(dom)}</span>
      <button title="Remove domain"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
    `;

    chip.querySelector("button")?.addEventListener("click", async () => {
      settings.alwaysCloakedDomains = settings.alwaysCloakedDomains.filter(d => d !== dom);
      await saveSettings();
      renderCloakedDomains();
    });

    list.appendChild(chip);
  });
}

async function addCloakedDomain() {
  const input = document.getElementById("new-cloaked-domain-input");
  let val = input ? input.value.trim().toLowerCase() : "";
  if (!val) return;

  // Normalize url if user pasted full https://domain.com/path
  try {
    if (val.startsWith("http://") || val.startsWith("https://")) {
      val = new URL(val).hostname;
    }
  } catch (e) {}

  if (!settings.alwaysCloakedDomains) settings.alwaysCloakedDomains = [];
  if (!settings.alwaysCloakedDomains.includes(val)) {
    settings.alwaysCloakedDomains.push(val);
    await saveSettings();
    renderCloakedDomains();
  }

  if (input) input.value = "";
}

async function saveSettings() {
  try {
    await chrome.storage.local.set({ meetingModeSettings: settings });
    // Notify background service worker for centralized scope-aware broadcasting and badge sync
    chrome.runtime.sendMessage({ type: "STATE_CHANGED", settings }, () => {
      if (chrome.runtime.lastError) {}
    });
  } catch (err) {
    // Storage fallback
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
