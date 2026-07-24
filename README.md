# TTD Form Assistant

A human-in-the-loop Chrome extension for the official TTD booking portal.

Version 1.1 is based on the visible ₹300 Special Entry Darshan form supplied by the user. It supports the repeated pilgrim rows and the shared General Details section.

## Supported form fields

For every visible pilgrim row:

- Name
- Age
- Gender
- Photo ID Proof
- Photo ID Number

Shared General Details:

- Email
- City
- State
- Country
- Pincode

The number of pilgrim rows is detected from the current page. **Require exact pilgrim-row count** is enabled by default, so a two-person profile will not fill a page showing a different number of rows.

## Safety boundaries

The extension deliberately does **not**:

- select dates or slots;
- click Add Pilgrim, Continue, Checkout, or Pay;
- refresh, retry, or scan availability;
- bypass OTP, CAPTCHA, virtual queues, or rate limits;
- call hidden/private booking APIs;
- send pilgrim data to any server.

You must review every field and complete the booking manually.

## Install in Chrome

1. Extract the ZIP to a permanent folder.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted `ttd-form-assistant` folder.
6. Pin **TTD Form Assistant** from Chrome’s Extensions menu.

When replacing an older unpacked version, remove the old extension first or select the new extracted folder and click Reload.

## Use

1. Open the extension and create a strong passphrase.
2. Create a booking profile.
3. Enter the General Details and all pilgrims exactly as they should appear.
4. For Photo ID Proof, use the wording displayed in TTD’s dropdown where possible. Common variants such as Aadhaar/Aadhar and Driving Licence/License are matched automatically.
5. Click **Save encrypted**.
6. On quota day, log in and complete the queue, OTP, and CAPTCHA yourself.
7. Select the required date, slot, and ticket count yourself.
8. On the form page, open the extension and click **Preview fields**.
9. Confirm it detects five fields per pilgrim plus five General Details fields.
10. Click **Fill visible form**.
11. Review every value, then manually continue.

## Privacy design

- Data is encrypted with AES-256-GCM.
- The key is derived from your passphrase using PBKDF2-SHA-256.
- The passphrase is not stored.
- Encrypted data stays in `chrome.storage.local` in that Chrome profile.
- Storage access is restricted to trusted extension contexts.
- There are no network requests or analytics.

Aadhaar and other identity numbers are highly sensitive. Use this only on a trusted personal computer, use a strong unique passphrase, and keep the computer locked when unattended.

## Compatibility note

The screenshot confirms the field names but does not reveal the portal’s HTML structure. Version 1.1 supports native selects and common Angular Material/MUI-style comboboxes. TTD can change its page structure at any time. Always run **Preview fields** first. If a dropdown remains unfilled, enter it manually and capture the opened dropdown plus the browser Inspect Element HTML for that field before changing the extension.
## Disclaimer

Form Assistant is an independent educational project. It is not affiliated
with, endorsed by, or officially connected to Tirumala Tirupati
Devasthanams.

The extension does not select slots, bypass queues, solve CAPTCHAs,
submit bookings, or process payments.
