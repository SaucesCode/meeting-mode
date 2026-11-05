# MeetingMode - Presentation Shield & Data Cloaker

[![Available in Microsoft Edge Add-ons](https://img.shields.io/badge/Microsoft%20Edge%20Add--ons-Available%20Now-0078D7?logo=microsoft-edge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/meetingmode-screen-shar/pnfahfnonohbgnbgdalegoicoldkbkno)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-10b981.svg)](manifest.json)
[![Privacy: 100% Local](https://img.shields.io/badge/Privacy-100%25%20Local-emerald.svg)](PRIVACY.md)

> **Zero-click privacy shield for screen sharing, Loom recordings, and client demos.** Automatically masks financials, customer emails, API keys, and sensitive chat messages in real time with zero manual clicking.

Official Store Listing: **[Microsoft Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/detail/meetingmode-screen-shar/pnfahfnonohbgnbgdalegoicoldkbkno)**

---

## Why MeetingMode?

Whenever you share your screen on Google Meet, Microsoft Teams, Zoom, or Slack, or record a Loom video:
1. **Financial Leaks:** Bank balances, Stripe MRR, and transaction amounts are exposed.
2. **PII Violations:** Customer emails and phone numbers show up across dashboards.
3. **Secret Exposures:** API keys (`sk_live_...`) or bearer tokens accidentally stay visible in open tabs.
4. **Chat & Message Leaks:** Coworker messages, DMs, or sensitive client notifications pop up.

Existing extensions require you to manually click every single element or draw clumsy boxes. **MeetingMode** introduces **Zero-Click Smart Heuristics**: toggle the master shield once, and all sensitive data is masked automatically across all tabs.

---

## Installation

### Option 1: Microsoft Edge Add-ons Store (Recommended)
Install MeetingMode directly from the official store in one click:
**[Install MeetingMode from Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/meetingmode-screen-shar/pnfahfnonohbgnbgdalegoicoldkbkno)**

*(Works out of the box in Microsoft Edge, Google Chrome, Brave, Arc, and all Chromium browsers).*

### Option 2: Load Unpacked (Developer Mode)
1. Clone or download this repository.
2. Open your browser and navigate to:
   ```text
   edge://extensions  (or chrome://extensions)
   ```
3. Enable **Developer mode** toggle in the left/top sidebar.
4. Click **Load unpacked** and select the extension directory.
5. Pin **MeetingMode** to your browser toolbar.

---

## Key Features

* **Screen Share Lockdown Mode ("Blur for Both"):**
  * Built specifically for full-screen sharing on a single monitor.
  * Disables accidental mouse hover reveals while you present. Messages and avatars stay 100% blurred for both you and call attendees.
  * **Deliberate Presenter Peek:** Hold the <kbd>Alt</kbd> key while hovering over a message to momentarily inspect an incoming chat without leaking it to your audience.
* **Auto-Shield for Facebook, Messenger, Discord, WhatsApp, Slack & Teams (0ms CSS Engine):**
  * Automatically blurs message bubbles, header popover flyouts, conversation snippets, channel text, and chat docks across all major communication apps.
  * Built on high-priority CSS rules immune to website Content Security Policies (CSP).
  * Automatically cloaks media attachments, photo embeds, file thumbnails, and user avatars with deep frosted privacy blur.
* **Granular PII & Financial Masking:**
  * **Financials:** Auto-detects currency formats (`$14,250.00`, `EUR 450`, `GBP 1.2M`, MRR, account balances).
  * **Identity & PII:** Auto-masks customer emails (`*@*.com`) and user handles.
  * **Secrets & Keys:** Auto-shields API keys (`sk_live_...`, `ghp_...`, bearer tokens).
  * **Ghost Form Inputs:** Conceals prefilled password and form input fields until explicitly focused.
* **3-Way Presentation Scope ("This Tab" vs "This Window" vs "All Windows"):**
  * **This Tab:** Shields only the active tab (ideal for single tab screen shares).
  * **This Window (Default):** Shields all tabs in the presentation window while leaving your second monitor notes completely unshielded.
  * **All Windows:** Universal protection across all monitors for full desktop sharing.
* **Emergency Panic Curtain (<kbd>Alt+Shift+B</kbd>):**
  * If an unexpected tab or window opens while sharing your screen, press **<kbd>Alt+Shift+B</kbd>** to drop an instant blackout privacy curtain. Press <kbd>Esc</kbd> to dismiss.
* **Clipboard Privacy Shield (Synthetic Copy Protection):**
  * Automatically sanitizes copied text from masked elements, preventing accidental paste leaks during demos.
* **Deterministic Demo Scramble:**
  * Replaces sensitive numbers, emails, and balances with realistic deterministic dummy data, keeping tables and charts looking completely natural during client demos.
* **Presentation Spotlight Beam Mode (<kbd>Alt+Shift+P</kbd>):**
  * Dims peripheral screen noise to 85% opacity, focusing viewer attention exclusively on the element or card under your cursor.
* **In-Page Floating Tactical Dock & Modal HUD:**
  * Discreet floating shield pill in the bottom-right corner of any page.
  * Click to open the HUD right on the page without having to reach for the browser toolbar.
* **Web Notification Silencer:**
  * Automatically suppresses in-page toast alert popups and mutes notification chimes while the shield is armed.
* **Browser Context Menus:**
  * Right-click shortcut actions to toggle shield, switch to lockdown mode, engage panic curtain, or pick a custom element to mask.

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Alt + Shift + M` | Toggle Master Privacy Shield ON / OFF |
| `Alt + Shift + B` | Emergency Panic Curtain (Blackout) |
| `Alt + Shift + P` | Presentation Spotlight Beam |
| `Alt + Shift + S` | Element Inspector (Pick element to mask) |
| `Hold Alt` | Presenter Stealth Peek in Lockdown Mode |
| `Esc` | Close HUD, Dismiss Panic Curtain, or Exit Spotlight |

---

## Privacy & Security Guarantee

* **100% Client-Side Execution:** MeetingMode runs entirely inside your local browser sandbox.
* **Zero Data Collection:** No tracking, no telemetry, no cookies, no analytics, no external servers, and no network requests.
* **Open Source:** Fully transparent codebase verified on GitHub.

---

## License

MIT License. Free for personal and commercial use.
