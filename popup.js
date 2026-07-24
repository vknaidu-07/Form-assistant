"use strict";

const elements = {
  lockedPanel: document.getElementById("lockedPanel"),
  appPanel: document.getElementById("appPanel"),
  vaultHeading: document.getElementById("vaultHeading"),
  passphrase: document.getElementById("passphrase"),
  unlockButton: document.getElementById("unlockButton"),
  groupSelect: document.getElementById("groupSelect"),
  newGroupButton: document.getElementById("newGroupButton"),
  renameGroupButton: document.getElementById("renameGroupButton"),
  deleteGroupButton: document.getElementById("deleteGroupButton"),
  generalEmail: document.getElementById("generalEmail"),
  generalCity: document.getElementById("generalCity"),
  generalState: document.getElementById("generalState"),
  generalCountry: document.getElementById("generalCountry"),
  generalPincode: document.getElementById("generalPincode"),
  addPilgrimButton: document.getElementById("addPilgrimButton"),
  pilgrimList: document.getElementById("pilgrimList"),
  pilgrimTemplate: document.getElementById("pilgrimTemplate"),
  saveButton: document.getElementById("saveButton"),
  previewButton: document.getElementById("previewButton"),
  fillButton: document.getElementById("fillButton"),
  clearHighlightsButton: document.getElementById("clearHighlightsButton"),
  requireExactCount: document.getElementById("requireExactCount"),
  overwriteExisting: document.getElementById("overwriteExisting"),
  status: document.getElementById("status"),
  lockButton: document.getElementById("lockButton")
};

let hasVault = false;
let passphrase = "";
let data = null;

function createId() {
  return crypto.randomUUID();
}

function blankGeneral() {
  return { email: "", city: "", state: "", country: "India", pincode: "" };
}

function blankPilgrim() {
  return {
    id: createId(),
    fullName: "",
    age: "",
    gender: "",
    idType: "Aadhaar Card",
    idNumber: ""
  };
}

function blankData() {
  const groupId = createId();
  return {
    version: 2,
    selectedGroupId: groupId,
    groups: [{
      id: groupId,
      name: "Family",
      general: blankGeneral(),
      pilgrims: [blankPilgrim()]
    }]
  };
}

function normalizeData(raw) {
  if (!raw || !Array.isArray(raw.groups) || raw.groups.length === 0) return blankData();
  const normalized = {
    version: 2,
    selectedGroupId: raw.selectedGroupId,
    groups: raw.groups.map((group, index) => ({
      id: group.id || createId(),
      name: group.name || `Profile ${index + 1}`,
      general: { ...blankGeneral(), ...(group.general || {}) },
      pilgrims: Array.isArray(group.pilgrims) && group.pilgrims.length
        ? group.pilgrims.map((pilgrim) => ({ ...blankPilgrim(), ...pilgrim, id: pilgrim.id || createId() }))
        : [blankPilgrim()]
    }))
  };
  if (!normalized.groups.some((group) => group.id === normalized.selectedGroupId)) {
    normalized.selectedGroupId = normalized.groups[0].id;
  }
  return normalized;
}

function setStatus(message, type = "info") {
  elements.status.textContent = message;
  elements.status.className = `status show ${type}`;
}

function clearStatus() {
  elements.status.textContent = "";
  elements.status.className = "status";
}

function setBusy(isBusy) {
  for (const button of document.querySelectorAll("button")) button.disabled = isBusy;
}

function selectedGroup() {
  return data?.groups.find((group) => group.id === data.selectedGroupId) || null;
}

function renderGroups() {
  elements.groupSelect.innerHTML = "";
  for (const group of data.groups) {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = group.name;
    option.selected = group.id === data.selectedGroupId;
    elements.groupSelect.append(option);
  }
}

function addPilgrimCard(pilgrim) {
  const card = elements.pilgrimTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.pilgrimId = pilgrim.id;
  card.querySelector(".full-name").value = pilgrim.fullName || "";
  card.querySelector(".age").value = pilgrim.age || "";
  card.querySelector(".gender").value = pilgrim.gender || "";
  card.querySelector(".id-type").value = pilgrim.idType || "Aadhaar Card";
  card.querySelector(".id-number").value = pilgrim.idNumber || "";

  card.querySelector(".show-id").addEventListener("change", (event) => {
    card.querySelector(".id-number").type = event.target.checked ? "text" : "password";
  });

  card.querySelector(".remove-pilgrim").addEventListener("click", () => {
    card.remove();
    renumberCards();
  });

  elements.pilgrimList.append(card);
  renumberCards();
}

function renumberCards() {
  [...elements.pilgrimList.querySelectorAll(".pilgrim-card")].forEach((card, index) => {
    card.querySelector(".pilgrim-number").textContent = `Pilgrim ${index + 1}`;
  });
}

