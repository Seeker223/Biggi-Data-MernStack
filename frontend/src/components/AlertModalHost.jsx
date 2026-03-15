import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const normalizePayload = (titleOrMessage, maybeMessage) => {
  // Support:
  // - alert("message")
  // - alert("Title", "Message")
  // - __APP_ALERT__({ title, message, tone, okText })
  if (titleOrMessage && typeof titleOrMessage === "object") {
    const o = titleOrMessage || {};
    return {
      tone: String(o.tone || "info"),
      title: String(o.title || "Notice"),
      message: String(o.message || ""),
      okText: String(o.okText || "OK"),
    };
  }
  if (typeof maybeMessage === "string") {
    const t = String(titleOrMessage || "").toLowerCase();
    return {
      tone:
        t.includes("success") || t.includes("done")
          ? "success"
          : t.includes("error") || t.includes("failed")
            ? "error"
            : t.includes("warn")
              ? "warning"
              : "info",
      title: String(titleOrMessage || "Notice"),
      message: maybeMessage,
      okText: "OK",
    };
  }
  return {
    tone: "info",
    title: "Notice",
    message: String(titleOrMessage || ""),
    okText: "OK",
  };
};

export default function AlertModalHost() {
  const [queue, setQueue] = useState([]);
  const originalAlertRef = useRef(null);
  const active = queue[0] || null;

  useEffect(() => {
    const enqueue = (titleOrMessage, maybeMessage) => {
      const payload = normalizePayload(titleOrMessage, maybeMessage);
      setQueue((prev) => [...prev, payload]);
    };

    window.__APP_ALERT__ = enqueue;
    originalAlertRef.current = window.alert;
    window.alert = (message) => enqueue(message);

    return () => {
      window.__APP_ALERT__ = undefined;
      if (originalAlertRef.current) {
        window.alert = originalAlertRef.current;
      }
    };
  }, []);

  const close = () => {
    setQueue((prev) => prev.slice(1));
  };

  if (!active) return null;

  return (
    <Overlay onClick={close}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <TopBar $tone={active.tone} />
        <Header>
          <Badge $tone={active.tone}>
            <Dot />
          </Badge>
          <Title>{active.title}</Title>
        </Header>
        <Message>{active.message}</Message>
        <OkButton $tone={active.tone} onClick={close}>
          {active.okText || "OK"}
        </OkButton>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
  z-index: 9999;
  padding: 16px;
`;

const Modal = styled.div`
  width: min(92vw, 360px);
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
`;

const TopBar = styled.div`
  height: 8px;
  width: calc(100% + 32px);
  margin: -14px -16px 12px;
  background: ${({ $tone }) => {
    if ($tone === "success") return "linear-gradient(90deg,#0ea45b,#2fd27c)";
    if ($tone === "error") return "linear-gradient(90deg,#d12a2a,#ff5a5a)";
    if ($tone === "warning") return "linear-gradient(90deg,#ff7a00,#ffb000)";
    return "linear-gradient(90deg,#ff7a00,#111)";
  }};
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
`;

const Badge = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: ${({ $tone }) => {
    if ($tone === "success") return "#eafaf2";
    if ($tone === "error") return "#fff2f2";
    if ($tone === "warning") return "#fff5eb";
    return "#fff5eb";
  }};
  border: 1px solid
    ${({ $tone }) => {
      if ($tone === "success") return "#b8ebd1";
      if ($tone === "error") return "#ffd0d0";
      if ($tone === "warning") return "#ffd4ad";
      return "#ffd4ad";
    }};
`;

const Dot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 99px;
  background: #ff7a00;
`;

const Title = styled.h3`
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 850;
  color: #111;
`;

const Message = styled.p`
  margin: 0 0 14px;
  color: #444;
  font-size: 14px;
  line-height: 1.45;
  white-space: pre-wrap;
`;

const OkButton = styled.button`
  width: 100%;
  border: 0;
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: ${({ $tone }) => {
    if ($tone === "error") return "#d12a2a";
    if ($tone === "success") return "#0ea45b";
    if ($tone === "warning") return "#ff7a00";
    return "#ff7a00";
  }};
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  &:active {
    transform: translateY(1px);
  }
`;
