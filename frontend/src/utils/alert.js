export const showAlert = (titleOrMessage, maybeMessage) => {
  if (typeof window === "undefined") return;
  if (typeof window.__APP_ALERT__ === "function") {
    window.__APP_ALERT__(titleOrMessage, maybeMessage);
    return;
  }
  const fallback =
    typeof maybeMessage === "string"
      ? `${String(titleOrMessage || "Notice")}\n\n${maybeMessage}`
      : String(titleOrMessage || "");
  window.alert(fallback);
};

export const Alert = {
  alert: showAlert,
};

export default showAlert;

