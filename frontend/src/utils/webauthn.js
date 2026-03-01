const toBase64Url = (buffer) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (base64url) => {
  const normalized = String(base64url).replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${pad}`);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const mapCredentialDescriptor = (item = {}) => ({
  ...item,
  id: fromBase64Url(item.id),
});

export const isWebAuthnSupported = () =>
  typeof window !== "undefined" &&
  !!window.PublicKeyCredential &&
  !!navigator.credentials;

export const createWebAuthnCredential = async (options) => {
  const publicKey = {
    ...options,
    challenge: fromBase64Url(options.challenge),
    user: {
      ...options.user,
      id: fromBase64Url(options.user.id),
    },
    excludeCredentials: Array.isArray(options.excludeCredentials)
      ? options.excludeCredentials.map(mapCredentialDescriptor)
      : [],
  };

  const credential = await navigator.credentials.create({ publicKey });
  if (!credential) {
    throw new Error("Biometric registration was cancelled");
  }

  return {
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: toBase64Url(credential.response.clientDataJSON),
      attestationObject: toBase64Url(credential.response.attestationObject),
      transports:
        typeof credential.response.getTransports === "function"
          ? credential.response.getTransports()
          : [],
    },
  };
};

export const getWebAuthnAssertion = async (options) => {
  const publicKey = {
    ...options,
    challenge: fromBase64Url(options.challenge),
    allowCredentials: Array.isArray(options.allowCredentials)
      ? options.allowCredentials.map(mapCredentialDescriptor)
      : [],
  };

  const credential = await navigator.credentials.get({ publicKey });
  if (!credential) {
    throw new Error("Biometric verification was cancelled");
  }

  return {
    id: credential.id,
    rawId: toBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: toBase64Url(credential.response.clientDataJSON),
      authenticatorData: toBase64Url(credential.response.authenticatorData),
      signature: toBase64Url(credential.response.signature),
      userHandle: credential.response.userHandle
        ? toBase64Url(credential.response.userHandle)
        : null,
    },
  };
};

