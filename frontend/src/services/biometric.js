import {
  beginBiometricTransaction,
  verifyBiometricTransaction,
  beginBiometricLogin,
  verifyBiometricLogin,
} from "./api";
import { getWebAuthnAssertion } from "../utils/webauthn";

export const runBiometricTransactionCheck = async ({ action, amount }) => {
  const optionsRes = await beginBiometricTransaction(action, amount);
  const options = optionsRes?.data?.options || optionsRes?.options;
  if (!options) {
    throw new Error("Unable to start biometric verification");
  }

  const assertion = await getWebAuthnAssertion(options);
  const verifyRes = await verifyBiometricTransaction(assertion);
  const proofToken = verifyRes?.data?.proofToken || verifyRes?.proofToken;
  if (!proofToken) {
    throw new Error("Biometric verification failed");
  }

  return proofToken;
};

export const runBiometricLogin = async (identifier) => {
  const optionsRes = await beginBiometricLogin(identifier);
  const options = optionsRes?.data?.options || optionsRes?.options;
  if (!options) {
    throw new Error("Unable to start fingerprint login");
  }

  const assertion = await getWebAuthnAssertion(options);
  const verifyRes = await verifyBiometricLogin(identifier, assertion);
  return verifyRes?.data || verifyRes;
};

