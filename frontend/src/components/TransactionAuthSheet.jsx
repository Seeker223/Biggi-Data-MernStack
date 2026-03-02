import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { KeyRound, X } from "lucide-react";

const TransactionAuthSheet = ({
  visible,
  loading = false,
  title = "Authorize Transaction",
  subtitle = "Enter your 4-digit PIN to continue.",
  pinConfigured = true,
  onClose,
  onSubmit,
}) => {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) {
      setPin("");
      setConfirmPin("");
      setError("");
    }
  }, [visible]);

  if (!visible) return null;

  const handleContinue = async () => {
    if (!/^\d{4}$/.test(pin.trim())) {
      setError("Enter a valid 4-digit PIN.");
      return;
    }
    if (!pinConfigured) {
      if (!/^\d{4}$/.test(confirmPin.trim())) {
        setError("Confirm your 4-digit PIN.");
        return;
      }
      if (pin.trim() !== confirmPin.trim()) {
        setError("PINs do not match.");
        return;
      }
    }
    setError("");
    await onSubmit?.({
      method: "pin",
      transactionPin: pin.trim(),
      setupPin: !pinConfigured ? pin.trim() : "",
    });
  };

  return (
    <Overlay onClick={() => !loading && onClose?.()}>
      <Sheet onClick={(e) => e.stopPropagation()}>
        <Handle />
        <TopRow>
          <TitleWrap>
            <Title>{title}</Title>
            <Subtitle>{subtitle}</Subtitle>
          </TitleWrap>
          <CloseButton type="button" onClick={() => !loading && onClose?.()} disabled={loading}>
            <X size={18} />
          </CloseButton>
        </TopRow>

        <MethodRow>
          <MethodButton
            type="button"
            $active
            disabled
          >
            <KeyRound size={18} />
            {pinConfigured ? "4-digit PIN" : "Create 4-digit PIN"}
          </MethodButton>
        </MethodRow>

        <PinInput
          type="password"
          inputMode="numeric"
          maxLength={4}
          placeholder={pinConfigured ? "Enter 4-digit PIN" : "Set new 4-digit PIN"}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          disabled={loading}
        />
        {!pinConfigured ? (
          <PinInput
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="Confirm new 4-digit PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            disabled={loading}
          />
        ) : null}

        {error ? <ErrorText>{error}</ErrorText> : null}

        <ContinueButton type="button" onClick={handleContinue} disabled={loading}>
          {loading ? "Please wait..." : pinConfigured ? "Continue" : "Set PIN & Continue"}
        </ContinueButton>
      </Sheet>
    </Overlay>
  );
};

export default TransactionAuthSheet;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 4000;
`;

const Sheet = styled.div`
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-top-left-radius: 22px;
  border-top-right-radius: 22px;
  padding: 12px 16px 20px;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.2);
`;

const Handle = styled.div`
  width: 42px;
  height: 4px;
  border-radius: 999px;
  background: #dedede;
  margin: 0 auto 12px;
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const TitleWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #111;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: #666;
`;

const CloseButton = styled.button`
  border: none;
  background: #f2f2f2;
  color: #333;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const MethodRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 14px;
`;

const MethodButton = styled.button`
  border: 1px solid ${(props) => (props.$active ? "#ff7a00" : "#e6e6e6")};
  background: ${(props) => (props.$active ? "rgba(255,122,0,0.08)" : "#fff")};
  color: ${(props) => (props.$active ? "#b45309" : "#222")};
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 700;
`;

const PinInput = styled.input`
  margin-top: 12px;
  width: 100%;
  height: 46px;
  border-radius: 12px;
  border: 1px solid #e1e1e1;
  padding: 0 14px;
  font-size: 15px;
  outline: none;
  &:focus {
    border-color: #ff7a00;
    box-shadow: 0 0 0 3px rgba(255, 122, 0, 0.12);
  }
`;

const ErrorText = styled.p`
  margin: 10px 2px 0;
  color: #dc3545;
  font-size: 13px;
  font-weight: 600;
`;

const ContinueButton = styled.button`
  margin-top: 14px;
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 12px;
  background: #111;
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
