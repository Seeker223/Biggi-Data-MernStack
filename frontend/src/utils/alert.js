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

export const confirmModal = async (opts) => {
  if (typeof window === "undefined") return false;
  if (typeof window.__APP_CONFIRM__ === "function") {
    return Boolean(await window.__APP_CONFIRM__(opts));
  }
  // Fallback: native confirm (sync)
  const msg =
    opts && typeof opts === "object"
      ? `${String(opts.title || "Please confirm")}\n\n${String(opts.message || "")}`
      : String(opts || "");
  // eslint-disable-next-line no-alert
  return Boolean(window.confirm(msg));
};

export const Alert = {
  alert: showAlert,
  info: (title, message) => showAlert({ tone: "info", title, message }),
  success: (title, message) => showAlert({ tone: "success", title, message }),
  error: (title, message) => showAlert({ tone: "error", title, message }),
  warning: (title, message) => showAlert({ tone: "warning", title, message }),
  confirm: confirmModal,
};

export default showAlert;
