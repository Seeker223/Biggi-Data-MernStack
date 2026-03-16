import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { User, Settings, Headset, LogOut, ChevronRight, ReceiptText, Copy, Shield } from "lucide-react";
import FloatingBottomNav from "../../components/FloatingBottomNav";
import { AuthContext } from "../../context/AuthContext";
import {
  getTransactionSecurityStatus,
  setTransactionPin,
  disableTransactionPin,
} from "../../services/api";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const normalizeSiteUrl = (raw) => {
  const value = String(raw || "").trim();
  if (!value) return "https://biggidata.com.ng";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};
const maskId = (value = "") => {
  const raw = String(value || "").replace(/\D/g, "");
  if (!raw) return "Not provided";
  if (raw.length <= 4) return raw;
  return `${raw.slice(0, 2)}******${raw.slice(-2)}`;
};

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [transactionPinEnabled, setTransactionPinEnabled] = useState(false);
  const [pin, setPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinNotice, setPinNotice] = useState("");
  const siteBaseUrl = normalizeSiteUrl(
    import.meta.env.VITE_PUBLIC_SITE_URL || "https://biggidata.com.ng"
  );
  const referralLink = `${siteBaseUrl.replace(/\/$/, "")}/signup?ref=${user?.referralCode || ""}`;

  useEffect(() => {
    if (!user) return undefined;
    let mounted = true;
    const loadPinStatus = async () => {
      try {
        const res = await getTransactionSecurityStatus();
        if (mounted) {
          setTransactionPinEnabled(Boolean(res?.data?.security?.transactionPinEnabled));
        }
      } catch {
        if (mounted) setTransactionPinEnabled(false);
      }
    };
    loadPinStatus();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!user) return null;

  const handleSavePin = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setPinNotice("PIN must be exactly 4 digits.");
      return;
    }
    setPinLoading(true);
    try {
      const res = await setTransactionPin(pin, currentPin);
      setTransactionPinEnabled(Boolean(res?.data?.transactionPinEnabled));
      setPinNotice(res?.data?.message || "Transaction PIN saved.");
      setPin("");
      setCurrentPin("");
    } catch (error) {
      setPinNotice(error?.response?.data?.message || "Failed to save transaction PIN.");
    } finally {
      setPinLoading(false);
    }
  };

  const handleDisablePin = async () => {
    if (!/^\d{4}$/.test(currentPin)) {
      setPinNotice("Enter current 4-digit PIN to disable.");
      return;
    }
    setPinLoading(true);
    try {
      const res = await disableTransactionPin(currentPin);
      setTransactionPinEnabled(Boolean(res?.data?.transactionPinEnabled));
      setPinNotice(res?.data?.message || "Transaction PIN disabled.");
      setPin("");
      setCurrentPin("");
    } catch (error) {
      setPinNotice(error?.response?.data?.message || "Failed to disable transaction PIN.");
    } finally {
      setPinLoading(false);
    }
  };

  const options = [
    {
      icon: <User size={20} color="#fff" />,
      label: "Edit Profile",
      onClick: () => navigate("/edit-profile"),
    },
    {
      icon: <Settings size={20} color="#fff" />,
      label: "Settings",
      onClick: () => navigate("/settings"),
    },
    {
      icon: <ReceiptText size={20} color="#fff" />,
      label: "Transaction History",
      onClick: () => navigate("/transactions"),
    },
    {
      icon: <Headset size={20} color="#fff" />,
      label: "Support",
      onClick: () => navigate("/support"),
    },
    ...(String(user?.role || "").toLowerCase() === "admin"
      ? [
          {
            icon: <Shield size={20} color="#fff" />,
            label: "Admin Dashboard",
            onClick: () => navigate("/admin"),
          },
        ]
      : []),
    {
      icon: <LogOut size={20} color="#fff" />,
      label: "Logout",
      onClick: () => setShowLogoutConfirm(true),
    },
  ];

  return (
    <Page>
      <Container>
        <Title>Profile</Title>
        <Content>
          <Avatar src={user.photo || DEFAULT_AVATAR} alt="Profile" />
          <Name>{user.username || "User"}</Name>
          <IdText>ID: {String(user._id || "").slice(-8)}</IdText>
          <IdText>Referral Code: {user.referralCode || "-"}</IdText>
          <IdText>BVN: {maskId(user.bvn)}</IdText>
          <IdText>NIN: {maskId(user.nin)}</IdText>
          {user.referralCode && (
            <ReferralRow>
              <ReferralInput
                value={referralLink}
                readOnly
              />
              <CopyButton
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(referralLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                <Copy size={16} />
                {copied ? "Copied" : "Copy"}
              </CopyButton>
            </ReferralRow>
          )}
          <BiometricBlock>
            <IdText style={{ marginTop: 10 }}>
              Transaction PIN: {transactionPinEnabled ? "Enabled" : "Disabled"}
            </IdText>
            <PinRow>
              <PinInput
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder={transactionPinEnabled ? "New PIN (optional)" : "Set 4-digit PIN"}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                disabled={pinLoading}
              />
              <PinInput
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder={transactionPinEnabled ? "Current PIN" : "Current PIN (if updating)"}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                disabled={pinLoading}
              />
            </PinRow>
            <PinActions>
              <BioButton type="button" onClick={handleSavePin} disabled={pinLoading}>
                {pinLoading ? "Please wait..." : transactionPinEnabled ? "Update PIN" : "Set PIN"}
              </BioButton>
              {transactionPinEnabled ? (
                <BioButton type="button" onClick={handleDisablePin} disabled={pinLoading}>
                  {pinLoading ? "Please wait..." : "Disable PIN"}
                </BioButton>
              ) : null}
            </PinActions>
            {pinNotice ? <BioNotice>{pinNotice}</BioNotice> : null}
          </BiometricBlock>

          <Options>
            {options.map((item) => (
              <Option key={item.label} onClick={item.onClick}>
                <Left>
                  <IconCircle>{item.icon}</IconCircle>
                  <Label>{item.label}</Label>
                </Left>
                <ChevronRight size={18} color="#666" />
              </Option>
            ))}
          </Options>
        </Content>
      </Container>

      {showLogoutConfirm && (
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>Logout</ModalTitle>
            <ModalText>Are you sure you want to logout?</ModalText>
            <ModalRow>
              <ModalButton $secondary onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </ModalButton>
              <ModalButton
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
              >
                Logout
              </ModalButton>
            </ModalRow>
          </ModalCard>
        </ModalOverlay>
      )}

      <FloatingBottomNav />
    </Page>
  );
};