function renderGeneral() {
  const general = selectedGroup()?.general || blankGeneral();
  elements.generalEmail.value = general.email || "";
  elements.generalCity.value = general.city || "";
  elements.generalState.value = general.state || "";
  elements.generalCountry.value = general.country || "India";
  elements.generalPincode.value = general.pincode || "";
}

function renderPilgrims() {
  elements.pilgrimList.innerHTML = "";
  const group = selectedGroup();
  if (!group) return;
  for (const pilgrim of group.pilgrims) addPilgrimCard(pilgrim);
}

function renderProfile() {
  renderGeneral();
  renderPilgrims();
}

function collectGeneralFromUI() {
  return {
    email: elements.generalEmail.value.trim(),
    city: elements.generalCity.value.trim(),
    state: elements.generalState.value.trim(),
    country: elements.generalCountry.value.trim(),
    pincode: elements.generalPincode.value.trim()
  };
}

function collectPilgrimsFromUI() {
  return [...elements.pilgrimList.querySelectorAll(".pilgrim-card")].map((card) => ({
    id: card.dataset.pilgrimId || createId(),
    fullName: card.querySelector(".full-name").value.trim(),
    age: card.querySelector(".age").value.trim(),
    gender: card.querySelector(".gender").value,
    idType: card.querySelector(".id-type").value.trim(),
    idNumber: card.querySelector(".id-number").value.trim()
  }));
}

function syncCurrentGroupFromUI() {
  const group = selectedGroup();
  if (!group) return;
  group.general = collectGeneralFromUI();
  group.pilgrims = collectPilgrimsFromUI();
}

function validateGeneral(general) {
  if (!general.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(general.email)) {
    throw new Error("General details: enter a valid email address.");
  }
  if (!general.city) throw new Error("General details: enter the city.");
  if (!general.state) throw new Error("General details: enter the state.");
  if (!general.country) throw new Error("General details: enter the country.");
  if (!general.pincode) throw new Error("General details: enter the pincode.");
  if (/^india$/i.test(general.country) && !/^\d{6}$/.test(general.pincode)) {
    throw new Error("General details: an Indian pincode must contain 6 digits.");
  }
  if (!/^[A-Za-z0-9 -]{3,12}$/.test(general.pincode)) {
    throw new Error("General details: enter a valid pincode/postal code.");
  }
}

function validatePilgrims(pilgrims) {
  if (!pilgrims.length) throw new Error("Add at least one pilgrim.");
  for (let index = 0; index < pilgrims.length; index += 1) {
    const pilgrim = pilgrims[index];
    const label = `Pilgrim ${index + 1}`;
    if (!pilgrim.fullName) throw new Error(`${label}: enter the name.`);
    if (!pilgrim.age || Number(pilgrim.age) < 1 || Number(pilgrim.age) > 120) {
      throw new Error(`${label}: enter a valid age.`);
    }
    if (!pilgrim.gender) throw new Error(`${label}: select gender.`);
    if (!pilgrim.idType) throw new Error(`${label}: enter the Photo ID Proof type.`);
    if (!pilgrim.idNumber) throw new Error(`${label}: enter the Photo ID Number.`);
    if (/aadhaar|aadhar|uid/i.test(pilgrim.idType) && !/^\d{12}$/.test(pilgrim.idNumber.replace(/\s/g, ""))) {
      throw new Error(`${label}: Aadhaar must contain exactly 12 digits.`);
    }
  }
}

function validateProfile(general, pilgrims) {
  validateGeneral(general);
  validatePilgrims(pilgrims);
}

async function saveVault({ showMessage = true } = {}) {
  syncCurrentGroupFromUI();
  const vault = await VaultCrypto.encryptObject(data, passphrase);
  await chrome.storage.local.set({ vault });
  hasVault = true;
  if (showMessage) setStatus("Saved locally in encrypted form.", "success");
}

async function initialize() {
  const stored = await chrome.storage.local.get("vault");
  hasVault = Boolean(stored.vault);
  elements.vaultHeading.textContent = hasVault ? "Unlock encrypted vault" : "Create encrypted vault";
  elements.unlockButton.textContent = hasVault ? "Unlock" : "Create vault";
  elements.passphrase.focus();
}

async function unlockOrCreate() {
  clearStatus();
  const candidate = elements.passphrase.value;
  if (candidate.length < 8) {
    setStatus("Use a passphrase of at least 8 characters.", "error");
    return;
  }

  setBusy(true);
  try {
    if (hasVault) {
      const stored = await chrome.storage.local.get("vault");
      data = normalizeData(await VaultCrypto.decryptObject(stored.vault, candidate));
    } else {
      data = blankData();
    }
    passphrase = candidate;
    elements.passphrase.value = "";
    elements.lockedPanel.classList.add("hidden");
    elements.appPanel.classList.remove("hidden");
    renderGroups();
    renderProfile();
    await saveVault({ showMessage: false });
    setStatus("Vault unlocked. Prepare the matching TTD form, then preview it.", "success");
  } catch (error) {
    setStatus(error.message || "Could not unlock the vault.", "error");
  } finally {
    setBusy(false);
  }
}

