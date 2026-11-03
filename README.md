# MeetingMode • Presentation Shield & Data Cloaker

> **Zero-click privacy shield for screen sharing, Loom recordings, and client demos.** Automatically masks financials, customer emails, API keys, and sensitive tab titles with zero manual clicking.

---

## Why MeetingMode?

Whenever you share your screen on Google Meet, Zoom, or Slack, or record a Loom video:
1. **Financial Leaks:** Bank balances, Stripe MRR, and transaction amounts are exposed.
2. **PII Violations:** Customer emails and phone numbers show up across dashboards.
3. **Secret Exposures:** API keys (`sk_live_...`) or bearer tokens accidentally stay visible in open tabs.
4. **Embarrassing Tab Titles:** Viewers can read your open tab names and bookmarks at the top of the browser.

Existing extensions require you to manually click every single element or draw clumsy boxes. **MeetingMode** introduces **Zero-Click Smart Heuristics**: toggle the master shield once, and all sensitive data is masked automatically across all tabs.

---

## Key Features

* **3-Way Presentation Scope ("Tab" vs "Window" vs "All Windows"):**
  * Matches Google Meet & Teams screen-sharing models:
    * **This Tab ("A Tab"):** Only the selected active tab is shielded. When you switch to another tab in the same window (e.g. your private dashboard or reference notes), it remains 100% clean and unmasked!
    * **This Window ("A Window", Default):** Shields all tabs in the presentation window while leaving your second monitor notes completely unshielded.
    * **All Windows ("Entire Screen"):** Automatically shields every tab across all browser windows and monitors.
  * As you switch tabs or monitors, the toolbar badge dynamically updates (`SAFE` on armed tabs/windows, standby on unmasked tabs).
* **Emergency Panic Curtain (<kbd>Alt+Shift+B</kbd>):**
  * When an unexpected private popover, billing prompt, or confidential email opens while sharing your screen, press **<kbd>Alt+Shift+B</kbd>** (Mac: <kbd>Option+Shift+B</kbd>) to instantly drop a full-screen frosted privacy curtain:
    * Displays a sleek tactical screen pause card: *"Presentation Paused • All screen contents, messages, and confidential data concealed"*.
    * Dismisses instantly when you press <kbd>Esc</kbd>, press <kbd>Alt+Shift+B</kbd> again, or click anywhere on the screen.
* **Ghost Form & Password Input Cloaking:**
  * Web forms, CRM lead fields, and checkout pages often preload sensitive phone numbers, credit card tokens, passwords, or personal addresses in text boxes.
  * Ghost Input Cloaking automatically conceals pre-filled form values with a frosted privacy overlay (`••••••••`).
  * The moment you click or tab into an input to edit, it smoothly unmasks for crisp typing, and re-cloaks on blur.
* **Zero-Click Auto Heuristics:**
  * **Financial Masking:** Automatically detects currency formats (`$14,250.00`, `€450`, `£1.2M`, MRR, account balances).
  * **Identity & PII:** Automatically masks user emails (`*@*.com`) and phone numbers.
  * **Secrets & Keys:** Automatically shields API keys (`sk_live_...`, `ghp_...`, bearer tokens).
  * **Auto-Shield for Facebook, Messenger, Discord, WhatsApp, Slack & Teams:**
    * Automatically blurs message bubbles, header popover flyouts, conversation snippets, channel text, and chat docks across:
      * **Facebook & Messenger** (`facebook.com`, `messenger.com` - header dropdown flyout, conversation previews, floating ChatTabs, messages)
      * **Discord** (`discord.com` - channels, DMs, message content, replies, embeds)
      * **WhatsApp Web** (`web.whatsapp.com` - message list, chat bubbles)
      * **Slack** (`slack.com`, `app.slack.com` - channels, DMs, threads)
      * **Telegram Web** (`web.telegram.org` - dialogs, message bubbles)
      * **Microsoft Teams** (`teams.microsoft.com` - chat panes, thread posts)
      * **Instagram Direct** (`instagram.com` - inbox, direct messages)
      * **Twitter / X DMs** (`x.com`, `twitter.com` - direct message drawer)
      * **Google Chat & Meet** (`mail.google.com`, `chat.google.com`, `meet.google.com`)
    * **Hover to Read:** Moving your mouse over any message unblurs it instantly so *you* can read and reply, and it re-blurs the millisecond your mouse moves away!
  * **Confidential Keywords:** Add custom project codenames (e.g. *"Project Titan"*, *"Acme Corp"*) in options to mask them everywhere.
