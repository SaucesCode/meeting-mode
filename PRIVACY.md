# Privacy Policy for MeetingMode

Last updated: November 2026

MeetingMode ("the Extension") is committed to protecting your privacy. This Privacy Policy explains our practices regarding user data, permissions, and security.

---

## 1. Zero Data Collection Policy

MeetingMode operates on a strict **Zero Data Collection** principle:

- **No Personal Data Collected:** MeetingMode does not collect, record, log, transmit, or sell any personal data, browsing history, form contents, chat logs, or financial information.
- **No Analytics or Telemetry:** The Extension contains no third-party tracking scripts, advertising SDKs, telemetry libraries, or Google Analytics.
- **No Remote Servers:** MeetingMode does not maintain remote servers or databases. It makes zero outbound network requests. All computation and DOM shielding occur locally and ephemerally in your browser.

---

## 2. On-Device Local Processing

All privacy features (including real-time regex detection of emails, currency, API keys, chat message masking, and clipboard sanitization) run entirely within your device's memory using standard browser sandbox APIs.

- **Local Storage (`chrome.storage.local`):** Used exclusively on your device to persist your preferences (such as light/dark theme, active presets, custom blocked element selectors, and cloaking keywords). This data never leaves your browser.

---

## 3. Chrome Permissions & Purpose

MeetingMode requests the minimum permissions necessary to deliver screen-sharing protection:

- **`storage`:** Saves your local settings (mask style, custom keywords, domain preferences) locally in Chrome.
- **`activeTab` & `tabs`:** Enables the Extension to determine whether the active presentation tab or window should be cloaked based on your selected Shield Scope ("This Tab" vs "This Window" vs "All Windows").
- **`contextMenus`:** Adds convenient right-click actions ("Toggle Privacy Shield", "Screen Share Lockdown", "Emergency Panic Curtain") so you can protect your screen without opening the popup.
- **`<all_urls>` (Host Permissions):** Required to inject the privacy shield stylesheet and DOM cloaking scripts across websites where you share your screen (such as Facebook, Messenger, Discord, Slack, Stripe, PayPal, and Google Meet). The extension modifies local page styling only and never transmits page content.

---

## 4. Clipboard Protection

MeetingMode includes an optional Clipboard Privacy Shield. When enabled, copying text from a masked element sanitizes the local clipboard buffer (redacting sensitive tokens or replacing them with synthetic dummy values). MeetingMode does not store or transmit your clipboard data.

---

## 5. Third-Party Disclosures

MeetingMode does not share, transfer, or disclose any user information to third parties under any circumstances.

---

## 6. Open Source & Transparency

MeetingMode's source code is publicly inspectable and transparent:
https://github.com/SaucesCode/meeting-mode

---

## 7. Contact & Inquiries

For questions regarding this Privacy Policy or extension security, please open an issue on GitHub:
https://github.com/SaucesCode/meeting-mode/issues