export default ProfileScreen;

const Page = styled.div`
  min-height: 100vh;
  width: 100%;
  background: #f5f5f5;
  padding: 0 14px 96px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  overflow-x: hidden;
`;

const Container = styled.div`
  width: 100%;
  max-width: 460px;
  min-width: 0;
  box-sizing: border-box;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  color: #1a1a1a;
  font-weight: 800;
  text-align: center;
  padding: 14px 0;
`;

const Content = styled.div`
  width: 100%;
  background: #fff;
  border-radius: 22px;
  border: 1px solid #ececec;
  margin-top: 8px;
  padding: 24px 14px 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Avatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid #000;
  object-fit: cover;
`;

const Name = styled.h2`
  margin: 10px 0 4px;
  font-size: 20px;
  font-weight: 700;
  color: #003322;
`;

const IdText = styled.p`
  margin: 0;
  color: #555;
  font-size: 14px;
`;

const Options = styled.div`
  width: 100%;
  margin-top: 28px;
  display: grid;
  gap: 10px;
`;

const Option = styled.button`
  border: 1px solid #efefef;
  border-radius: 14px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  cursor: pointer;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const IconCircle = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  background: #007bff;
`;

const Label = styled.span`
  font-size: 16px;
  color: #003322;
  font-weight: 500;
`;

const ReferralRow = styled.div`
  margin-top: 10px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  min-width: 0;
`;

const ReferralInput = styled.input`
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  font-size: 12px;
  color: #111;
  background: #f9fafb;
`;

const CopyButton = styled.button`
  border: none;
  border-radius: 10px;
  background: #ff7a00;
  color: #fff;
  font-weight: 700;
  padding: 8px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
`;

const BiometricBlock = styled.div`
  margin-top: 10px;
  width: 100%;
  min-width: 0;
`;

const BioButton = styled.button`
  margin-top: 8px;
  border: none;
  border-radius: 10px;
  background: #111;
  color: #fff;
  font-weight: 700;
  padding: 10px 12px;
  cursor: pointer;
  width: 100%;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BioNotice = styled.p`
  margin: 6px 0 0;
  color: #555;
  font-size: 13px;
`;

const PinRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
  min-width: 0;
  @media (max-width: 380px) {
    grid-template-columns: 1fr;
  }
`;

const PinInput = styled.input`
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  font-size: 14px;
  background: #fff;
`;

const PinActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
  min-width: 0;
  @media (max-width: 380px) {
    grid-template-columns: 1fr;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 1200;
  padding: 18px;
`;

const ModalCard = styled.div`
  width: 100%;
  max-width: 320px;
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  text-align: center;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  color: #111;
`;

const ModalText = styled.p`
  margin: 8px 0 14px;
  color: #555;
`;

const ModalRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const ModalButton = styled.button`
  border: none;
  border-radius: 10px;
  padding: 10px 12px;
  color: #fff;
  font-weight: 700;
  background: ${(p) => (p.$secondary ? "#777" : "#ff7a00")};
  cursor: pointer;
`;
