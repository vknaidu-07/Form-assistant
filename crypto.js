"use strict";

const VaultCrypto = (() => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const ITERATIONS = 310000;

  function bytesToBase64(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  function base64ToBytes(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  async function deriveKey(passphrase, salt) {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: ITERATIONS,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptObject(value, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const plaintext = encoder.encode(JSON.stringify(value));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

    return {
      version: 1,
      kdf: "PBKDF2-SHA256",
      iterations: ITERATIONS,
      cipher: "AES-256-GCM",
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertext))
    };
  }

  async function decryptObject(vault, passphrase) {
    if (!vault || vault.version !== 1) throw new Error("Unsupported vault format.");
    const salt = base64ToBytes(vault.salt);
    const iv = base64ToBytes(vault.iv);
    const ciphertext = base64ToBytes(vault.ciphertext);
    const key = await deriveKey(passphrase, salt);

    try {
      const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
      return JSON.parse(decoder.decode(plaintext));
    } catch {
      throw new Error("Wrong passphrase or damaged vault.");
    }
  }

  return { encryptObject, decryptObject };
})();
