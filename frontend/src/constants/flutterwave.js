const useTestKeys =
  String(import.meta.env.VITE_FLUTTERWAVE_USE_TEST_KEYS || "false").toLowerCase() === "true";

const liveKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "";
const testKey =
  import.meta.env.TEST_VITE_FLUTTERWAVE_PUBLIC_KEY ||
  import.meta.env.TEST_FLUTTERWAVE_PUBLIC_KEY ||
  "";

export const FLUTTERWAVE_PUBLIC_KEY = useTestKeys ? testKey || liveKey : liveKey;
export const FLUTTERWAVE_USE_TEST_KEYS = useTestKeys;
