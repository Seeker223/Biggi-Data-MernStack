import {
  beginBiometricTransaction,
  verifyBiometricTransaction,
  beginBiometricLogin,
  verifyBiometricLogin,
  getBiometricLoginAvailability,
} from "./api";
import { getWebAuthnAssertion } from "../utils/webauthn";

const buildBiometricError = (error, fallbackMessage) => {
  const responseData = error?.response?.data || {};
  const message = responseData?.message || error?.message || fallbackMessage;
  const customError = new Error(message);
  customError.code =
    responseData?.code ||
    (/not enabled/i.test(message) ? "BIOMETRIC_NOT_ENABLED" : "BIOMETRIC_ERROR");
  customError.setupPath = responseData?.setupPath || "/profile";
  customError.raw = error;
  return customError;
};

export const checkBiometricLoginAvailability = async (identifier) => {
  try {
    const res = await getBiometricLoginAvailability(identifier);
    const payload = res?.data || {};
    return {
      enabled: Boolean(payload?.enabled),
      setupPath: payload?.setupPath || "/profile",
    };
  } catch {
    return { enabled: false, setupPath: "/profile" };
  }
};

export const runBiometricTransactionCheck = async ({ action, amount }) => {
  let optionsRes;
  try {
    optionsRes = await beginBiometricTransaction(action, amount);
  } catch (error) {
    throw buildBiometricError(error, "Unable to start biometric verification");
  }
  const options = optionsRes?.data?.options || optionsRes?.options;
  if (!options) {
    throw new Error("Unable to start biometric verification");
  }

  let assertion;
  try {
    assertion = await getWebAuthnAssertion(options);
  } catch (error) {
    throw buildBiometricError(error, "Biometric verification was cancelled");
  }

  let verifyRes;
  try {
    verifyRes = await verifyBiometricTransaction(assertion);
  } catch (error) {
    throw buildBiometricError(error, "Biometric verification failed");
  }
  const proofToken = verifyRes?.data?.proofToken || verifyRes?.proofToken;
  if (!proofToken) {
    throw new Error("Biometric verification failed");
  }

  return proofToken;
};

export const runBiometricLogin = async (identifier) => {
  let optionsRes;
  try {
    optionsRes = await beginBiometricLogin(identifier);
  } catch (error) {
    throw buildBiometricError(error, "Unable to start fingerprint login");
  }
  const options = optionsRes?.data?.options || optionsRes?.options;
  if (!options) {
    throw new Error("Unable to start fingerprint login");
  }

  let assertion;
  try {
    assertion = await getWebAuthnAssertion(options);
  } catch (error) {
    throw buildBiometricError(error, "Fingerprint verification was cancelled");
  }

  let verifyRes;
  try {
    verifyRes = await verifyBiometricLogin(identifier, assertion);
  } catch (error) {
    throw buildBiometricError(error, "Fingerprint login failed");
  }
  return verifyRes?.data || verifyRes;
};
