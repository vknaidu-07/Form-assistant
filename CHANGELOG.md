# Changelog

## 1.1.0

- Added the exact General Details model: Email, City, State, Country, and Pincode
- Added dynamic repeated-row support for Name, Age, Gender, Photo ID Proof, and Photo ID Number
- Added exact pilgrim-count guard to prevent filling the wrong number of rows
- Added migration for vaults created with version 1.0
- Added support for native dropdowns and common Angular Material/MUI comboboxes
- Improved Photo ID Proof option matching
- Changed Photo ID Proof in the profile editor to an editable field with suggestions
- Still performs no slot selection, submission, retries, checkout, or payment actions

## 1.0.0

- Encrypted local pilgrim vault
- Multiple pilgrim groups
- Masked identity-number inputs
- Preview-before-fill mapping
- Visible-row-only form filling
- Optional replacement of existing values
- Manual-review guardrails
- No network requests, slot selection, submission, retries, or payment automation
