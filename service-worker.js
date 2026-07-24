"use strict";

async function restrictStorageAccess() {
  try {
    await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  } catch (error) {
    console.warn("TTD Form Assistant: could not restrict storage access", error);
  }
}

chrome.runtime.onInstalled.addListener(restrictStorageAccess);
chrome.runtime.onStartup.addListener(restrictStorageAccess);
restrictStorageAccess();
