import React, { useMemo, useState } from "react";
import styled from "styled-components";

const Wrap = styled.div`
  position: fixed;
  right: 16px;
  bottom: 96px;
  z-index: 110;
  display: grid;
  gap: 10px;

  @media (max-width: 640px) {
    right: 12px;
    bottom: 108px;
  }
`;

const Panel = styled.div`
  width: min(320px, calc(100vw - 24px));
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.14);
  padding: 12px;
  display: grid;
  gap: 10px;
`;

const PanelTitle = styled.div`
  font-weight: 900;
  color: #0f172a;
`;

const NumberRow = styled.a`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #f8fafc;
  color: inherit;

  &:hover {
    background: #fff5eb;
  }
`;

const NumberText = styled.div`
  font-weight: 900;
  letter-spacing: 0.3px;
`;

const Chip = styled.span`
  background: #25d366;
  color: #fff;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 12px;
`;

const FloatButton = styled.button`
  border: none;
  border-radius: 999px;
  padding: 12px 14px;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: translateY(-1px);
  }
`;

const Backdrop = styled.button`
  position: fixed;
  inset: 0;
  border: none;
  background: transparent;
  z-index: 105;
`;

function toWaLink(nigeriaNumber) {
  const digits = String(nigeriaNumber || "").replace(/\D/g, "");
  if (!digits) return "";
  const withCountry = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
  return `https://wa.me/${withCountry}`;
}

export default function WhatsAppSupport() {
  const [open, setOpen] = useState(false);

  const numbers = useMemo(
    () => [
      { label: "WhatsApp 1", number: "09050347019" },
      { label: "WhatsApp 2", number: "09131556692" },
    ],
    []
  );

  return (
    <>
      {open ? (
        <Backdrop
          type="button"
          aria-label="Close WhatsApp contacts"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <Wrap>
        {open ? (
          <Panel role="dialog" aria-label="WhatsApp contacts">
            <PanelTitle>Contact us on WhatsApp</PanelTitle>
            {numbers.map((n) => (
              <NumberRow
                key={n.number}
                href={toWaLink(n.number)}
                target="_blank"
                rel="noreferrer"
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                    {n.label}
                  </div>
                  <NumberText>{n.number}</NumberText>
                </div>
                <Chip>Chat</Chip>
              </NumberRow>
            ))}
          </Panel>
        ) : null}

        <FloatButton
          type="button"
          onClick={() => setOpen((p) => !p)}
          aria-expanded={open}
          aria-label="WhatsApp support"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 448 512"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="#25d366"
              d="M380.9 97.1C339 55.1 283.2 32 223.9 32 100.5 32 .1 132.9 0 256.3c0 45.1 11.8 89.1 34.3 127.9L0 480l98.7-32.5c37.2 20.3 78.9 31 121.1 31h.1c123.4 0 223.8-100.9 223.9-224.3 0-59.3-23.2-115-65.1-157.1zM223.9 438.7h-.1c-38.3 0-75.9-10.3-108.8-29.7l-7.8-4.6-58.5 19.3 19.6-56.9-5.1-8.1c-21.6-34.1-33-73.5-33-113.9.1-117 95.2-212.2 212.2-212.2 56.7 0 110 22.1 150 62.2 40 40.1 62 93.5 62 150.2-.1 117-95.2 212.1-212.4 212.1zm116.5-153.4c-6.4-3.2-37.8-18.6-43.7-20.8-5.9-2.1-10.2-3.2-14.5 3.2-4.3 6.4-16.7 20.8-20.5 25.1-3.8 4.3-7.6 4.8-14 1.6-6.4-3.2-27-9.9-51.4-31.5-19-16.9-31.8-37.7-35.5-44.1-3.8-6.4-.4-9.8 2.8-13 2.9-2.9 6.4-7.6 9.6-11.4 3.2-3.8 4.3-6.4 6.4-10.7 2.1-4.3 1.1-8-0.5-11.2-1.6-3.2-14.5-34.9-19.9-47.8-5.2-12.5-10.5-10.8-14.5-11-3.7-.2-8-.2-12.3-.2s-11.2 1.6-17 8-22.4 21.9-22.4 53.4 23 62 26.2 66.3c3.2 4.3 45.2 69 109.6 96.7 15.3 6.6 27.2 10.5 36.5 13.4 15.3 4.9 29.2 4.2 40.2 2.6 12.3-1.8 37.8-15.5 43.1-30.5 5.3-15 5.3-27.8 3.7-30.5-1.6-2.6-5.9-4.2-12.3-7.4z"
            />
          </svg>
          <span
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              whiteSpace: "nowrap",
              border: 0,
            }}
          >
            WhatsApp
          </span>
        </FloatButton>
      </Wrap>
    </>
  );
}

