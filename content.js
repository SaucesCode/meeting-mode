/**
 * MeetingMode • Presentation Shield & Data Cloaker
 * In-Page Content Script: Zero-Delay CSS Injection, Instant Hover-to-Read,
 * Bottom-Corner Tactical Modal HUD, Messaging App Auto-Shield (FB, Messenger, etc.).
 */

(() => {
  if (window.__MEETING_MODE_INITIALIZED__) return;
  window.__MEETING_MODE_INITIALIZED__ = true;

  // Active State Cache
  let settings = {
    isEnabled: false,
    shieldScope: "window", // "tab" | "window" | "global"
    armedTabIds: [],
    armedWindowIds: [],
    maskMode: "blur", // "blur" (standard hover peek) | "lockdown" (blur for both presenter & screen share) | "scramble"
    maskFinancials: true,
    maskEmails: true,
    maskSecrets: true,
    maskNumbers: false,
    maskMessages: true, // Auto-mask Facebook, Messenger, Discord, WhatsApp, etc.
    maskAvatars: true, // Auto-mask user profile photos & avatars
    maskInputs: true, // Auto-mask prefilled form & password inputs
    autoArmOnMeetings: false, // Default to FALSE so shield never turns on unexpectedly
    alwaysCloakedDomains: ["stripe.com", "paypal.com", "quickbooks.intuit.com"],
    silenceNotifications: true, // Suppress in-page notification popups & sound chimes
    spotlightMode: false, // Presentation Spotlight beam mode
    dockPosition: null, // Draggable floating dock coords { left, top }
    cloakTabs: true,
    protectClipboard: true, // Auto-redacts masked PII, secrets, and financials from clipboard buffer
    showFloatingBadge: true,
    domainOverrides: {},
    customKeywords: []
  };

  let originalTitle = document.title;
  let originalFaviconHref = null;
  let isTabCloaked = false;
  let isPickerActive = false;
  let pickerBanner = null;
  let hoveredPickerEl = null;

  let floatingDockEl = null;
  let inPagePanelEl = null;
  let panicCurtainEl = null;
  let spotlightBackdropEl = null;
  let currentSpotlightEl = null;
  let titleObserver = null;

  const maskedElements = new Set();
  const processedTextNodes = new WeakSet();
  let mutationObserver = null;
  let debounceTimer = null;

  // Zero-Click Auto-Detection RegExes
  const REGEX = {
    financials: /(?:[\$€£¥₹]|USD|EUR|GBP)\s?\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?(?:[kKmMbB]|(?=\s|\b|$))/g,
    emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    secrets: /(?:sk_live_[0-9a-zA-Z]{20,}|pk_live_[0-9a-zA-Z]{20,}|ghp_[0-9a-zA-Z]{30,}|bearer\s+[a-zA-Z0-9_\-\.]{20,})/gi,
    numbers: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
  };

  let currentTabId = null;
  let currentWindowId = null;

  init();

  async function init() {
    let tabStateReceived = false;

    // 1. Fetch exact tab-scoped state from background service worker
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "GET_TAB_SHIELD_STATE" }, (res) => {
          if (chrome.runtime.lastError || !res) {
            resolve(null);
          } else {
            resolve(res);
          }
        });
      });

      if (response && response.settings) {
        settings = Object.assign(settings, response.settings);
        currentTabId = response.tabId;
        currentWindowId = response.windowId;
        tabStateReceived = true;
      }
    } catch (e) {}

    // 2. Fallback to storage only if background worker failed to respond
    if (!tabStateReceived) {
      try {
        const stored = await chrome.storage.local.get("meetingModeSettings");
        if (stored && stored.meetingModeSettings) {
          settings = Object.assign(settings, stored.meetingModeSettings);
          // If scope is tab or window and background didn't verify, default to unmasked
          if (settings.shieldScope === "tab" || settings.shieldScope === "window") {
            settings.isEnabled = false;
          }
        }
      } catch (err) {}
    }

    applyShieldState();
    renderFloatingDock();
    bindHoverAndClickHandlers();
    listenForMessages();
    setupMutationObserver();
    initClipboardPrivacyShield();
  }

  /**
   * Applies or lifts the privacy shield based on settings
   */
  function applyShieldState() {
    const isArmed = Boolean(settings.isEnabled);

    // Root classes for CSP-immune extension stylesheet rules (Facebook, Messenger, Discord, etc.)
    document.documentElement.classList.toggle("shield-armed", isArmed);
    document.documentElement.classList.toggle("shield-armed-messages", isArmed && settings.maskMessages !== false);
    document.documentElement.classList.toggle("shield-armed-media", isArmed && settings.maskMessages !== false);
    document.documentElement.classList.toggle("shield-armed-avatars", isArmed && settings.maskAvatars !== false);
    document.documentElement.classList.toggle("shield-lockdown", isArmed && settings.maskMode === "lockdown");

    // Identify messaging platforms for high-specificity platform rules
    const host = window.location.hostname.toLowerCase();
    if (host.includes("messenger.com")) {
      document.documentElement.setAttribute("data-shield-app", "messenger");
    } else if (host.includes("facebook.com")) {
      document.documentElement.setAttribute("data-shield-app", "facebook");
    } else if (host.includes("discord.com")) {
      document.documentElement.setAttribute("data-shield-app", "discord");
    } else if (host.includes("whatsapp.com")) {
      document.documentElement.setAttribute("data-shield-app", "whatsapp");
    } else if (host.includes("slack.com")) {
      document.documentElement.setAttribute("data-shield-app", "slack");
    } else if (host.includes("teams.microsoft.com")) {
      document.documentElement.setAttribute("data-shield-app", "teams");
    }

    // 1. Synchronous 0ms CSS Shield (Messages + Avatars)
    injectZeroDelayCSS();

    // 2. Notification Silencing Class
    if (settings.isEnabled && settings.silenceNotifications !== false) {
      document.documentElement.classList.add("shield-notifications-silenced");
    } else {
      document.documentElement.classList.remove("shield-notifications-silenced");
    }

    // 3. Presentation Spotlight Mode
    updateSpotlightState();

    // 4. Ghost Form & Password Input Cloaking
    if (settings.isEnabled && settings.maskInputs !== false) {
      applyInputCloaking();
    } else {
      removeInputCloaking();
    }

    if (settings.isEnabled) {
      scanAndMaskDocument();
      applyDomainCustomBlocks();
      if (settings.cloakTabs) {
        cloakActiveTab();
      } else {
        uncloakActiveTab();
      }
    } else {
      unmaskAllElements();
      removeDomainCustomBlocks();
      uncloakActiveTab();
    }

    updateFloatingDockUI();
    updateInPagePanelUI();
  }

  /**
   * Injects pure synchronous CSS into <head> for zero-delay scroll masking on
   * Messenger, Facebook, Discord, WhatsApp, Slack, Teams, Telegram, Instagram, etc.
   */
  function injectZeroDelayCSS() {
    let styleEl = document.getElementById("meetingmode-css-shield");

    if (!settings.isEnabled || (settings.maskMessages === false && settings.maskAvatars === false && settings.maskInputs === false)) {
      if (styleEl) styleEl.remove();
      return;
    }

    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "meetingmode-css-shield";
      const existingNonce = document.querySelector("style[nonce], script[nonce]")?.getAttribute("nonce") || document.querySelector("style[nonce], script[nonce]")?.nonce;
      if (existingNonce) {
        styleEl.setAttribute("nonce", existingNonce);
      }
      (document.head || document.documentElement).appendChild(styleEl);
    } else {
      const existingNonce = document.querySelector("style[nonce], script[nonce]")?.getAttribute("nonce") || document.querySelector("style[nonce], script[nonce]")?.nonce;
      if (existingNonce && !styleEl.getAttribute("nonce")) {
        styleEl.setAttribute("nonce", existingNonce);
      }
    }

    const host = window.location.hostname.toLowerCase();
    const activeSelectors = [];

    // 1. Universal Chat & Messaging Selectors (active everywhere)
    activeSelectors.push(
      "div[class*='chat-message' i]",
      "div[class*='chat-bubble' i]",
      "div[class*='chat_message' i]",
      "div[class*='chat__message' i]",
      "div[class*='conversation-message' i]",
      "div[aria-label*='Chat' i] [dir='auto']",
      "div[aria-label*='Messages' i] [dir='auto']",
      "div[data-testid*='message' i]",
      ".c-message__body",
      ".message-content"
    );

    // 2. Facebook & Messenger (Popovers, Header Flyouts, Chat Tabs, Conversation Lists)
    if (host.includes("facebook.com") || host.includes("messenger.com")) {
      activeSelectors.push(
        "div[role='dialog'] [dir='auto']",
        "div[aria-label*='Chats' i] [dir='auto']",
        "div[aria-label*='Messenger' i] [dir='auto']",
        "div[aria-label*='Chat with' i] [dir='auto']",
        "div[aria-label*='Conversation' i] [dir='auto']",
        "div[aria-label*='Messages' i] [dir='auto']",
        "div[data-pagelet*='ChatTab' i] [dir='auto']",
        "div[data-pagelet*='Chat' i] [dir='auto']",
        "div[data-pagelet*='Message' i] [dir='auto']",
        "div[data-testid*='message' i] [dir='auto']",
        "div[data-testid*='chat' i] [dir='auto']",
        "div[data-testid='message_container']",
        "div[data-testid='incoming_group']",
        "div[data-testid='outgoing_group']",
        "div[data-scope='messages_table'] [dir='auto']",
        "span[data-lexical-text='true']",
        "div[role='main'] [dir='auto']",
        "div[role='grid'] [dir='auto']",
        "div[role='row'] [dir='auto']"
      );
    }

    // 3. Discord Web (Messages, Replies, Embeds, Channel DMs, Scrollers)
    if (host.includes("discord.com")) {
      activeSelectors.push(
        "div[class*='messageContent']",
        "div[id^='message-content-']",
        "div[class*='markup'][class*='message']",
        "li[id^='chat-messages-'] div[class*='contents']",
        "li[class*='messageListItem'] [class*='messageContent']",
        "div[class*='repliedTextContent']",
        "div[class*='embedDescription']",
        "div[class*='embedTitle']",
        "div[data-list-item-id^='chat-messages-'] [class*='markup']",
        "div[class*='channel_'] [class*='subText']",
        "div[class*='activityText']",
        "div[class*='threadMessageAccessory']"
      );
    }

    // 4. WhatsApp Web
    if (host.includes("whatsapp.com")) {
      activeSelectors.push(
        "div.message-in",
        "div.message-out",
        "div[data-testid='msg-container']",
        "div[data-testid='conversation-panel-body'] span.selectable-text",
        "div[data-testid='chat-list'] span[title]",
        "div.copyable-text",
        "span.selectable-text",
        "div[data-testid='cell-frame-title']",
        "div[data-testid='last-msg-status']"
      );
    }

    // 5. Telegram Web
    if (host.includes("telegram.org")) {
      activeSelectors.push(
        ".message-content",
        ".text-content",
        ".message-text",
        ".bubble-content",
        ".bubble .message",
        ".peer-title",
        ".dialog-subtitle",
        ".last-message",
        ".Message .text-content",
        ".message-box .text-content"
      );
    }

    // 6. Slack
    if (host.includes("slack.com")) {
      activeSelectors.push(
        ".c-message_kit__text",
        ".c-message__body",
        "div[data-qa='message_content']",
        "div[data-qa='message-text']",
        ".p-rich_text_section",
        "span[data-qa='channel_sidebar_name']",
        ".p-channel_sidebar__channel",
        "div[data-qa='virtual-list-item']"
      );
    }

    // 7. Microsoft Teams
    if (host.includes("teams.microsoft.com")) {
      activeSelectors.push(
        "div[data-tid='chat-message-text']",
        "div[data-tid='messageBody']",
        "div[data-tid='chat-pane-item']",
        "div[data-tid='threadBody']",
        "div[data-tid='chat-list-item']"
      );
    }

    // 8. Instagram Direct
    if (host.includes("instagram.com")) {
      activeSelectors.push(
        "div[role='main'] div[role='list'] [dir='auto']",
        "div[role='dialog'] [dir='auto']",
        "div[aria-label*='Chats' i] [dir='auto']",
        "div[aria-label*='Messages' i] [dir='auto']",
        "div[aria-label*='Direct' i] [dir='auto']",
        "div[data-visualcompletion='ignore-dynamic'] [dir='auto']"
      );
    }

    // 9. Twitter / X DMs
    if (host.includes("twitter.com") || host.includes("x.com")) {
      activeSelectors.push(
        "div[data-testid='messageEntry']",
        "div[data-testid='conversation']",
        "div[data-testid='DMDrawer'] [dir='auto']",
        "div[aria-label*='Direct Messages' i] [dir='auto']",
        "div[aria-label*='Timeline: Messages' i] [dir='auto']"
      );
    }

    // 10. LinkedIn Messaging
    if (host.includes("linkedin.com")) {
      activeSelectors.push(
        ".msg-s-message-list-container",
        ".msg-s-event-listitem__body",
        ".msg-conversation-card__message-snippet",
        ".msg-overlay-bubble-header__title",
        ".msg-s-message-group__item"
      );
    }

    // 11. Google Chat & Meet In-Call Messages
    if (host.includes("google.com")) {
      activeSelectors.push(
        "div[aria-label*='In-call messages' i] [dir='auto']",
        "div[aria-label*='Chat' i] [dir='auto']",
        "div[data-topic-id] [dir='auto']",
        "div[data-message-id] [dir='auto']",
        "div[role='region'][aria-label*='Chat' i] [dir='auto']"
      );
    }

    // 12. Skype Web
    if (host.includes("skype.com")) {
      activeSelectors.push(
        "div[data-tid='chat-message']",
        "div[data-tid='message-bubble']",
        "div[data-tid='chat-item']"
      );
    }

    // 13. Avatar & Profile Picture Cloaker
    if (settings.maskAvatars !== false) {
      activeSelectors.push(
        "img[class*='avatar' i]",
        "div[class*='avatar' i] img",
        "span[class*='avatar' i] img",
        "img[class*='profile-pic' i]",
        "img[class*='profile_pic' i]",
        "img[class*='profile-image' i]",
        "img[alt*='avatar' i]",
        "img[alt*='profile picture' i]",
        "div[role='dialog'] img",
        "div[role='dialog'] svg image",
        "div[data-pagelet*='ChatTab' i] img",
        "div[data-pagelet*='ChatTab' i] svg image",
        "img[class*='c-avatar__image']",
        ".c-avatar",
        ".avatar-element",
        ".user-avatar",
        "div[data-testid*='UserAvatar'] img"
      );
    }

    // 14. Chat Message Images, Photo Attachments, Screenshots & Media Previews
    const mediaAttachmentSelectors = [];
    if (settings.maskMessages !== false) {
      // Universal Chat Attachments & Images
      mediaAttachmentSelectors.push(
        "div[class*='attachment' i] img",
        "div[class*='attachment' i] video",
        "div[class*='chat-image' i]",
        "div[class*='message-image' i]",
        "div[class*='media-content' i] img",
        "div[class*='media-attachment' i]"
      );

      // Facebook & Messenger Media Attachments
      if (host.includes("facebook.com") || host.includes("messenger.com")) {
        mediaAttachmentSelectors.push(
          "div[data-testid='message_container'] img:not([class*='avatar'])",
          "div[data-pagelet*='ChatTab'] img:not([class*='avatar'])",
          "div[data-pagelet*='Chat'] img:not([class*='avatar'])",
          "div[aria-label*='Photo' i] img",
          "div[aria-label*='Attachment' i] img",
          "div[data-testid='outgoing_group'] img:not([class*='avatar'])",
          "div[data-testid='incoming_group'] img:not([class*='avatar'])"
        );
      }

      // Discord Media Attachments, Embeds & Uploads
      if (host.includes("discord.com")) {
        mediaAttachmentSelectors.push(
          "div[class*='imageWrapper']",
          "div[class*='attachment_']",
          "div[class*='mediaAttachments']",
          "div[class*='embedMedia']",
          "div[class*='embedThumbnail']",
          "div[class*='mosaicItem']",
          "div[class*='oneByOneGrid']",
          "div[class*='visualMediaItemContainer']",
          "a[class*='originalLink'] img",
          "div[class*='mediaAttachments'] img",
          "div[class*='mediaAttachments'] video"
        );
      }

      // WhatsApp Web Media Bubbles & Thumbnails
      if (host.includes("whatsapp.com")) {
        mediaAttachmentSelectors.push(
          "div[data-testid='media-content']",
          "div[data-testid='image-thumb']",
          "div[data-testid='image-thumb'] img",
          "div[data-testid='sticker-container']",
          "div[data-testid='video-content']",
          "div._amkd img",
          "div.message-in div[role='button'] img",
          "div.message-out div[role='button'] img"
        );
      }

      // Telegram Web Photos, Stickers & Media
      if (host.includes("telegram.org")) {
        mediaAttachmentSelectors.push(
          ".media-photo",
          ".media-video",
          ".media-container img",
          ".sticker-content",
          ".album-item",
          ".attachment-image",
          ".media-inner img"
        );
      }

      // Slack File Previews & Pasted Screenshots
      if (host.includes("slack.com")) {
        mediaAttachmentSelectors.push(
          ".c-message_attachment",
          ".p-file_image_thumbnail",
          ".c-image_canvas",
          "div[data-qa='file_container']",
          "div[data-qa='file_container'] img",
          ".p-rich_text_file",
          ".c-message__attachments img"
        );
      }

      // Microsoft Teams Image Attachments
      if (host.includes("teams.microsoft.com")) {
        mediaAttachmentSelectors.push(
          "div[data-tid='chat-message-image']",
          "div[data-tid='image-container'] img",
          "div[data-tid='attachment-item'] img"
        );
      }

      // Instagram Direct Photos & Media
      if (host.includes("instagram.com")) {
        mediaAttachmentSelectors.push(
          "div[aria-label*='Messages' i] div[role='button'] img:not([class*='avatar'])",
          "div[aria-label*='Direct' i] div[role='button'] img:not([class*='avatar'])",
          "div[data-testid='direct_thread'] img:not([class*='avatar'])"
        );
      }

      // Twitter / X DMs Media
      if (host.includes("twitter.com") || host.includes("x.com")) {
        mediaAttachmentSelectors.push(
          "div[data-testid='messageEntry'] div[data-testid='tweetPhoto']",
          "div[data-testid='messageEntry'] img:not([class*='avatar'])",
          "div[data-testid='DMDrawer'] div[data-testid='tweetPhoto']"
        );
      }

      // LinkedIn Messaging Attachments
      if (host.includes("linkedin.com")) {
        mediaAttachmentSelectors.push(
          ".msg-s-message-list-container .msg-s-event-listitem__body img:not([class*='avatar'])",
          ".msg-s-message-list-container [class*='attachment']"
        );
      }

      // Google Chat / Meet Shared Images
      if (host.includes("google.com")) {
        mediaAttachmentSelectors.push(
          "div[aria-label*='In-call messages' i] img:not([class*='avatar'])",
          "div[data-message-id] img:not([class*='avatar'])"
        );
      }
    }

    const selectors = activeSelectors.join(",\n");
    const hoverSelectors = activeSelectors.map(s => s + ":hover").join(",\n");

    const mediaSelectors = mediaAttachmentSelectors.join(",\n");
    const mediaHoverSelectors = mediaAttachmentSelectors.map(s => s + ":hover").join(",\n");

    const isLockdown = settings.maskMode === "lockdown";
    const effectiveHoverSelectors = isLockdown
      ? activeSelectors.map(s => `html.shield-alt-held ${s}:hover`).join(",\n")
      : hoverSelectors;
    const effectiveMediaHoverSelectors = isLockdown
      ? mediaAttachmentSelectors.map(s => `html.shield-alt-held ${s}:hover`).join(",\n")
      : mediaHoverSelectors;

    styleEl.textContent = `
      ${selectors} {
        filter: blur(6.5px) !important;
        transition: filter 0.12s ease !important;
        user-select: none !important;
      }
      ${effectiveHoverSelectors} {
        filter: none !important;
        outline: 1.5px dashed #10b981 !important;
        outline-offset: 1px !important;
        user-select: text !important;
      }

      /* Chat Images & Media Attachments (Deep Blur + Smooth Hover-to-Peek) */
      ${mediaSelectors ? `
      ${mediaSelectors} {
        filter: blur(16px) !important;
        opacity: 0.65 !important;
        transition: filter 0.16s ease, opacity 0.16s ease !important;
        user-select: none !important;
      }
      ${effectiveMediaHoverSelectors} {
        filter: none !important;
        opacity: 1 !important;
        outline: 2px dashed #10b981 !important;
        outline-offset: 2px !important;
        user-select: auto !important;
        cursor: pointer !important;
      }
      ` : ""}

      /* Safety: Never blur typing in uncloaked inputs or extension UI */
      input:not(.shield-masked-input),
      textarea:not(.shield-masked-input),
      [contenteditable='true']:not(.shield-masked-input),
      [role='textbox']:not(.shield-masked-input),
      [role='textbox'] *:not(.shield-masked-input),
      #meetingmode-floating-dock, #meetingmode-floating-dock *,
      #meetingmode-inpage-panel, #meetingmode-inpage-panel *,
      #meetingmode-spotlight-backdrop, #meetingmode-spotlight-backdrop *,
      #meetingmode-picker-banner, #meetingmode-picker-banner *,
      #meetingmode-clipboard-toast, #meetingmode-clipboard-toast * {
        filter: none !important;
        opacity: 1 !important;
      }

      /* Ghost Form & Password Input Cloaking (0ms Priority) */
      input.shield-masked-input:not(:focus),
      textarea.shield-masked-input:not(:focus),
      .shield-masked-input:not(:focus) {
        -webkit-text-security: disc !important;
        filter: blur(5px) !important;
        opacity: 0.65 !important;
        transition: filter 0.14s ease, opacity 0.14s ease !important;
        cursor: text !important;
      }

      input.shield-masked-input:not(:focus):hover,
      textarea.shield-masked-input:not(:focus):hover,
      .shield-masked-input:not(:focus):hover {
        filter: blur(1.5px) !important;
        opacity: 0.85 !important;
      }

      input.shield-masked-input:focus,
      textarea.shield-masked-input:focus,
      .shield-masked-input:focus {
        -webkit-text-security: none !important;
        filter: none !important;
        opacity: 1 !important;
      }
    `;
  }

  /**
   * Scans document text nodes using a TreeWalker
   */
  function scanAndMaskDocument() {
    if (!settings.isEnabled || !document.body) return;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node || !node.nodeValue || !node.nodeValue.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const tag = parent.tagName.toLowerCase();
          if (["script", "style", "noscript", "textarea", "input"].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.isContentEditable || parent.closest("[contenteditable='true']")) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.closest("#meetingmode-floating-dock") || parent.closest("#meetingmode-inpage-panel")) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.classList.contains("shield-masked-blur") || parent.classList.contains("shield-masked-scramble") || parent.classList.contains("shield-unshield-trigger")) {
            return NodeFilter.FILTER_REJECT;
          }
          if (processedTextNodes.has(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodesToProcess = [];
    let currentNode;
    while ((currentNode = walker.nextNode())) {
      nodesToProcess.push(currentNode);
    }

    for (const textNode of nodesToProcess) {
      processTextNode(textNode);
    }
  }

  /**
   * Evaluates text and wraps matches into interactive masked spans
   */
  function processTextNode(textNode) {
    if (!textNode || !textNode.parentNode) return;
    const text = textNode.nodeValue;
    if (!text) return;

    processedTextNodes.add(textNode);

    const matches = [];

    if (settings.maskFinancials) {
      findMatches(text, REGEX.financials, "financial", matches);
    }
    if (settings.maskEmails) {
      findMatches(text, REGEX.emails, "email", matches);
    }
    if (settings.maskSecrets) {
      findMatches(text, REGEX.secrets, "secret", matches);
    }
    if (settings.maskNumbers) {
      findMatches(text, REGEX.numbers, "number", matches);
    }
    if (settings.customKeywords && settings.customKeywords.length > 0) {
      for (const kw of settings.customKeywords) {
        if (kw && kw.trim()) {
          const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const kwRegex = new RegExp(`\\b${escaped}\\b`, "gi");
          findMatches(text, kwRegex, "keyword", matches);
        }
      }
    }

    if (matches.length === 0) return;

    matches.sort((a, b) => a.start - b.start);

    const nonOverlapping = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        nonOverlapping.push(m);
        lastEnd = m.end;
      }
    }

    if (nonOverlapping.length === 0) return;

    const fragment = document.createDocumentFragment();
    let currentIndex = 0;

    for (const match of nonOverlapping) {
      if (match.start > currentIndex) {
        fragment.appendChild(document.createTextNode(text.slice(currentIndex, match.start)));
      }

      const span = document.createElement("span");
      const originalValue = match.value;
      span.setAttribute("data-mm-original", originalValue);
      span.setAttribute("data-mm-type", match.type);
      span.title = "Hover to peek • Click to lock reveal";

      if (settings.maskMode === "scramble") {
        const synthetic = generateSyntheticValue(originalValue, match.type);
        span.setAttribute("data-mm-synthetic", synthetic);
        span.className = "shield-masked-scramble";
        span.textContent = synthetic;
      } else {
        span.className = "shield-masked-blur";
        span.textContent = originalValue;
      }

      maskedElements.add(span);
      fragment.appendChild(span);
      currentIndex = match.end;
    }

    if (currentIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(currentIndex)));
    }

    textNode.parentNode.replaceChild(fragment, textNode);
  }

  function findMatches(text, regex, type, matches) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        value: match[0],
        type
      });
    }
  }

  function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function generateSyntheticValue(original, type) {
    const seed = hashString(original || "");
    if (type === "financial") {
      const symbolMatch = original.match(/^[\$€£¥₹]/);
      const symbol = symbolMatch ? symbolMatch[0] : "$";
      const hasCents = original.includes(".");
      const randInt = 1200 + (seed % 7600);
      const randCents = 10 + (seed % 89);
      return `${symbol}${randInt.toLocaleString()}${hasCents ? "." + randCents : ""}`;
    }
    if (type === "email") {
      const demoNames = ["alex", "jordan", "taylor", "morgan", "casey", "sam", "riley", "cameron", "quinn", "devon"];
      const randName = demoNames[seed % demoNames.length];
      return `${randName}.client@demo-corp.com`;
    }
    if (type === "secret") {
      return "sk_live_••••••••••••••••••••••••";
    }
    if (type === "number") {
      const p1 = 200 + (seed % 780);
      const p2 = 1000 + (seed % 8990);
      return `(555) ${p1}-${p2}`;
    }
    if (type === "keyword") {
      return "Confidential Project";
    }
    return "••••••••";
  }

  /**
   * Hover-to-Peek & Click-to-Lock Handlers
   */
  function bindHoverAndClickHandlers() {
    // Presenter Stealth Peek: Hold Alt key to peek during Screen Share Lockdown
    window.addEventListener("keydown", (e) => {
      if (e.key === "Alt" && !document.documentElement.classList.contains("shield-alt-held")) {
        document.documentElement.classList.add("shield-alt-held");
      }
    }, true);

    window.addEventListener("keyup", (e) => {
      if (e.key === "Alt") {
        document.documentElement.classList.remove("shield-alt-held");
      }
    }, true);

    window.addEventListener("blur", () => {
      document.documentElement.classList.remove("shield-alt-held");
    });

    document.addEventListener("mouseover", (e) => {
      const target = e.target;
      if (!target || !target.classList) return;

      if (target.classList.contains("shield-masked-scramble")) {
        if (settings.maskMode === "lockdown" && !e.altKey) return;
        const original = target.getAttribute("data-mm-original");
        if (original) target.textContent = original;
      }
    });

    document.addEventListener("mouseout", (e) => {
      const target = e.target;
      if (!target || !target.classList) return;

      if (target.classList.contains("shield-masked-scramble") && !target.classList.contains("shield-peek-active")) {
        const synthetic = target.getAttribute("data-mm-synthetic");
        const original = target.getAttribute("data-mm-original");
        const type = target.getAttribute("data-mm-type") || "financial";
        target.textContent = synthetic || generateSyntheticValue(original, type);
      }
    });

    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target || !target.classList) return;

      if (target.classList.contains("shield-masked-blur") || target.classList.contains("shield-masked-scramble")) {
        e.preventDefault();
        e.stopPropagation();
        toggleElementLock(target);
      }
    });
  }

  function toggleElementLock(el) {
    const isLocked = el.classList.contains("shield-peek-active");
    const original = el.getAttribute("data-mm-original");
    const synthetic = el.getAttribute("data-mm-synthetic");

    if (isLocked) {
      el.classList.remove("shield-peek-active");
      if (el.classList.contains("shield-masked-scramble")) {
        el.textContent = synthetic || generateSyntheticValue(original, el.getAttribute("data-mm-type") || "financial");
      }
      el.title = "Hover to peek • Click to lock reveal";
    } else {
      el.classList.add("shield-peek-active");
      if (el.classList.contains("shield-masked-scramble")) {
        el.textContent = original;
      }
      el.title = "Click to re-mask";
    }
  }

  /**
   * Ghost Form & Password Input Cloaking
   */
  function isEligibleInput(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    if (tag !== "input" && tag !== "textarea") return false;

    // Never mask extension's own UI elements
    if (el.closest("#meetingmode-inpage-panel") || el.closest("#meetingmode-floating-dock") || el.closest("#meetingmode-picker-banner")) {
      return false;
    }

    if (tag === "input") {
      const type = (el.type || "text").toLowerCase();
      const ignoredTypes = ["hidden", "checkbox", "radio", "submit", "button", "reset", "file", "image", "range", "color"];
      if (ignoredTypes.includes(type)) return false;
    }

    return true;
  }

  function evaluateInputCloak(input) {
    if (!input || !input.classList) return;

    if (!settings.isEnabled || settings.maskInputs === false) {
      input.classList.remove("shield-masked-input");
      return;
    }

    if (!isEligibleInput(input)) return;

    const val = input.value || input.defaultValue || "";
    const isSensitive = val.trim().length > 0 || input.type === "password";

    if (isSensitive) {
      input.classList.add("shield-masked-input");
    } else {
      input.classList.remove("shield-masked-input");
    }
  }

  function applyInputCloaking() {
    if (!settings.isEnabled || settings.maskInputs === false) {
      removeInputCloaking();
      return;
    }

    try {
      const inputs = document.querySelectorAll("input, textarea");
      inputs.forEach((input) => {
        evaluateInputCloak(input);
      });
    } catch (err) {}
  }

  function removeInputCloaking() {
    try {
      document.querySelectorAll(".shield-masked-input").forEach((el) => {
        el.classList.remove("shield-masked-input");
      });
    } catch (err) {}
  }

  /**
   * Clipboard Privacy Shield
   * Intercepts copy actions on masked elements and sensitive inputs during screen shares,
   * preventing confidential balances, API secrets, or client PII from leaking into
   * the clipboard buffer or chat windows.
   */
  let clipboardToastTimer = null;

  function initClipboardPrivacyShield() {
    document.addEventListener("copy", onDocumentCopy, true);
  }

  function getRedactedPlaceholder(type) {
    switch (type) {
      case "secret":
        return "[REDACTED_API_SECRET]";
      case "financial":
        return "[REDACTED_FINANCIAL]";
      case "email":
        return "[REDACTED_EMAIL]";
      case "number":
        return "[REDACTED_ID]";
      case "keyword":
        return "[REDACTED_PROJECT]";
      default:
        return "[REDACTED_DATA]";
    }
  }

  function onDocumentCopy(e) {
    if (!settings.isEnabled || settings.protectClipboard === false) return;

    // 1. Copying from an active form input or textarea
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      if (activeEl.classList.contains("shield-masked-input")) {
        const isPassword = activeEl.type === "password";
        const val = activeEl.value || "";
        const selStart = activeEl.selectionStart ?? 0;
        const selEnd = activeEl.selectionEnd ?? val.length;
        if (selStart !== selEnd) {
          e.preventDefault();
          const maskedOutput = isPassword ? "••••••••" : (settings.maskMode === "scramble" ? "demo_input_value" : "[REDACTED_INPUT]");
          e.clipboardData.setData("text/plain", maskedOutput);
          showClipboardToast("Clipboard Shield: Input value sanitized");
          return;
        }
      }
    }

    // 2. Selection across DOM elements
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);

    // Check if selection is entirely within a single masked element
    let container = range.commonAncestorContainer;
    let maskedContainer = null;
    if (container.nodeType === Node.ELEMENT_NODE) {
      maskedContainer = container.closest(".shield-masked-blur, .shield-masked-scramble, .shield-custom-blocked");
    } else if (container.parentElement) {
      maskedContainer = container.parentElement.closest(".shield-masked-blur, .shield-masked-scramble, .shield-custom-blocked");
    }

    // If inside a single masked container that has NOT been deliberately unlocked by clicking
    if (maskedContainer && !maskedContainer.classList.contains("shield-peek-active")) {
      e.preventDefault();
      let safeText = "";
      if (maskedContainer.classList.contains("shield-masked-scramble")) {
        safeText = maskedContainer.getAttribute("data-mm-synthetic") || maskedContainer.textContent;
      } else if (maskedContainer.classList.contains("shield-masked-blur")) {
        const type = maskedContainer.getAttribute("data-mm-type");
        safeText = getRedactedPlaceholder(type);
      } else {
        safeText = "[REDACTED_CONTENT]";
      }
      e.clipboardData.setData("text/plain", safeText);
      showClipboardToast("Clipboard Shield: Masked data sanitized");
      return;
    }

    // Check if range spans multiple elements, some of which are masked
    const fragment = range.cloneContents();
    const maskedInFragment = fragment.querySelectorAll(".shield-masked-blur, .shield-masked-scramble, .shield-custom-blocked");

    if (maskedInFragment.length > 0) {
      let interceptedCount = 0;
      maskedInFragment.forEach((el) => {
        // Skip elements user has intentionally clicked to unlock
        if (!el.classList.contains("shield-peek-active")) {
          interceptedCount++;
          if (el.classList.contains("shield-masked-scramble")) {
            el.textContent = el.getAttribute("data-mm-synthetic") || el.textContent;
          } else if (el.classList.contains("shield-masked-blur")) {
            const type = el.getAttribute("data-mm-type");
            el.textContent = getRedactedPlaceholder(type);
          } else {
            el.textContent = "[REDACTED_CONTENT]";
          }
        }
      });

      if (interceptedCount > 0) {
        e.preventDefault();
        const safeText = fragment.textContent;
        e.clipboardData.setData("text/plain", safeText);
        showClipboardToast(`Clipboard Shield: ${interceptedCount} masked ${interceptedCount === 1 ? 'item' : 'items'} sanitized`);
      }
    }
  }

  function showClipboardToast(message) {
    let toast = document.getElementById("meetingmode-clipboard-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "meetingmode-clipboard-toast";
      (document.body || document.documentElement).appendChild(toast);
    }

    toast.innerHTML = `
      <span class="mm-toast-pip"></span>
      <span class="mm-toast-text">${message}</span>
    `;
    toast.classList.add("visible");

    if (clipboardToastTimer) clearTimeout(clipboardToastTimer);
    clipboardToastTimer = setTimeout(() => {
      if (toast) toast.classList.remove("visible");
    }, 2400);
  }

  /**
   * Emergency Panic Privacy Curtain (Alt+Shift+B)
   */
  function isPanicCurtainActive() {
    return panicCurtainEl !== null && document.getElementById("meetingmode-panic-curtain") !== null;
  }

  function togglePanicCurtain() {
    if (isPanicCurtainActive()) {
      hidePanicCurtain();
    } else {
      showPanicCurtain();
    }
  }

  function showPanicCurtain() {
    if (document.getElementById("meetingmode-panic-curtain")) return;

    panicCurtainEl = document.createElement("div");
    panicCurtainEl.id = "meetingmode-panic-curtain";
    panicCurtainEl.setAttribute("role", "dialog");
    panicCurtainEl.setAttribute("aria-modal", "true");
    panicCurtainEl.setAttribute("aria-label", "Presentation Privacy Curtain");

    panicCurtainEl.innerHTML = `
      <div class="mm-curtain-card" id="meetingmode-curtain-card">
        <div class="mm-curtain-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Shield Engaged • Screen Concealed</span>
        </div>
        <h2 class="mm-curtain-title">Presentation Paused</h2>
        <p class="mm-curtain-desc">All screen contents, messages, and sensitive inputs on this page are frosted and shielded from viewers.</p>
        <button class="mm-curtain-resume-btn" id="meetingmode-curtain-resume-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span>Resume Screen (Esc)</span>
        </button>
        <div class="mm-curtain-hints">
          <span>Press</span> <kbd>ESC</kbd> <span>or</span> <kbd>Alt+Shift+B</kbd> <span>to resume</span>
        </div>
      </div>
    `;

    panicCurtainEl.addEventListener("click", (e) => {
      const resumeBtn = e.target.closest("#meetingmode-curtain-resume-btn");
      const card = e.target.closest("#meetingmode-curtain-card");
      if (resumeBtn || !card) {
        e.preventDefault();
        e.stopPropagation();
        hidePanicCurtain();
      }
    });

    (document.body || document.documentElement).appendChild(panicCurtainEl);
  }

  function hidePanicCurtain() {
    if (panicCurtainEl) {
      panicCurtainEl.remove();
      panicCurtainEl = null;
    }
    const existing = document.getElementById("meetingmode-panic-curtain");
    if (existing) existing.remove();
  }

  // Global Panic Hotkey (Alt+Shift+B) and Esc Dismiss
  window.addEventListener("keydown", (e) => {
    if (e.altKey && e.shiftKey && (e.key === "b" || e.key === "B")) {
      e.preventDefault();
      e.stopPropagation();
      togglePanicCurtain();
      return;
    }
    if (e.key === "Escape" && isPanicCurtainActive()) {
      e.preventDefault();
      e.stopPropagation();
      hidePanicCurtain();
      return;
    }
  }, true);

  // Live Ghost Input Cloaking: typing, changing, tabbing out, or clicking away
  ["input", "change", "blur", "focusout", "keyup"].forEach((eventName) => {
    document.addEventListener(eventName, (e) => {
      if (!settings.isEnabled || settings.maskInputs === false) return;
      if (e.target) {
        evaluateInputCloak(e.target);
      }
    }, true);
  });

  /**
   * In-Page Floating Privacy Dock (Draggable & Snappable)
   */
  function renderFloatingDock() {
    if (floatingDockEl) return;
    if (settings.showFloatingBadge === false) return;

    floatingDockEl = document.createElement("div");
    floatingDockEl.id = "meetingmode-floating-dock";
    floatingDockEl.innerHTML = `
      <div class="dock-grip" title="Drag to reposition shield">
        <svg width="8" height="12" viewBox="0 0 8 16" fill="currentColor">
          <circle cx="2" cy="3" r="1.5"/><circle cx="6" cy="3" r="1.5"/>
          <circle cx="2" cy="8" r="1.5"/><circle cx="6" cy="8" r="1.5"/>
          <circle cx="2" cy="13" r="1.5"/><circle cx="6" cy="13" r="1.5"/>
        </svg>
      </div>
      <svg class="dock-shield-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: ${settings.isEnabled ? '#10b981' : '#94a3b8'};">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span class="dock-pulse"></span>
      <span id="dock-status-label">${settings.isEnabled ? "Shield: ON" : "Shield: OFF"}</span>
    `;

    if (!settings.isEnabled) {
      floatingDockEl.classList.add("dock-off");
    }

    // Restore saved custom position if available
    if (settings.dockPosition && typeof settings.dockPosition.left === "number" && typeof settings.dockPosition.top === "number") {
      const maxX = Math.max(10, window.innerWidth - 140);
      const maxY = Math.max(10, window.innerHeight - 50);
      const clampedX = Math.min(Math.max(10, settings.dockPosition.left), maxX);
      const clampedY = Math.min(Math.max(10, settings.dockPosition.top), maxY);
      floatingDockEl.style.left = clampedX + "px";
      floatingDockEl.style.top = clampedY + "px";
      floatingDockEl.style.right = "auto";
      floatingDockEl.style.bottom = "auto";
    }

    floatingDockEl.title = "MeetingMode: Click to open HUD • Drag to reposition • Double-click to reset";

    // Draggable + Click handling
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let origX = 0;
    let origY = 0;
    let dragDistance = 0;

    floatingDockEl.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; // Primary left click only
      isDragging = true;
      dragDistance = 0;
      startX = e.clientX;
      startY = e.clientY;
      const rect = floatingDockEl.getBoundingClientRect();
      origX = rect.left;
      origY = rect.top;

      const onMouseMove = (moveEvent) => {
        if (!isDragging) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        dragDistance = Math.hypot(dx, dy);

        if (dragDistance > 4) {
          floatingDockEl.classList.add("dragging");
          const maxX = window.innerWidth - rect.width - 10;
          const maxY = window.innerHeight - rect.height - 10;
          const newX = Math.max(10, Math.min(maxX, origX + dx));
          const newY = Math.max(10, Math.min(maxY, origY + dy));
          floatingDockEl.style.left = newX + "px";
          floatingDockEl.style.top = newY + "px";
          floatingDockEl.style.right = "auto";
          floatingDockEl.style.bottom = "auto";
        }
      };

      const onMouseUp = async () => {
        isDragging = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        if (dragDistance > 4) {
          floatingDockEl.classList.remove("dragging");
          const finalRect = floatingDockEl.getBoundingClientRect();
          settings.dockPosition = { left: Math.round(finalRect.left), top: Math.round(finalRect.top) };
          await chrome.storage.local.set({ meetingModeSettings: settings });
        } else {
          // Clean Click -> Toggle In-Page HUD!
          toggleInPagePanel();
        }
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });

    // Double-click to reset position back to bottom-right
    floatingDockEl.addEventListener("dblclick", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await resetDockPosition();
    });

    document.body.appendChild(floatingDockEl);
  }

  async function resetDockPosition() {
    if (!floatingDockEl) return;
    floatingDockEl.style.left = "auto";
    floatingDockEl.style.top = "auto";
    floatingDockEl.style.right = "18px";
    floatingDockEl.style.bottom = "16px";
    settings.dockPosition = null;
    await chrome.storage.local.set({ meetingModeSettings: settings });
    if (inPagePanelEl && isPanelOpen()) {
      positionPanelAdjacentToDock();
    }
  }

  function updateFloatingDockUI() {
    if (!floatingDockEl) return;
    const label = floatingDockEl.querySelector("#dock-status-label");
    const icon = floatingDockEl.querySelector(".dock-shield-icon");
    if (settings.isEnabled) {
      floatingDockEl.classList.remove("dock-off");
      if (label) label.textContent = "Shield: ON";
      if (icon) icon.style.color = "#10b981";
    } else {
      floatingDockEl.classList.add("dock-off");
      if (label) label.textContent = "Shield: OFF";
      if (icon) icon.style.color = "#94a3b8";
    }
  }

  /**
   * In-Page Tactical HUD Modal
   */
  let panelDismissBound = false;

  function isPanelOpen() {
    return inPagePanelEl && inPagePanelEl.classList.contains("mm-open");
  }

  function toggleInPagePanel() {
    if (isPanelOpen()) {
      closeInPagePanel();
    } else {
      openInPagePanel();
    }
  }

  function openInPagePanel() {
    if (!inPagePanelEl) {
      inPagePanelEl = document.createElement("div");
      inPagePanelEl.id = "meetingmode-inpage-panel";
      document.body.appendChild(inPagePanelEl);
      bindPanelGlobalDismiss();
    }
    renderInPagePanelContent();
    positionPanelAdjacentToDock();
    inPagePanelEl.classList.add("mm-open");
  }

  function positionPanelAdjacentToDock() {
    if (!inPagePanelEl || !floatingDockEl) return;
    const dockRect = floatingDockEl.getBoundingClientRect();

    // Vertical alignment relative to dock
    if (dockRect.top > window.innerHeight / 2) {
      // Dock in bottom half -> open panel above
      inPagePanelEl.style.bottom = Math.max(10, window.innerHeight - dockRect.top + 8) + "px";
      inPagePanelEl.style.top = "auto";
    } else {
      // Dock in top half -> open panel below
      inPagePanelEl.style.top = Math.max(10, dockRect.bottom + 8) + "px";
      inPagePanelEl.style.bottom = "auto";
    }

    // Horizontal alignment relative to dock
    if (dockRect.left > window.innerWidth / 2) {
      // Dock on right -> align right
      inPagePanelEl.style.right = Math.max(10, window.innerWidth - dockRect.right) + "px";
      inPagePanelEl.style.left = "auto";
    } else {
      // Dock on left -> align left
      inPagePanelEl.style.left = Math.max(10, dockRect.left) + "px";
      inPagePanelEl.style.right = "auto";
    }
  }

  function closeInPagePanel() {
    if (inPagePanelEl) {
      inPagePanelEl.classList.remove("mm-open");
    }
  }

  function bindPanelGlobalDismiss() {
    if (panelDismissBound) return;
    panelDismissBound = true;

    // Click outside to dismiss HUD
    document.addEventListener("click", (e) => {
      if (!isPanelOpen()) return;
      if (inPagePanelEl && inPagePanelEl.contains(e.target)) return;
      if (floatingDockEl && floatingDockEl.contains(e.target)) return;
      closeInPagePanel();
    }, true);

    // Escape key to dismiss HUD (prioritizes Panic Curtain & Element Picker)
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (isPanicCurtainActive() || isPickerActive) return;
        if (isPanelOpen()) {
          closeInPagePanel();
        }
      }
    }, true);
  }

  function renderInPagePanelContent() {
    if (!inPagePanelEl) return;
    const host = window.location.hostname;
    const customCount = settings.domainOverrides?.[host]?.length || 0;
    const hasCustomDock = Boolean(settings.dockPosition);
    const maskedCount = (typeof maskedElements !== "undefined" && maskedElements) ? maskedElements.size : 0;

    let masterDesc = "";
    if (settings.isEnabled) {
      if (settings.maskMode === "lockdown") {
        masterDesc = "Screen-Share Lockdown: 100% blurred for all (Hold Alt to peek)";
      } else if (settings.shieldScope === "tab") {
        masterDesc = "Active tab cloaked (other tabs clean)";
      } else if (settings.shieldScope === "window") {
        masterDesc = "Active window cloaked (notes safe on 2nd monitor)";
      } else {
        masterDesc = "Sensitive data cloaked across all windows";
      }
    } else {
      if (settings.maskMode === "lockdown") {
        masterDesc = "Click to arm Screen-Share Lockdown (blur for both you & viewers)";
      } else if (settings.shieldScope === "tab") {
        masterDesc = "Click to arm privacy cloak on active tab";
      } else if (settings.shieldScope === "window") {
        masterDesc = "Click to arm privacy cloak on active window";
      } else {
        masterDesc = "Click to arm privacy cloak across all windows";
      }
    }

    inPagePanelEl.innerHTML = `
      <!-- Header Bar -->
      <div class="mm-panel-head">
        <div class="mm-panel-brand">
          <span class="mm-brand-glyph">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </span>
          <span class="mm-brand-title">MeetingMode HUD</span>
          <span class="mm-status-pill ${settings.isEnabled ? "mm-pill-armed" : "mm-pill-off"}">
            ${settings.isEnabled ? "ARMED" : "STANDBY"}
          </span>
        </div>
        <button id="mm-panel-close-btn" class="mm-panel-close-btn" title="Close Panel (Esc)">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <!-- Unified Master Hero Card -->
      <div class="mm-master-card ${settings.isEnabled ? "armed" : ""}" id="mm-inpage-master-card" title="Click card to toggle Screen Shield">
        <div class="mm-master-card-top">
          <div class="mm-switch-content">
            <div class="mm-radar-beacon ${settings.isEnabled ? "armed" : ""}">
              <span class="mm-radar-dot"></span>
              <span class="mm-radar-wave"></span>
            </div>
            <div class="mm-switch-labels">
              <span class="mm-switch-title">Screen Shield: ${settings.isEnabled ? "ARMED" : "OFF"}</span>
              <span class="mm-switch-desc">${masterDesc}</span>
            </div>
          </div>
          <div class="mm-toggle-slider-track ${settings.isEnabled ? "armed" : ""}">
            <div class="mm-toggle-slider-thumb"></div>
          </div>
        </div>

        <!-- Integrated Scope & Mode Controls Strip (2-Row Stacked Layout) -->
        <div class="mm-master-sub-controls">
          <div class="mm-sub-control-row">
            <span class="mm-sub-control-label">Scope</span>
            <div class="mm-micro-segment mm-micro-segment-scope" title="Shield Scope">
              <button class="mm-micro-btn ${settings.shieldScope === "tab" ? "active" : ""}" id="mm-scope-tab" title="Protect only this active tab (Google Meet 'A Tab')">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                <span>Tab</span>
              </button>
              <button class="mm-micro-btn ${settings.shieldScope === "window" ? "active" : ""}" id="mm-scope-window" title="Protect this presentation window (Google Meet 'A Window')">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                <span>Window</span>
              </button>
              <button class="mm-micro-btn ${settings.shieldScope === "global" ? "active" : ""}" id="mm-scope-global" title="Protect all windows & monitors (Google Meet 'Entire Screen')">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="9" height="8" rx="1.5"></rect><rect x="13" y="3" width="9" height="8" rx="1.5"></rect><rect x="2" y="13" width="9" height="8" rx="1.5"></rect><rect x="13" y="13" width="9" height="8" rx="1.5"></rect></svg>
                <span>All</span>
              </button>
            </div>
          </div>

          <div class="mm-sub-control-row">
            <span class="mm-sub-control-label">Mode</span>
            <div class="mm-micro-segment mm-micro-segment-mode" title="Masking Mode">
              <button class="mm-micro-btn ${settings.maskMode === "blur" ? "active" : ""}" id="mm-mode-blur" title="Frosted privacy blur (hover to peek)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                <span>Blur</span>
              </button>
              <button class="mm-micro-btn ${settings.maskMode === "lockdown" ? "active" : ""}" id="mm-mode-lockdown" title="Screen Share Blur: 100% blurred for you and viewers watching screen share (Hold Alt to peek)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>Lockdown</span>
              </button>
              <button class="mm-micro-btn ${settings.maskMode === "scramble" ? "active" : ""}" id="mm-mode-scramble" title="Deterministic synthetic data scramble">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line></svg>
                <span>Scramble</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Instant Presets Row -->
      <div class="mm-presets-row">
        <button class="mm-preset-pill ${settings.maskMode === "scramble" ? "active" : ""}" id="mm-preset-demo" title="Deterministic Demo Scramble with financial & profile masks">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line></svg>
          <span>Client Demo</span>
        </button>
        <button class="mm-preset-pill ${(settings.maskMode === "blur" || settings.maskMode === "lockdown") && !settings.spotlightMode ? "active" : ""}" id="mm-preset-meeting" title="Screen Share Lockdown: 100% blurred for you & viewers, notifications silenced">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>Team Meet</span>
        </button>
        <button class="mm-preset-pill ${settings.spotlightMode ? "active" : ""}" id="mm-preset-loom" title="Presentation Spotlight on hovered cards & tab cloaked">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
          <span>Loom Beam</span>
        </button>
      </div>

      <!-- Section Title & Telemetry -->
      <div class="mm-section-header">
        <span class="mm-section-title">Privacy Rules</span>
        <span class="mm-section-meta font-mono" id="mm-telemetry-count">${maskedCount} ${maskedCount === 1 ? "item" : "items"} masked</span>
      </div>

      <!-- 2x4 Compact Balanced Privacy Rules Grid -->
      <div class="mm-rules-grid">
        <!-- 1. Financials -->
        <label class="mm-rule-chip ${settings.maskFinancials !== false ? "active" : ""}" for="mm-chk-financials" title="Mask dollar amounts, balances, MRR, transactions">
          <input type="checkbox" id="mm-chk-financials" class="mm-hidden-chk" ${settings.maskFinancials !== false ? "checked" : ""}>
          <div class="mm-rule-chip-inner">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            <span>Financials ($)</span>
          </div>
          <span class="mm-rule-pip"></span>
        </label>

        <!-- 2. Emails -->
        <label class="mm-rule-chip ${settings.maskEmails !== false ? "active" : ""}" for="mm-chk-emails" title="Mask client & user email addresses">
          <input type="checkbox" id="mm-chk-emails" class="mm-hidden-chk" ${settings.maskEmails !== false ? "checked" : ""}>
          <div class="mm-rule-chip-inner">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg>
            <span>Emails & PII</span>
          </div>
          <span class="mm-rule-pip"></span>
        </label>

        <!-- 3. API Secrets -->
        <label class="mm-rule-chip ${settings.maskSecrets !== false ? "active" : ""}" for="mm-chk-secrets" title="Mask API keys, tokens, and secrets">
          <input type="checkbox" id="mm-chk-secrets" class="mm-hidden-chk" ${settings.maskSecrets !== false ? "checked" : ""}>
          <div class="mm-rule-chip-inner">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m21 2-9.6 9.6"></path><path d="m15.5 7.5 3 3L22 7l-3-3"></path></svg>
            <span>API Secrets</span>
          </div>
          <span class="mm-rule-pip"></span>
        </label>

        <!-- 4. Chats -->
        <label class="mm-rule-chip ${settings.maskMessages !== false ? "active" : ""}" for="mm-chk-messages" title="Auto-mask FB, Discord, Slack, WhatsApp, Teams chats">
          <input type="checkbox" id="mm-chk-messages" class="mm-hidden-chk" ${settings.maskMessages !== false ? "checked" : ""}>
          <div class="mm-rule-chip-inner">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <span>Chats & DMs</span>
          </div>
          <span class="mm-rule-pip"></span>
        </label>

        <!-- 5. Avatars -->
        <label class="mm-rule-chip ${settings.maskAvatars !== false ? "active" : ""}" for="mm-chk-avatars" title="Mask profile photos & avatars">
          <input type="checkbox" id="mm-chk-avatars" class="mm-hidden-chk" ${settings.maskAvatars !== false ? "checked" : ""}>
          <div class="mm-rule-chip-inner">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>User Avatars</span>
          </div>
          <span class="mm-rule-pip"></span>
        </label>

        <!-- 6. Ghost Inputs -->
        <label class="mm-rule-chip ${settings.maskInputs !== false ? "active" : ""}" for="mm-chk-inputs" title="Conceal prefilled input fields & passwords until focused">
          <input type="checkbox" id="mm-chk-inputs" class="mm-hidden-chk" ${settings.maskInputs !== false ? "checked" : ""}>
          <div class="mm-rule-chip-inner">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span>Ghost Inputs</span>
          </div>
          <span class="mm-rule-pip"></span>
        </label>

        <!-- 7. Spotlight -->
        <label class="mm-rule-chip ${settings.spotlightMode ? "active" : ""}" for="mm-chk-spotlight" title="Presentation Spotlight beam on hover">
          <input type="checkbox" id="mm-chk-spotlight" class="mm-hidden-chk" ${settings.spotlightMode ? "checked" : ""}>
          <div class="mm-rule-chip-inner">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            <span>Spotlight</span>
          </div>
          <span class="mm-rule-pip"></span>
        </label>

        <!-- 8. Silence Notifications -->
        <label class="mm-rule-chip ${settings.silenceNotifications !== false ? "active" : ""}" for="mm-chk-notifications" title="Silence web alerts & chime sounds while armed">
          <input type="checkbox" id="mm-chk-notifications" class="mm-hidden-chk" ${settings.silenceNotifications !== false ? "checked" : ""}>
          <div class="mm-rule-chip-inner">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
            <span>Silence Audio</span>
          </div>
          <span class="mm-rule-pip"></span>
        </label>
      </div>

      <!-- Tactical Actions Strip -->
      <button id="mm-inpage-panic-btn" class="mm-panic-trigger-btn" title="Emergency screen cover (Alt+Shift+B)">
        <div class="mm-panic-left">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>Emergency Panic Curtain</span>
        </div>
        <kbd class="mm-kbd">Alt+Shift+B</kbd>
      </button>

      <div class="mm-actions-sub-row">
        <button id="mm-inpage-pick-btn" class="mm-action-sub-btn" title="Target and shield specific element on page (Alt+Shift+S)">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
          <span>Target Element</span>
        </button>

        ${customCount > 0 ? `
          <button id="mm-inpage-clear-custom" class="mm-action-sub-btn mm-btn-danger" title="Clear all ${customCount} custom blocked elements on this site">
            <span>Clear (${customCount})</span>
          </button>
        ` : (hasCustomDock ? `
          <button id="mm-inpage-reset-dock" class="mm-action-sub-btn" title="Reset floating dock to default bottom-right position">
            <span>Reset Dock</span>
          </button>
        ` : `
          <div class="mm-hint-pill">
            <span class="mm-hint-pip"></span>
            <span>Hover item to peek</span>
          </div>
        `)}
      </div>
    `;

    // 1. Close Button Handler
    document.getElementById("mm-panel-close-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeInPagePanel();
    });

    // 2. Master Card Click Handler (Card toggles shield scope-aware)
    document.getElementById("mm-inpage-master-card")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (settings.shieldScope === "tab" && currentTabId) {
        let armedTabs = settings.armedTabIds || [];
        const isCurrentlyArmed = armedTabs.includes(currentTabId);
        if (isCurrentlyArmed) {
          armedTabs = armedTabs.filter(id => id !== currentTabId);
        } else {
          armedTabs.push(currentTabId);
        }
        settings.armedTabIds = armedTabs;
        settings.isEnabled = !isCurrentlyArmed;
      } else if (settings.shieldScope === "window" && currentWindowId) {
        let armedList = settings.armedWindowIds || [];
        const isCurrentlyArmed = armedList.includes(currentWindowId);
        if (isCurrentlyArmed) {
          armedList = armedList.filter(id => id !== currentWindowId);
        } else {
          armedList.push(currentWindowId);
        }
        settings.armedWindowIds = armedList;
        settings.isEnabled = !isCurrentlyArmed;
      } else {
        settings.isEnabled = !settings.isEnabled;
      }

      await syncAndSave();
      renderInPagePanelContent();
    });

    // Prevent clicks inside sub-controls strip from bubbling up to master card
    inPagePanelEl.querySelector(".mm-master-sub-controls")?.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // 3. Scope Switch Handlers (Tab vs Window vs Global Isolation)
    document.getElementById("mm-scope-tab")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      settings.shieldScope = "tab";
      if (settings.isEnabled && currentTabId) {
        if (!settings.armedTabIds) settings.armedTabIds = [];
        if (!settings.armedTabIds.includes(currentTabId)) settings.armedTabIds.push(currentTabId);
      }
      await syncAndSave();
      renderInPagePanelContent();
    });

    document.getElementById("mm-scope-window")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      settings.shieldScope = "window";
      if (settings.isEnabled && currentWindowId) {
        if (!settings.armedWindowIds) settings.armedWindowIds = [];
        if (!settings.armedWindowIds.includes(currentWindowId)) settings.armedWindowIds.push(currentWindowId);
      }
      await syncAndSave();
      renderInPagePanelContent();
    });

    document.getElementById("mm-scope-global")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      settings.shieldScope = "global";
      await syncAndSave();
      renderInPagePanelContent();
    });

    // 4. Mode Switch Handlers (Blur vs Lockdown vs Scramble)
    document.getElementById("mm-mode-blur")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      settings.maskMode = "blur";
      await syncAndSave();
      renderInPagePanelContent();
    });

    document.getElementById("mm-mode-lockdown")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      settings.maskMode = "lockdown";
      await syncAndSave();
      renderInPagePanelContent();
    });

    document.getElementById("mm-mode-scramble")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      settings.maskMode = "scramble";
      await syncAndSave();
      renderInPagePanelContent();
    });

    // Scope-arming helper for presets
    const armInPageScope = () => {
      settings.isEnabled = true;
      if (settings.shieldScope === "tab" && currentTabId) {
        if (!settings.armedTabIds) settings.armedTabIds = [];
        if (!settings.armedTabIds.includes(currentTabId)) settings.armedTabIds.push(currentTabId);
      } else if (settings.shieldScope === "window" && currentWindowId) {
        if (!settings.armedWindowIds) settings.armedWindowIds = [];
        if (!settings.armedWindowIds.includes(currentWindowId)) settings.armedWindowIds.push(currentWindowId);
      }
    };

    // 5. Preset Click Handlers
    document.getElementById("mm-preset-demo")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      armInPageScope();
      settings.maskMode = "scramble";
      settings.maskFinancials = true;
      settings.maskAvatars = true;
      settings.maskMessages = true;
      settings.spotlightMode = false;
      await syncAndSave();
      renderInPagePanelContent();
    });

    document.getElementById("mm-preset-meeting")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      armInPageScope();
      settings.maskMode = "lockdown";
      settings.maskMessages = true;
      settings.maskAvatars = true;
      settings.silenceNotifications = true;
      settings.cloakTabs = true;
      settings.spotlightMode = false;
      await syncAndSave();
      renderInPagePanelContent();
    });

    document.getElementById("mm-preset-loom")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      armInPageScope();
      settings.maskMode = "blur";
      settings.maskSecrets = true;
      settings.maskFinancials = true;
      settings.cloakTabs = true;
      settings.spotlightMode = true;
      await syncAndSave();
      renderInPagePanelContent();
    });

    // 6. Rule Checkbox Handlers
    bindInPageCheck("mm-chk-financials", "maskFinancials");
    bindInPageCheck("mm-chk-emails", "maskEmails");
    bindInPageCheck("mm-chk-secrets", "maskSecrets");
    bindInPageCheck("mm-chk-messages", "maskMessages");
    bindInPageCheck("mm-chk-avatars", "maskAvatars");
    bindInPageCheck("mm-chk-inputs", "maskInputs");
    bindInPageCheck("mm-chk-spotlight", "spotlightMode");
    bindInPageCheck("mm-chk-notifications", "silenceNotifications");

    // 7. Tactical Emergency Panic Button Handler
    document.getElementById("mm-inpage-panic-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeInPagePanel();
      togglePanicCurtain();
    });

    // 8. Element Picker Trigger
    document.getElementById("mm-inpage-pick-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeInPagePanel();
      startElementPicker();
    });

    // 9. Reset Dock Button Handler
    document.getElementById("mm-inpage-reset-dock")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await resetDockPosition();
      renderInPagePanelContent();
    });

    // 10. Clear Custom Blocks Handler
    document.getElementById("mm-inpage-clear-custom")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (settings.domainOverrides && settings.domainOverrides[host]) {
        delete settings.domainOverrides[host];
        await syncAndSave();
        removeDomainCustomBlocks();
        renderInPagePanelContent();
      }
    });
  }

  /**
   * Presentation Spotlight Beam Mode
   */
  function updateSpotlightState() {
    if (settings.isEnabled && settings.spotlightMode) {
      enableSpotlightMode();
    } else {
      disableSpotlightMode();
    }
  }

  function enableSpotlightMode() {
    if (!spotlightBackdropEl) {
      spotlightBackdropEl = document.createElement("div");
      spotlightBackdropEl.id = "meetingmode-spotlight-backdrop";
      document.body.appendChild(spotlightBackdropEl);
    }
    spotlightBackdropEl.classList.add("active");
    document.addEventListener("mouseover", onSpotlightHover, true);
  }

  function disableSpotlightMode() {
    if (spotlightBackdropEl) {
      spotlightBackdropEl.classList.remove("active");
    }
    if (currentSpotlightEl) {
      currentSpotlightEl.classList.remove("mm-spotlight-target");
      currentSpotlightEl = null;
    }
    document.removeEventListener("mouseover", onSpotlightHover, true);
  }

  function onSpotlightHover(e) {
    if (!settings.isEnabled || !settings.spotlightMode) return;
    const target = e.target;
    if (!target || target === document.body || target === document.documentElement) return;
    if (target.closest("#meetingmode-floating-dock") || target.closest("#meetingmode-inpage-panel") || target.closest("#meetingmode-spotlight-backdrop") || target.closest("#meetingmode-picker-banner")) {
      return;
    }

    const card = target.closest("article, section, tr, li, div[class*='card'], div[role='row'], div[role='listitem']") || target;
    if (currentSpotlightEl === card) return;

    if (currentSpotlightEl) {
      currentSpotlightEl.classList.remove("mm-spotlight-target");
    }
    currentSpotlightEl = card;
    currentSpotlightEl.classList.add("mm-spotlight-target");
  }

  function bindInPageCheck(elementId, settingKey) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.addEventListener("change", async (e) => {
      e.stopPropagation();
      settings[settingKey] = e.target.checked;
      const parentLabel = el.closest(".mm-rule-chip");
      if (parentLabel) {
        parentLabel.classList.toggle("active", e.target.checked);
      }
      await syncAndSave();
    });
  }

  async function syncAndSave() {
    applyShieldState();
    await chrome.storage.local.set({ meetingModeSettings: settings });
    chrome.runtime.sendMessage({ type: "STATE_CHANGED", settings });
  }

  function updateInPagePanelUI() {
    if (isPanelOpen()) {
      renderInPagePanelContent();
    }
  }

  /**
   * Unmasks and restores all elements
   */
  function unmaskAllElements() {
    // 0. Remove root classes for CSP-immune extension stylesheet
    document.documentElement.classList.remove(
      "shield-armed",
      "shield-armed-messages",
      "shield-armed-media",
      "shield-armed-avatars",
      "shield-notifications-silenced",
      "shield-lockdown",
      "shield-alt-held"
    );

    // 1. Text node restorations from Set
    maskedElements.forEach((span) => {
      if (span && span.parentNode) {
        const original = span.getAttribute("data-mm-original");
        if (original !== null) {
          const textNode = document.createTextNode(original);
          span.parentNode.replaceChild(textNode, span);
        }
      }
    });
    maskedElements.clear();

    // 2. Extra safety sweep for any leftover spans in DOM
    document.querySelectorAll(".shield-masked-blur, .shield-masked-scramble").forEach((span) => {
      if (span && span.parentNode) {
        const original = span.getAttribute("data-mm-original");
        if (original !== null) {
          const textNode = document.createTextNode(original);
          span.parentNode.replaceChild(textNode, span);
        } else {
          span.classList.remove("shield-masked-blur", "shield-masked-scramble", "shield-revealed", "shield-locked-revealed");
        }
      }
    });

    // 3. Remove ghost input cloaking
    removeInputCloaking();

    // 4. Remove zero-delay CSS
    const styleEl = document.getElementById("meetingmode-css-shield");
    if (styleEl) styleEl.remove();

    // 5. Remove custom domain blocked element wrappers
    removeDomainCustomBlocks();

    // 6. Restore original tab title and favicon
    uncloakActiveTab();

    // 7. Disable spotlight mode
    disableSpotlightMode();
  }

  /**
   * Mutation Observer for SPAs & Dynamic Chats (Messenger, WhatsApp, Stripe)
   */
  function setupMutationObserver() {
    if (mutationObserver) mutationObserver.disconnect();

    mutationObserver = new MutationObserver(() => {
      if (!settings.isEnabled) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        scanAndMaskDocument();
        applyDomainCustomBlocks();
        if (settings.maskInputs !== false) {
          applyInputCloaking();
        }
      }, 100);
    });

    if (document.body) {
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  /**
   * Tab Cloaker
   */
  function cloakActiveTab() {
    if (isTabCloaked) return;
    originalTitle = document.title;

    const faviconLink = document.querySelector("link[rel*='icon']");
    if (faviconLink) {
      originalFaviconHref = faviconLink.href;
      faviconLink.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><circle cx='8' cy='8' r='7' fill='%2364748b'/></svg>";
    } else {
      const newFavicon = document.createElement("link");
      newFavicon.id = "meetingmode-cloaked-favicon";
      newFavicon.rel = "icon";
      newFavicon.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><circle cx='8' cy='8' r='7' fill='%2364748b'/></svg>";
      (document.head || document.documentElement).appendChild(newFavicon);
    }

    document.title = "Workspace • Dashboard";
    isTabCloaked = true;

    // Observe title to prevent dynamic apps (Slack, Messenger, Discord) from leaking unread message previews
    const targetTitleEl = document.querySelector("title") || document.head;
    if (targetTitleEl) {
      if (titleObserver) titleObserver.disconnect();
      titleObserver = new MutationObserver(() => {
        if (isTabCloaked) {
          if (document.title !== "Workspace • Dashboard") {
            document.title = "Workspace • Dashboard";
          }
        } else if (document.title && document.title !== "Workspace • Dashboard") {
          originalTitle = document.title;
        }
      });
      titleObserver.observe(targetTitleEl, { childList: true, subtree: true, characterData: true });
    }
  }

  function uncloakActiveTab() {
    if (!isTabCloaked) return;
    if (titleObserver) {
      titleObserver.disconnect();
      titleObserver = null;
    }
    if (originalTitle) document.title = originalTitle;

    const customFavicon = document.getElementById("meetingmode-cloaked-favicon");
    if (customFavicon) customFavicon.remove();

    const faviconLink = document.querySelector("link[rel*='icon']");
    if (faviconLink && originalFaviconHref) {
      faviconLink.href = originalFaviconHref;
    }
    isTabCloaked = false;
  }

  /**
   * Domain-Specific Custom Element Masking & Unshielding
   */
  function applyDomainCustomBlocks() {
    if (!settings.isEnabled) {
      removeDomainCustomBlocks();
      return;
    }
    const host = window.location.hostname;
    const selectors = settings.domainOverrides?.[host] || [];

    document.querySelectorAll(".shield-custom-blocked").forEach((el) => {
      const currentSel = el.getAttribute("data-mm-selector");
      if (!selectors.includes(currentSel)) {
        removeSingleBlock(el);
      }
    });

    for (const sel of selectors) {
      try {
        document.querySelectorAll(sel).forEach((el) => {
          blockCustomElement(el, sel);
        });
      } catch (err) {}
    }
  }

  function isExtensionUi(target) {
    if (!target) return true;
    return target === pickerBanner || Boolean(target.closest("#meetingmode-picker-banner, #meetingmode-floating-dock, #meetingmode-inpage-panel, #meetingmode-panic-curtain, #meetingmode-spotlight-backdrop, #meetingmode-clipboard-toast"));
  }

  function blockCustomElement(el, selector) {
    if (!el || !el.classList || el.classList.contains("shield-custom-blocked")) return;
    if (isExtensionUi(el)) return;

    el.classList.add("shield-custom-blocked");
    el.setAttribute("data-mm-selector", selector);

    const tag = (el.tagName || "").toLowerCase();
    const isVoid = ["img", "input", "textarea", "video", "hr", "br", "select", "canvas"].includes(tag);
    if (!isVoid) {
      let btn = el.querySelector(":scope > .shield-unshield-trigger");
      if (!btn) {
        btn = document.createElement("button");
        btn.className = "shield-unshield-trigger";
        btn.textContent = "Unshield";
        btn.title = "Click to unmask this element";
        btn.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await unshieldCustomElement(el, selector);
        });
        el.appendChild(btn);
      }
    }
  }

  async function unshieldCustomElement(el, selector) {
    removeSingleBlock(el);

    const host = window.location.hostname;
    if (settings.domainOverrides && settings.domainOverrides[host]) {
      settings.domainOverrides[host] = settings.domainOverrides[host].filter(s => s !== selector);
      if (settings.domainOverrides[host].length === 0) {
        delete settings.domainOverrides[host];
      }
      await syncAndSave();
    }
  }

  function removeSingleBlock(el) {
    el.classList.remove("shield-custom-blocked");
    el.removeAttribute("data-mm-selector");
    const btn = el.querySelector(":scope > .shield-unshield-trigger");
    if (btn) btn.remove();
  }

  function removeDomainCustomBlocks() {
    document.querySelectorAll(".shield-custom-blocked").forEach((el) => {
      removeSingleBlock(el);
    });
  }

  /**
   * Element Picker
   */
  function startElementPicker() {
    if (isPickerActive) return;
    isPickerActive = true;

    pickerBanner = document.createElement("div");
    pickerBanner.id = "meetingmode-picker-banner";
    pickerBanner.innerHTML = `
      <span class="mm-banner-dot"></span>
      <span id="mm-picker-status-text">Click element to shield • Click red to unshield</span>
      <kbd>ESC</kbd>
    `;
    document.body.appendChild(pickerBanner);

    document.addEventListener("mouseover", onPickerHover, true);
    document.addEventListener("mouseout", onPickerUnhover, true);
    document.addEventListener("click", onPickerClick, true);
    window.addEventListener("keydown", onPickerKeyDown, true);
  }

  function stopElementPicker() {
    if (!isPickerActive) return;
    isPickerActive = false;

    if (pickerBanner && pickerBanner.parentNode) {
      pickerBanner.parentNode.removeChild(pickerBanner);
    }
    pickerBanner = null;

    if (hoveredPickerEl) {
      hoveredPickerEl.classList.remove("shield-picker-hover", "shield-picker-hover-blocked");
      hoveredPickerEl = null;
    }

    document.removeEventListener("mouseover", onPickerHover, true);
    document.removeEventListener("mouseout", onPickerUnhover, true);
    document.removeEventListener("click", onPickerClick, true);
    window.removeEventListener("keydown", onPickerKeyDown, true);
  }

  function onPickerHover(e) {
    if (!isPickerActive) return;
    const target = e.target;
    if (isExtensionUi(target)) return;

    if (hoveredPickerEl && hoveredPickerEl !== target) {
      hoveredPickerEl.classList.remove("shield-picker-hover", "shield-picker-hover-blocked");
    }
    hoveredPickerEl = target;

    const isAlreadyBlocked = target.closest(".shield-custom-blocked");
    if (isAlreadyBlocked) {
      target.classList.add("shield-picker-hover-blocked");
      const statusText = document.getElementById("mm-picker-status-text");
      if (statusText) statusText.textContent = "Click to UNSHIELD this element";
    } else {
      target.classList.add("shield-picker-hover");
      const statusText = document.getElementById("mm-picker-status-text");
      if (statusText) statusText.textContent = "Click to SHIELD this element";
    }
  }

  function onPickerUnhover(e) {
    if (!isPickerActive) return;
    if (e.target && e.target.classList && !isExtensionUi(e.target)) {
      e.target.classList.remove("shield-picker-hover", "shield-picker-hover-blocked");
    }
  }

  async function onPickerClick(e) {
    if (!isPickerActive) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    if (isExtensionUi(target)) return;

    target.classList.remove("shield-picker-hover", "shield-picker-hover-blocked");

    const blockedParent = target.closest(".shield-custom-blocked");
    if (blockedParent) {
      const sel = blockedParent.getAttribute("data-mm-selector");
      await unshieldCustomElement(blockedParent, sel);
      stopElementPicker();
      return;
    }

    const selector = generateUniqueSelector(target);
    const host = window.location.hostname;

    if (!settings.domainOverrides) settings.domainOverrides = {};
    if (!settings.domainOverrides[host]) settings.domainOverrides[host] = [];

    if (!settings.domainOverrides[host].includes(selector)) {
      settings.domainOverrides[host].push(selector);
      await syncAndSave();
      blockCustomElement(target, selector);
    }

    stopElementPicker();
  }

  function onPickerKeyDown(e) {
    if (e.key === "Escape") {
      stopElementPicker();
    }
  }

  function generateUniqueSelector(el) {
    if (el.id && typeof el.id === "string" && el.id.trim() && !el.id.startsWith("meetingmode-")) {
      try {
        const idSel = `#${CSS.escape(el.id.trim())}`;
        if (document.querySelectorAll(idSel).length === 1) {
          return idSel;
        }
      } catch (e) {}
    }

    let path = [];
    let current = el;
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body && current !== document.documentElement) {
      let tag = current.nodeName.toLowerCase();
      let selector = tag;

      let classString = "";
      if (typeof current.className === "string") {
        classString = current.className;
      } else if (current.className && typeof current.className.baseVal === "string") {
        classString = current.className.baseVal;
      }

      if (classString) {
        const cleanClasses = classString.split(/\s+/).filter(c => !c.startsWith("shield-") && !c.startsWith("mm-") && c.length > 0);
        if (cleanClasses.length > 0) {
          try {
            selector += `.${CSS.escape(cleanClasses[0])}`;
          } catch (e) {}
        }
      }

      if (current.parentNode) {
        const siblings = Array.from(current.parentNode.children).filter(child => child.nodeName.toLowerCase() === tag);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      path.unshift(selector);
      current = current.parentNode;

      try {
        const partial = path.join(" > ");
        if (document.querySelectorAll(partial).length === 1) {
          return partial;
        }
      } catch (e) {}
    }

    return path.join(" > ");
  }

  /**
   * Message Listener
   */
  function listenForMessages() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "STATE_CHANGED") {
        settings = Object.assign(settings, message.settings);
        applyShieldState();
        sendResponse({ success: true, count: maskedElements.size });
      }

      if (message.type === "SPOTLIGHT_TOGGLED") {
        settings.spotlightMode = message.spotlightMode;
        updateSpotlightState();
        updateInPagePanelUI();
        sendResponse({ success: true, spotlightMode: settings.spotlightMode });
      }

      if (message.type === "GET_STATS") {
        const host = window.location.hostname;
        const customCount = settings.domainOverrides?.[host]?.length || 0;
        sendResponse({
          isEnabled: settings.isEnabled,
          count: maskedElements.size,
          customCount,
          host
        });
      }

      if (message.type === "CLEAR_DOMAIN_CUSTOM") {
        const host = window.location.hostname;
        if (settings.domainOverrides && settings.domainOverrides[host]) {
          delete settings.domainOverrides[host];
          chrome.storage.local.set({ meetingModeSettings: settings });
          removeDomainCustomBlocks();
        }
        sendResponse({ success: true });
      }

      if (message.type === "START_PICKER") {
        startElementPicker();
        sendResponse({ success: true });
      }

      if (message.type === "STOP_PICKER") {
        stopElementPicker();
        sendResponse({ success: true });
      }

      if (message.type === "TOGGLE_PANIC") {
        togglePanicCurtain();
        sendResponse({ success: true, isConcealed: isPanicCurtainActive() });
      }

      return true;
    });
  }
})();
