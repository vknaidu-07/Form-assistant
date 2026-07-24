"use strict";

(() => {
  const HIGHLIGHT_CLASSES = ["ttdfa-preview", "ttdfa-filled", "ttdfa-missing"];
  const badges = new Set();
  const CONTROL_SELECTOR = [
    'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([type="password"])',
    "select",
    "textarea",
    '[role="combobox"]',
    "mat-select",
    '[aria-haspopup="listbox"]'
  ].join(",");

  const aliases = {
    name: ["pilgrim name", "devotee name", "name of pilgrim", "full name", "name"],
    age: ["age", "years"],
    gender: ["gender", "sex"],
    idType: [
      "photo id proof",
      "photo id type",
      "photo identity proof",
      "id proof",
      "id proof type",
      "identity proof",
      "proof type",
      "document type"
    ],
    idNumber: [
      "photo id number",
      "photo identity number",
      "id proof number",
      "identity number",
      "id number",
      "id no",
      "proof number",
      "document number",
      "aadhaar number",
      "aadhar number"
    ],
    email: ["email address", "e mail", "email"],
    city: ["city", "town"],
    state: ["state", "province"],
    country: ["country", "nation"],
    pincode: ["pin code", "pincode", "postal code", "postcode", "zip code"]
  };

  const pilgrimKinds = ["name", "age", "gender", "idType", "idNumber"];
  const generalKinds = ["email", "city", "state", "country", "pincode"];

  function normalize(value) {
    return String(value || "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .toLowerCase()
      .replace(/[\u00a0*_\-:/()[\].,]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isVisible(element) {
    if (!(element instanceof Element)) return false;
    const target = element instanceof HTMLElement ? element : element.parentElement;
    if (!target) return false;
    const style = getComputedStyle(target);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const rect = target.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function isCustomSelect(element) {
    return !(element instanceof HTMLSelectElement)
      && (element.matches('[role="combobox"], mat-select, [aria-haspopup="listbox"]'));
  }

  function closestFieldContainer(element) {
    return element.closest([
      "mat-form-field",
      ".mat-form-field",
      ".mat-mdc-form-field",
      ".MuiFormControl-root",
      ".MuiTextField-root",
      '[class*="form-field"]',
      '[class*="formField"]',
      '[data-field]'
    ].join(","));
  }

  function directLabelText(element) {
    const parts = [];
    if (element.labels) {
      for (const label of element.labels) parts.push(label.textContent);
    }

    const parentLabel = element.closest("label");
    if (parentLabel) parts.push(parentLabel.textContent);

    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      for (const id of labelledBy.split(/\s+/)) parts.push(document.getElementById(id)?.textContent);
    }

    const container = closestFieldContainer(element);
    if (container) {
      const labels = container.querySelectorAll([
        "label",
        "mat-label",
        ".mat-form-field-label",
        ".mat-mdc-floating-label",
        ".mdc-floating-label",
        ".MuiInputLabel-root",
        '[class*="label"]'
      ].join(","));
      for (const label of [...labels].slice(0, 4)) parts.push(label.textContent);
    }

    let sibling = element.previousElementSibling;
    for (let index = 0; sibling && index < 2; index += 1, sibling = sibling.previousElementSibling) {
      if (["LABEL", "SPAN", "DIV", "P", "MAT-LABEL"].includes(sibling.tagName)) parts.push(sibling.textContent);
    }

    return normalize(parts.filter(Boolean).join(" ").slice(0, 600));
  }

  function associatedText(element) {
    const parts = [
      directLabelText(element),
      element.getAttribute("aria-label"),
      element.getAttribute("placeholder"),
      element.getAttribute("name"),
      element.id,
      element.getAttribute("title"),
      element.getAttribute("data-label"),
      element.getAttribute("formcontrolname"),
      element.getAttribute("ng-reflect-name")
    ];

    if (!parts.filter(Boolean).length || !directLabelText(element)) {
      const container = closestFieldContainer(element) || element.parentElement;
      if (container) parts.push(container.textContent?.slice(0, 250));
    }

    return normalize(parts.filter(Boolean).join(" ").slice(0, 900));
  }

  function aliasMatches(text, alias) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|\\s)${escaped}($|\\s)`).test(text);
  }

  function containsAny(text, candidates) {
    return candidates.some((candidate) => aliasMatches(text, candidate));
  }

  function optionText(control) {
    if (control instanceof HTMLSelectElement) {
      return normalize([...control.options].map((option) => `${option.textContent} ${option.value}`).join(" "));
    }
    return "";
  }

  function classifyField(element) {
    if (!isVisible(element) || element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") return null;
    if (element instanceof HTMLInputElement && element.readOnly && !isCustomSelect(element)) return null;

    const descriptor = associatedText(element);
    if (!descriptor) return null;

    if (containsAny(descriptor, ["father name", "mother name", "user name", "username", "login name"])) return null;

    if (containsAny(descriptor, aliases.idNumber)) return "idNumber";
    if (containsAny(descriptor, aliases.idType)) return "idType";
    if (containsAny(descriptor, aliases.gender)) return "gender";
    if (containsAny(descriptor, aliases.age)) return "age";
    if (containsAny(descriptor, aliases.email)) return "email";
    if (containsAny(descriptor, aliases.pincode)) return "pincode";
    if (containsAny(descriptor, aliases.country)) return "country";
    if (containsAny(descriptor, aliases.state)) return "state";
    if (containsAny(descriptor, aliases.city)) return "city";
    if (containsAny(descriptor, aliases.name)) return "name";

    const options = optionText(element);
    if (options) {
      if (options.includes("male") && options.includes("female")) return "gender";
      if (containsAny(options, ["aadhaar", "aadhar", "passport", "voter id", "driving licence", "driving license"])) return "idType";
    }

    return null;
  }

  function compareDocumentOrder(first, second) {
    if (first === second) return 0;
    const position = first.compareDocumentPosition(second);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  }

  function allMappedControls() {
    const candidates = [...document.querySelectorAll(CONTROL_SELECTOR)]
      .filter((element) => classifyField(element));

    // Avoid treating an outer custom combobox and its inner interactive control as two fields.
    return candidates.filter((element) => {
      if (!isCustomSelect(element)) return true;
      return !candidates.some((other) => other !== element && element.contains(other));
    }).sort(compareDocumentOrder);
  }

  function controlsOfKind(controls, kind) {
    return controls.filter((control) => classifyField(control) === kind);
  }

  function buildModel() {
    const controls = allMappedControls();
    const grouped = Object.fromEntries([...pilgrimKinds, ...generalKinds].map((kind) => [kind, controlsOfKind(controls, kind)]));
    const rowCount = Math.max(...pilgrimKinds.map((kind) => grouped[kind].length), 0);
    const rows = [];

    for (let index = 0; index < rowCount; index += 1) {
      rows.push({
        name: grouped.name[index] || null,
        age: grouped.age[index] || null,
        gender: grouped.gender[index] || null,
        idType: grouped.idType[index] || null,
        idNumber: grouped.idNumber[index] || null
      });
    }

    const general = Object.fromEntries(generalKinds.map((kind) => [kind, grouped[kind][0] || null]));
    return { rows, general };
  }

  function clearHighlights() {
    for (const element of document.querySelectorAll(HIGHLIGHT_CLASSES.map((name) => `.${name}`).join(","))) {
      element.classList.remove(...HIGHLIGHT_CLASSES);
    }
    for (const badge of badges) badge.remove();
    badges.clear();
  }

  function highlight(element, className, label) {
    if (!element) return;
    const target = element instanceof HTMLElement ? element : element.parentElement;
    if (!target) return;
    target.classList.add(className);
    if (!label) return;
    const rect = target.getBoundingClientRect();
    const badge = document.createElement("span");
    badge.className = "ttdfa-badge";
    badge.textContent = label;
    badge.style.left = `${Math.max(0, rect.left + window.scrollX)}px`;
    badge.style.top = `${Math.max(0, rect.top + window.scrollY)}px`;
    document.documentElement.append(badge);
    badges.add(badge);
  }

  function preview() {
    clearHighlights();
    const model = buildModel();
    let pilgrimFieldCount = 0;
    let generalFieldCount = 0;

    model.rows.forEach((row, rowIndex) => {
      pilgrimKinds.forEach((kind) => {
        if (!row[kind]) return;
        pilgrimFieldCount += 1;
        highlight(row[kind], "ttdfa-preview", `P${rowIndex + 1}: ${kind}`);
      });
    });

    generalKinds.forEach((kind) => {
      if (!model.general[kind]) return;
      generalFieldCount += 1;
      highlight(model.general[kind], "ttdfa-preview", `General: ${kind}`);
    });

    return {
      rowCount: model.rows.length,
      pilgrimFieldCount,
      generalFieldCount,
      missingGeneralFields: generalKinds.filter((kind) => !model.general[kind])
    };
  }

  function nativeSetValue(element, value) {
    const prototype = element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function normalizedAliases(value) {
    const normalized = normalize(value);
    const values = new Set([normalized]);

    if (/aadhaar|aadhar|uid/.test(normalized)) {
      ["aadhaar card", "aadhaar", "aadhar card", "aadhar", "uid", "uidai"].forEach((item) => values.add(item));
    }
    if (/driving licence|driving license|(^|\s)dl($|\s)/.test(normalized)) {
      ["driving licence", "driving license", "driving licence card", "dl"].forEach((item) => values.add(item));
    }
    if (/voter|epic/.test(normalized)) {
      ["voter id", "voter identity card", "epic"].forEach((item) => values.add(item));
    }
    if (/pan/.test(normalized)) ["pan card", "pan"].forEach((item) => values.add(item));
    if (/passport/.test(normalized)) values.add("passport");
    if (/ration/.test(normalized)) ["ration card", "ration"].forEach((item) => values.add(item));

    return [...values].filter(Boolean);
  }

  function matchScore(candidateText, target) {
    const text = normalize(candidateText);
    if (!text) return -1;
    let best = -1;
    for (const alias of normalizedAliases(target)) {
      if (text === alias) best = Math.max(best, 100);
      else if (aliasMatches(text, alias)) best = Math.max(best, 80 - Math.abs(text.length - alias.length));
      else if (alias.length >= 5 && (text.includes(alias) || alias.includes(text))) best = Math.max(best, 50 - Math.abs(text.length - alias.length));
    }
    return best;
  }

  function setNativeSelect(select, target) {
    const choices = [...select.options]
      .map((option) => ({ option, score: matchScore(`${option.textContent} ${option.value}`, target) }))
      .sort((a, b) => b.score - a.score);
    if (!choices.length || choices[0].score < 0) return false;
    nativeSetValue(select, choices[0].option.value);
    return true;
  }

  function visibleOptions() {
    const selector = [
      '[role="option"]',
      "mat-option",
      ".mat-option",
      ".mat-mdc-option",
      "li[role=option]",
      '[data-value][role="option"]'
    ].join(",");
    return [...document.querySelectorAll(selector)].filter(isVisible);
  }

  async function waitForOptions(timeoutMs = 900) {
    const start = performance.now();
    while (performance.now() - start < timeoutMs) {
      const options = visibleOptions();
      if (options.length) return options;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return [];
  }

  async function setCustomSelect(control, target) {
    const clickable = control.querySelector?.(".mat-select-trigger, .mat-mdc-select-trigger") || control;
    clickable.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    clickable.click();

    const options = await waitForOptions();
    const choices = options
      .map((option) => ({ option, score: matchScore(`${option.textContent} ${option.getAttribute("data-value") || ""}`, target) }))
      .sort((a, b) => b.score - a.score);

    if (!choices.length || choices[0].score < 0) {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
      return false;
    }

    choices[0].option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    choices[0].option.click();
    await new Promise((resolve) => setTimeout(resolve, 35));
    return true;
  }

  function currentValue(control) {
    if (control instanceof HTMLSelectElement) {
      const selected = normalize(`${control.value} ${control.selectedOptions[0]?.textContent || ""}`);
      const placeholders = ["", "select", "please select", "choose", "choose one", "select one"];
      return placeholders.includes(selected) ? "" : selected;
    }
    if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) return String(control.value || "").trim();

    const text = normalize(`${control.getAttribute("value") || ""} ${control.textContent || ""}`);
    const placeholders = ["", "select", "choose", "gender", "photo id proof", "photo id type", "id proof"];
    return placeholders.includes(text) ? "" : text;
  }

  async function setControl(control, value, overwrite) {
    if (!control || value === undefined || value === null || String(value).trim() === "") return { status: "missing" };
    if (!overwrite && currentValue(control)) return { status: "skipped" };

    let success = false;
    if (control instanceof HTMLSelectElement) success = setNativeSelect(control, value);
    else if (isCustomSelect(control)) success = await setCustomSelect(control, value);
    else if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
      nativeSetValue(control, String(value));
      success = true;
    }

    highlight(control, success ? "ttdfa-filled" : "ttdfa-missing");
    return { status: success ? "filled" : "unmatched" };
  }

  async function fill({ pilgrims, general, overwrite, requireExactCount }) {
    clearHighlights();
    const model = buildModel();

    if (!model.rows.length) throw new Error("No visible pilgrim rows were detected. Use Preview fields first.");
    if (requireExactCount && model.rows.length !== pilgrims.length) {
      throw new Error(`Count mismatch: the page has ${model.rows.length} pilgrim row(s), but this profile has ${pilgrims.length}. No fields were changed.`);
    }

    const rowsUsed = Math.min(model.rows.length, pilgrims.length);
    let filledCount = 0;
    let pilgrimFilledCount = 0;
    let generalFilledCount = 0;
    let skippedExisting = 0;
    const missingFields = new Set();

    const recordResult = (result, label, section) => {
      if (result.status === "filled") {
        filledCount += 1;
        if (section === "pilgrim") pilgrimFilledCount += 1;
        else generalFilledCount += 1;
      } else if (result.status === "skipped") skippedExisting += 1;
      else if (result.status === "unmatched") missingFields.add(`${label} option`);
      else if (result.status === "missing") missingFields.add(label);
    };

    // Fill text fields first so framework state settles before opening dropdown overlays.
    for (let index = 0; index < rowsUsed; index += 1) {
      const row = model.rows[index];
      const pilgrim = pilgrims[index];
      for (const [fieldName, value] of [
        ["name", pilgrim.fullName],
        ["age", pilgrim.age],
        ["idNumber", pilgrim.idNumber]
      ]) {
        if (!row[fieldName]) {
          missingFields.add(`${fieldName} (pilgrim ${index + 1})`);
          continue;
        }
        recordResult(await setControl(row[fieldName], value, overwrite), `${fieldName} (pilgrim ${index + 1})`, "pilgrim");
      }
    }

    for (const [kind, value] of [
      ["email", general.email],
      ["city", general.city],
      ["state", general.state],
      ["country", general.country],
      ["pincode", general.pincode]
    ]) {
      if (!model.general[kind]) {
        missingFields.add(`general ${kind}`);
        continue;
      }
      recordResult(await setControl(model.general[kind], value, overwrite), `general ${kind}`, "general");
    }

    for (let index = 0; index < rowsUsed; index += 1) {
      const row = model.rows[index];
      const pilgrim = pilgrims[index];
      for (const [fieldName, value] of [
        ["gender", pilgrim.gender],
        ["idType", pilgrim.idType]
      ]) {
        if (!row[fieldName]) {
          missingFields.add(`${fieldName} (pilgrim ${index + 1})`);
          continue;
        }
        recordResult(await setControl(row[fieldName], value, overwrite), `${fieldName} (pilgrim ${index + 1})`, "pilgrim");
      }
    }

    return {
      rowsUsed,
      filledCount,
      pilgrimFilledCount,
      generalFilledCount,
      skippedExisting,
      missingFields: [...missingFields]
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "TTDFA_PREVIEW") {
      try {
        sendResponse(preview());
      } catch (error) {
        sendResponse({ error: error.message || "Unexpected page-mapping error." });
      }
      return false;
    }

    if (message?.type === "TTDFA_FILL") {
      fill({
        pilgrims: message.pilgrims || [],
        general: message.general || {},
        overwrite: Boolean(message.overwrite),
        requireExactCount: Boolean(message.requireExactCount)
      }).then(sendResponse).catch((error) => sendResponse({ error: error.message || "Unexpected filling error." }));
      return true;
    }

    if (message?.type === "TTDFA_CLEAR") {
      clearHighlights();
      sendResponse({ ok: true });
      return false;
    }

    return false;
  });
})();
