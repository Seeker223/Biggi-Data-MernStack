import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const normalizeConfirm = (opts) => {
  const o = opts && typeof opts === "object" ? opts : {};
  return {
    tone: String(o.tone || "warning"),
    title: String(o.title || "Please confirm"),
    message: String(o.message || ""),
    confirmText: String(o.confirmText || "Continue"),
    cancelText: String(o.cancelText || "Cancel"),
  };
};

export default function ConfirmModalHost() {
  const [queue, setQueue] = useState([]); // [{ payload, resolve }]
  const originalConfirmRef = useRef(null);
  const active = queue[0] || null;

  useEffect(() => {
    const enqueue = (opts) =>
      new Promise((resolve) => {
        const payload = normalizeConfirm(opts);
        setQueue((prev) => [...prev, { payload, resolve }]);
      });

    window.__APP_CONFIRM__ = enqueue;

    // Keep a ref to original confirm for debugging, but do not override it
    // because window.confirm is synchronous and cannot be polyfilled safely.
    originalConfirmRef.current = window.confirm;

    return () => {
      window.__APP_CONFIRM__ = undefined;
    };
  }, []);

  const resolveAndClose = (value) => {
    try {
      active?.resolve?.(Boolean(value));
    } finally {
      setQueue((prev) => prev.slice(1));
    }
  };

  if (!active) return null;

  return (
    <Overlay onClick={() => resolveAndClose(false)}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <TopBar $tone={active.payload.tone} />
        <Header>
          <Title>{active.payload.title}</Title>
          <CloseBtn onClick={() => resolveAndClose(false)} aria-label="Close confirmation">
            ×
          </CloseBtn>
        </Header>
        <Message>{active.payload.message}</Message>
        <Actions>
          <BtnGhost type="button" onClick={() => resolveAndClose(false)}>
            {active.payload.cancelText}
          </BtnGhost>
          <BtnPrimary $tone={active.payload.tone} type="button" onClick={() => resolveAndClose(true)}>
            {active.payload.confirmText}
          </BtnPrimary>
        </Actions>
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
  z-index: 10000;
  padding: 16px;
`;

const Modal = styled.div`
  width: min(92vw, 400px);
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
    if ($tone === "error") return "linear-gradient(90deg,#d12a2a,#ff5a5a)";
    if ($tone === "success") return "linear-gradient(90deg,#0ea45b,#2fd27c)";
    return "linear-gradient(90deg,#ff7a00,#111)";
  }};
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 850;
  color: #111;
  letter-spacing: 0.01em;
`;

const CloseBtn = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid #ececec;
  background: #fff;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  display: grid;
  place-items: center;
`;

const Message = styled.p`
  margin: 0 0 14px;
  color: #444;
  font-size: 14px;
  line-height: 1.45;
  white-space: pre-wrap;
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const BtnGhost = styled.button`
  height: 42px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111;
  font-weight: 800;
  cursor: pointer;
`;

const BtnPrimary = styled.button`
  height: 42px;
  border-radius: 12px;
  border: 0;
  color: #fff;
  font-weight: 850;
  cursor: pointer;
  background: ${({ $tone }) => {
    if ($tone === "error") return "#d12a2a";
    if ($tone === "success") return "#0ea45b";
    return "#ff7a00";
  }};
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  &:active {
    transform: translateY(1px);
  }
`;

