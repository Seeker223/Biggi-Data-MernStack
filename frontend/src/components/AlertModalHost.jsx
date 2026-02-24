import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const normalizePayload = (titleOrMessage, maybeMessage) => {
  if (typeof maybeMessage === "string") {
    return {
      title: String(titleOrMessage || "Notice"),
      message: maybeMessage,
    };
  }
  return {
    title: "Notice",
    message: String(titleOrMessage || ""),
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
        <Title>{active.title}</Title>
        <Message>{active.message}</Message>
        <OkButton onClick={close}>OK</OkButton>
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
  padding: 18px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
`;

const Title = styled.h3`
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 800;
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
  background: #ff7a00;
  cursor: pointer;
`;