async function sendToActiveTab(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active browser tab was found.");
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    throw new Error("Open the official TTD booking page, reload it once, and try again.");
  }
}

function formatPageResult(result, action) {
  if (!result) return "No response from the page.";
  if (result.error) throw new Error(result.error);
  const lines = [];
  if (action === "preview") {
    lines.push(`Detected ${result.rowCount} pilgrim row(s) and ${result.pilgrimFieldCount} pilgrim field(s).`);
    lines.push(`Detected ${result.generalFieldCount}/5 general-detail fields.`);
    if (result.missingGeneralFields?.length) lines.push(`General fields not detected: ${result.missingGeneralFields.join(", ")}.`);
  } else {
    lines.push(`Filled ${result.filledCount} field(s): ${result.pilgrimFilledCount} pilgrim + ${result.generalFilledCount} general.`);
    if (result.skippedExisting) lines.push(`Skipped ${result.skippedExisting} existing value(s).`);
    if (result.missingFields?.length) lines.push(`Could not fill: ${result.missingFields.join(", ")}.`);
  }
  lines.push("Review every value manually before continuing.");
  return lines.join("\n");
}

function currentProfileValues() {
  const general = collectGeneralFromUI();
  const pilgrims = collectPilgrimsFromUI();
  return { general, pilgrims };
}

elements.unlockButton.addEventListener("click", unlockOrCreate);
elements.passphrase.addEventListener("keydown", (event) => {
  if (event.key === "Enter") unlockOrCreate();
});

elements.groupSelect.addEventListener("change", () => {
  syncCurrentGroupFromUI();
  data.selectedGroupId = elements.groupSelect.value;
  renderProfile();
  clearStatus();
});

elements.newGroupButton.addEventListener("click", () => {
  syncCurrentGroupFromUI();
  const name = prompt("Profile name:", `Profile ${data.groups.length + 1}`)?.trim();
  if (!name) return;
  const group = { id: createId(), name, general: blankGeneral(), pilgrims: [blankPilgrim()] };
  data.groups.push(group);
  data.selectedGroupId = group.id;
  renderGroups();
  renderProfile();
});

elements.renameGroupButton.addEventListener("click", () => {
  const group = selectedGroup();
  if (!group) return;
  const name = prompt("New profile name:", group.name)?.trim();
  if (!name) return;
  group.name = name;
  renderGroups();
});

elements.deleteGroupButton.addEventListener("click", () => {
  if (data.groups.length === 1) {
    setStatus("Keep at least one profile.", "warning");
    return;
  }
  const group = selectedGroup();
  if (!group || !confirm(`Delete “${group.name}”?`)) return;
  data.groups = data.groups.filter((item) => item.id !== group.id);
  data.selectedGroupId = data.groups[0].id;
  renderGroups();
  renderProfile();
});

elements.addPilgrimButton.addEventListener("click", () => addPilgrimCard(blankPilgrim()));

elements.saveButton.addEventListener("click", async () => {
  clearStatus();
  setBusy(true);
  try {
    const { general, pilgrims } = currentProfileValues();
    validateProfile(general, pilgrims);
    await saveVault();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
});

elements.previewButton.addEventListener("click", async () => {
  clearStatus();
  setBusy(true);
  try {
    const result = await sendToActiveTab({ type: "TTDFA_PREVIEW" });
    setStatus(formatPageResult(result, "preview"), result.rowCount ? "info" : "warning");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
});

elements.fillButton.addEventListener("click", async () => {
  clearStatus();
  setBusy(true);
  try {
    const { general, pilgrims } = currentProfileValues();
    validateProfile(general, pilgrims);
    syncCurrentGroupFromUI();
    await saveVault({ showMessage: false });
    const result = await sendToActiveTab({
      type: "TTDFA_FILL",
      general,
      pilgrims,
      requireExactCount: elements.requireExactCount.checked,
      overwrite: elements.overwriteExisting.checked
    });
    const resultType = result.missingFields?.length ? "warning" : "success";
    setStatus(formatPageResult(result, "fill"), resultType);
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
  }
});

elements.clearHighlightsButton.addEventListener("click", async () => {
  clearStatus();
  try {
    await sendToActiveTab({ type: "TTDFA_CLEAR" });
    setStatus("Page highlights cleared.", "info");
  } catch (error) {
    setStatus(error.message, "error");
  }
});

elements.lockButton.addEventListener("click", () => window.close());

initialize().catch((error) => setStatus(error.message, "error"));
