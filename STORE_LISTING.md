# Chrome Web Store Listing Package: MeetingMode

This document contains all metadata, store copy, permission justifications, and category details required to submit MeetingMode to the Chrome Web Store Developer Dashboard.

---

## 1. Store Metadata

- **Extension Name (Max 45 chars):**
  `MeetingMode - Screen Share Privacy Shield`
- **Short Name (Max 12 chars):**
  `MeetingMode`
- **Version:**
  `1.0.0`
- **Primary Category:**
  `Productivity`
- **Secondary Category:**
  `Developer Tools`
- **Language:**
  `English (United States)`
- **Website URL:**
  `https://github.com/SaucesCode/meeting-mode`
- **Privacy Policy URL:**
  `https://github.com/SaucesCode/meeting-mode/blob/main/PRIVACY.md`
- **Support URL:**
  `https://github.com/SaucesCode/meeting-mode/issues`

---

## 2. Store Descriptions

### Short Description (Max 132 chars):
Zero-click privacy shield for screen sharing & demos. Automatically masks financials, emails, API keys, chats, and tab titles.

### Detailed Store Description:
Present with total confidence. MeetingMode is a high-precision privacy shield designed for professionals, developers, and founders who share their screens on Google Meet, Zoom, Microsoft Teams, Slack Huddles, and Loom.

Stop worrying about accidental data leaks. MeetingMode automatically identifies and cloaks sensitive personal identifiable information (PII), confidential client balances, API tokens, and private chat messages in real time with zero layout shift.

KEY CAPABILITIES:

1. Automatic Messaging & Chat Shield (0ms CSS Engine)
- Instantly blurs chat bubbles, text messages, photo attachments, and user avatars across Facebook, Messenger, Discord, Slack, WhatsApp Web, Telegram, and Microsoft Teams.
- Immune to website Content Security Policies (CSP).

2. Screen Share Lockdown Mode (Blur for Both)
- Designed specifically for full-screen presentations on a single monitor.
- Keeps private messages 100% blurred for both you and call viewers.
- Disables accidental mouse hover reveals while you present.
- Deliberate Presenter Peek: Hold the Alt key while hovering to momentarily inspect an incoming message without leaking it to the audience.

3. Granular PII & Financial Masking
- Financials: Auto-masks dollar figures, account balances, MRR, invoices, and transaction totals.
- Emails & User Accounts: Shields customer emails and user handles.
- API Secrets: Conceals Bearer tokens, private JWTs, and AWS/Stripe keys.
- Ghost Inputs: Auto-cloaks prefilled password and form input fields until explicitly focused.

4. Multi-Monitor & Shield Scope Isolation
- "This Tab" Scope: Protects only your active presentation tab (ideal for Google Meet "A Tab" sharing).
- "This Window" Scope: Shields only the presentation window, leaving notes and chats completely visible on your second monitor.
- "All Windows" Scope: Universal protection across all monitors for full desktop sharing.

5. Emergency Panic Curtain (Alt + Shift + B)
- Instantly drops a blackout privacy screen over your browser with a single keystroke if an unexpected tab opens. Press Escape to dismiss.

6. Presentation Spotlight Beam (Alt + Shift + P)
- Dims peripheral screen noise to 85% opacity, focusing viewer attention exclusively on the element or card under your cursor.

7. Clipboard Privacy Guard
- Automatically sanitizes the clipboard buffer when copying from masked elements, preventing accidental paste leaks during demos.

8. Synthetic Scramble Mode
- Replaces sensitive values with realistic deterministic dummy data, perfect for clean, natural client demos.

PRIVACY & SECURITY GUARANTEE:
- 100% Local Execution: MeetingMode runs entirely inside your browser sandbox.
- Zero Data Collection: No tracking, no analytics, no external servers, and no network requests.
- Open Source: Fully transparent codebase verified on GitHub.

KEYBOARD SHORTCUTS:
- Alt + Shift + M: Toggle Privacy Shield ON / OFF
- Alt + Shift + B: Emergency Screen Panic Curtain
- Alt + Shift + P: Presentation Spotlight Beam
- Alt + Shift + S: Target Specific Element to Mask
- Hold Alt: Presenter Stealth Peek in Lockdown Mode

---

## 3. Chrome Web Store Permission Justifications

Copy and paste these exact explanations into the Chrome Developer Dashboard permission justification fields:

### Justification for `<all_urls>` (Host Permission):
MeetingMode is a presentation privacy utility that masks sensitive data (customer emails, financial balances, API secrets, and private chat messages) across any webpage where the user shares their screen (such as dashboards, Stripe, PayPal, Messenger, Facebook, Discord, Slack, and Google Meet). The extension must run content scripts on these websites to apply CSS blur filters and synthetic masking to the local DOM. All DOM modifications occur locally on the user's device, and no page data is ever extracted, collected, or transmitted.

### Justification for `storage`:
Used exclusively to save the user's local privacy preferences (such as light/dark theme, active presets, custom blocked element selectors, and cloaking keywords) locally on the device using chrome.storage.local.

### Justification for `tabs`:
Required to identify the active presentation tab and window ID to enforce the user's selected Shield Scope ("This Tab" vs "This Window" vs "All Windows"), ensuring that only the shared presentation window is masked while private windows on secondary monitors remain readable.

### Justification for `activeTab`:
Used when the user invokes the extension popup, keyboard shortcut, or context menu to apply privacy masking directly to the currently active page.

### Justification for `contextMenus`:
Provides quick-access right-click actions ("Toggle Privacy Shield", "Screen Share Lockdown Mode", "Emergency Panic Curtain") so presenters can shield their screen immediately without needing to open the popup interface.

---

## 4. Recommended Search Tags

1. screen share
2. privacy shield
3. blur
4. presentation
5. data cloaker
6. discord
7. messenger
8. demo mode

---

## 5. Store Asset Specifications

- **Small Promo Tile:** 440 x 280 px (PNG, 24-bit, no alpha)
- **Store Screenshots (At least 1 required, 5 recommended):** 1280 x 800 px (PNG, 24-bit)
  - Screenshot 1: Tactical HUD & Preset Switcher (Client Demo, Team Meet, Loom Beam)
  - Screenshot 2: Real-time Chat & Avatar Masking on Messenger / Discord
  - Screenshot 3: Financial ($) and Email Data Cloaker in action
  - Screenshot 4: Presentation Spotlight Beam Mode focusing on demo content
  - Screenshot 5: Emergency Panic Curtain (Alt + Shift + B)
- **Marquee Tile (Optional for featuring):** 1400 x 560 px (PNG, 24-bit)
