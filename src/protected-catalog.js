const context = new TextEncoder().encode("ceccastore-private-catalog-v1");

function fromBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

export async function unlockCatalog(pin, envelope) {
  if (!/^\d{6}$/.test(pin) || envelope.version !== 1) {
    throw new Error("Invalid access code or package");
  }
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: fromBase64(envelope.salt),
      iterations: envelope.iterations,
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(envelope.iv), additionalData: context },
    key,
    fromBase64(envelope.data),
  );
  const { projects } = JSON.parse(new TextDecoder().decode(plaintext));
  if (!Array.isArray(projects) || !projects.length) {
    throw new Error("Invalid private catalog");
  }
  return projects;
}