* **Instant Hover-to-Peek (Zero Clicks Needed):**
  * **Simply hover your mouse** over any blurred price, email, or chat message to reveal it instantly! Move your mouse away, and it re-blurs immediately.
  * Click on any item if you want to lock the reveal open while typing or presenting.
* **In-Page Floating Tactical Dock & Modal HUD:**
  * A persistent discreet floating shield pill (`● Shield: ON`) in the bottom-right corner of any page.
  * **Click the bottom shield to open the In-Page Tactical HUD Modal** right on the page without having to reach up to the Chrome toolbar!
  * **Effortless Closing:** Close the HUD anytime by clicking the close button, clicking anywhere outside on the page, pressing <kbd>Esc</kbd>, or clicking the shield pill again.
  * Toggle master shield, enable/disable chat apps or financials, trigger element inspector, or clear site blocks in one tap.
* **Zero-Delay Synchronous CSS Scroll Masking:**
  * Uses pure injected CSS layout rules applied prior to the first browser frame render.
  * Newly scrolled messages on Facebook, Messenger, Discord, Slack, and WhatsApp are blurred with **0ms delay**, eliminating any unblurred scroll flashes.
* **Avatar & Profile Picture Cloaker:**
  * Automatically applies a sleek monochromatic frosted blur over user avatars and profile pictures across Discord, Facebook, Slack, WhatsApp, Twitter/X, and Teams so teammates or clients' personal pictures are not exposed.
  * **Hover to Peek:** Simply hover over any avatar to peek and see who it is.
* **Auto-Arm on Meeting Apps & Sensitive Portals:**
  * **Zero-thought security:** Automatically arms the privacy shield the moment you open **Google Meet**, **Zoom**, **MS Teams**, or **Loom**.
  * **Always-Cloaked Domains:** Add sensitive portals (e.g. `stripe.com`, `paypal.com`, `quickbooks.intuit.com`) in Options to always auto-arm upon navigation.
* **Draggable & Snappable Floating Dock:**
  * Click and drag the floating shield anywhere along the edges of your screen so it never covers important website buttons (like Intercom or bottom controls).
  * Automatically saves its position per session. Double-click the dock anytime to snap it back to the bottom-right corner!
* **Deterministic "Photo-Real" Demo Scramble:**
  * In Demo Scramble mode, numbers, emails, and balances use seeded deterministic hashing. `$14,250.00` always maps consistently to the same realistic figure, ensuring tables, charts, and metrics look 100% authentic throughout a 30-minute client demo.
* **Presentation Spotlight Beam Mode (<kbd>Alt+Shift+P</kbd>):**
  * Smoothly dims the rest of the webpage by 45% with a cinematic backdrop and casts a high-focus spotlight beam over the specific card, table row, or element your cursor is hovering over, commanding your audience's attention.
* **Web Notification & Tab Sound Silencer:**
  * Automatically suppresses in-page toast alert popups and mutes notification chimes while the shield is armed, preventing awkward notification interruptions during presentations.
* **Instant One-Click Presets:**
  * **Client Demo:** Demo Scramble ON, Financials masked, Avatars cloaked.
  * **Team Meet:** Frosted Blur ON, Chat apps cloaked, Notifications silenced.
  * **Loom Beam:** Tab title cloaked, Secrets masked, Presentation Spotlight ON.
