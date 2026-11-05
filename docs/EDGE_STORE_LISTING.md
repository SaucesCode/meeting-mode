# Microsoft Edge Add-ons Store Submission Package: MeetingMode

This document contains all metadata, store copy, certification notes, and step-by-step instructions required to submit MeetingMode to the **Microsoft Edge Add-ons Store** (Edge Partner Center).

---

## Why Microsoft Edge Add-ons Store?

1. **100% Free Registration:** Unlike Chrome Web Store ($5 registration fee), Microsoft Edge Partner Center developer accounts are completely free.
2. **Fast Review Times:** Microsoft Edge extension certifications are typically completed within 24 to 72 hours.
3. **Full Chromium Compatibility:** Manifest V3 extensions run identically in Microsoft Edge with zero code modifications.

---

## 1. Store Metadata & Properties

- **Extension Name (Max 50 chars):**
  `MeetingMode - Screen Share Privacy Shield`
- **Short Name (Max 12 chars):**
  `MeetingMode`
- **Version:**
  `1.0.0`
- **Category:**
  `Productivity`
- **Primary Language:**
  `English (United States)`
- **Website URL:**
  `https://github.com/SaucesCode/meeting-mode`
- **Privacy Policy URL:**
  `https://github.com/SaucesCode/meeting-mode/blob/main/PRIVACY.md`
- **Support Contact URL:**
  `https://github.com/SaucesCode/meeting-mode/issues`

---

## 2. Store Descriptions

### Search terms / Keywords (Max 21 terms, max 30 characters each):
Enter each of these into the Search terms field in Edge Partner Center:
1. meetingmode
2. meeting mode
3. meeting-mode
4. screen share privacy
5. screen shield
6. privacy shield
7. blur screen
8. blur messages
9. discord blur
10. messenger blur
11. slack blur
12. presentation privacy
13. hide sensitive data
14. mask pii
15. data cloaker
16. demo mode
17. google meet privacy
18. teams screen share
19. zoom screen share
20. hide financials
21. hide api keys

### Short Description (Max 100 chars):
Zero-click privacy shield for screen sharing & demos. Masks financials, emails, API keys & chats.

### Detailed Description (Formatted for Microsoft Edge ASO):
MeetingMode (Meeting Mode) is a high-precision, zero-click presentation privacy shield designed for professionals, founders, and developers who share their screens on Google Meet, Microsoft Teams, Zoom, Slack Huddles, and Loom.

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
- "This Tab" Scope: Protects only your active presentation tab (ideal for browser tab sharing).
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

## 3. Notes for Certification (Reviewer Instructions)

Copy and paste this into the **"Notes for certification"** field in the Edge Partner Center dashboard. This gives the Microsoft review team exact instructions on how to test:

```text
Thank you for reviewing MeetingMode.

No account, login credentials, or backend setup is required to test this extension. All processing is 100% client-side.

HOW TO TEST:
1. Click the MeetingMode toolbar icon or press Alt+Shift+M to arm the privacy shield.
2. Visit any website displaying emails or currency amounts (e.g., stripe.com, paypal.com, or any demo dashboard) to observe automatic regex masking.
3. Test messaging protection: Open web.facebook.com, messenger.com, or discord.com. Chat bubbles, avatars, and media attachments will be cleanly blurred.
4. Test Screen Share Lockdown Mode: In the popup or HUD mode strip, select "Lockdown". Hovering over messages will remain 100% blurred (preventing presentation leaks). Hold the Alt key while hovering to verify deliberate presenter peeking.
5. Test Emergency Panic Curtain: Press Alt+Shift+B to verify instant viewport blackout; press Escape to dismiss.
6. Test Presentation Spotlight: Press Alt+Shift+P to activate cursor spotlighting.

PERMISSIONS JUSTIFICATION:
- <all_urls>: Required to inject local CSS blur rules and client-side masking on websites where users share their screen. No page content is extracted or transmitted.
- storage: Used locally via chrome.storage.local to save user preferences.
- tabs / activeTab: Used to enforce Shield Scope ("This Tab" vs "This Window" vs "All Windows").
- contextMenus: Provides right-click shortcut actions to toggle shield or trigger panic curtain.

Repository: https://github.com/SaucesCode/meeting-mode
Privacy Policy: https://github.com/SaucesCode/meeting-mode/blob/main/PRIVACY.md
```

---

## 4. Step-by-Step Submission Walkthrough

### Step 1: Sign in to Microsoft Partner Center
1. Navigate to: **https://partner.microsoft.com/dashboard/microsoftedge**
2. Sign in with your Microsoft account (Outlook / Hotmail / Live).
3. If this is your first time, complete the one-minute developer profile (Individual Account). It is 100% free with no registration fees.

### Step 2: Create a New Extension
1. In the Microsoft Edge dashboard, click the blue **"Create new extension"** button.
2. Drag and drop your release package:
   `meeting-mode-v1.0.0.zip` (located in your `meeting-mode` directory).
3. Edge will parse `manifest.json` and validate the package.

### Step 3: Complete Extension Properties
1. **Category:** Select `Productivity`.
2. **Support Contact:** Enter `https://github.com/SaucesCode/meeting-mode/issues`.
3. **Privacy Policy URL:** Enter `https://github.com/SaucesCode/meeting-mode/blob/main/PRIVACY.md`.
4. **Website:** Enter `https://github.com/SaucesCode/meeting-mode`.

### Step 4: Complete Store Listing
1. In the **English (United States)** listing section:
   - **Extension Name:** `MeetingMode - Screen Share Privacy Shield`
   - **Short Description:** `Zero-click privacy shield for screen sharing & demos. Masks financials, emails, API keys & chats.`
   - **Description:** Paste the detailed description from Section 2 above.
   - **Store Logo:** Upload `icons/icon128.png` from the extension directory.
   - **Screenshots:** Upload at least one screenshot (1280 x 800 px recommended).

### Step 5: Add Notes for Certification
1. In the **"Notes for certification"** section at the bottom, paste the reviewer instructions from Section 3 above.

### Step 6: Publish
1. Click **"Publish"** or **"Submit"**.
2. Your extension will transition to "Under review" status. Microsoft usually approves clean Manifest V3 privacy extensions within 1 to 3 business days.