* **Frictionless Click-to-Peek:**
  * **Click any blurred or scrambled item directly** to instantly reveal the real value for yourself (highlighted with an emerald dashed outline). Click it again to re-mask!
  * You can also hold <kbd>Alt</kbd> or <kbd>Shift</kbd> while hovering to peek temporarily.
* **Effortless Unshielding (3 Ways to Undo):**
  1. **Direct On-Page Button:** Every custom-shielded element has a floating `[ Unshield ]` button in its top-right corner. Click it to unmask immediately.
  2. **Toggle in Inspector (<kbd>Alt+Shift+S</kbd>):** When targeting elements, already-shielded elements highlight in red. Click any red element to unshield it.
  3. **1-Click Reset in Popup:** If a domain has custom element blocks, the popup displays `[ 2 custom blocks on this site ] [ Clear All ]` to wipe them in 1 tap.
* **Tab Title Cloaker:**
  * Disguises your active browser tab title as `"Workspace • Dashboard"` and neutralizes the favicon so viewers cannot read private page names.
* **Custom Element Inspector (<kbd>Alt+Shift+S</kbd>):**
  * Want to shield a specific card, sidebar, or widget? Press <kbd>Alt+Shift+S</kbd>, hover over the element, and click to shield it. The rule is saved per-domain.
* **Keyboard Hotkey (<kbd>Alt+Shift+M</kbd>):**
  * Instantly arm or disarm the screen shield from anywhere without opening the popup.
* **Anti-Slop Design:**
  * Clean tactical Linear/Raycast aesthetic.
  * Full Light and Dark mode support.
  * Custom vector SVG icons (zero emojis).

---

## Quick Installation Guide

1. Open your browser and navigate to:
   ```text
   chrome://extensions
   ```
2. In the top-right corner, turn **Developer mode** to **ON**.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the folder:
   ```text
   c:\Users\CARE MBA\Desktop\Extensions\meeting-mode
   ```
5. **Pin the extension:** Click the puzzle piece icon in your Chrome toolbar and pin **MeetingMode**.

---

## How to Test It in 30 Seconds

1. Open any chat or dashboard (e.g., [`https://messenger.com`](https://messenger.com), [`https://facebook.com`](https://facebook.com), [`https://stripe.com`](https://stripe.com), or any news/pricing page).
2. Look at the **bottom-right corner** of your webpage: click the floating shield pill (`● Shield: ON`).
3. Notice the **In-Page Tactical HUD Modal** opens right there on your page! You can toggle the master shield, select rules, or trigger the element picker without ever clicking the top Chrome toolbar.
4. **Observe Instant Masking:**
   - On Messenger/Facebook/WhatsApp, messages are automatically blurred with **zero scroll delay**.
   - All dollar amounts, prices, and emails on dashboards instantly frost-blur!
   - Tab title disguises as `"Workspace • Dashboard"`.
5. **Test Hover-to-Peek:**
   - Simply move your mouse over any blurred chat message or price. It unblurs **instantly** so you can read it clearly, and re-blurs the millisecond your mouse moves away!
   - Click once on any item if you want to lock the unblur while presenting or typing.
6. **Test Demo Scramble:**
   - In the popup or HUD modal, click **Client Demo**. Notice numbers, balances, and emails become realistic decoy values, keeping your screen looking normal without revealing confidential data.
7. **Test Dragging the Shield Dock:**
   - Click and drag the floating shield pill anywhere on the screen. Notice it moves smoothly and stays right where you place it. Double-click it to snap it back to bottom-right!
8. **Test Presentation Spotlight (<kbd>Alt+Shift+P</kbd>):**
   - Press <kbd>Alt+Shift+P</kbd> (or toggle Spotlight in HUD). Notice the screen gently dims, and hovering over any card or section casts a focused spotlight beam on it!
