import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../utils/AuthContext";
import Container from "../components/Container";
import HouseCard from "../components/HouseCard";
import { houses } from "../data/houses";
import {
  HouseIcon,
  WalletIcon,
  PayoutIcon,
  ShieldIcon,
} from "../components/Icons";
import fintechMockup from "../assets/biggiHouse fintech platform interface.png";
import { getBiggiHousePublicConfig, getBiggiHouseWeeklyCardAccess } from "../services/api";
import { getAuthToken } from "../utils/auth";

const HeroSection = styled.section`
  padding: 70px 0 40px;

  @media (max-width: 640px) {
    padding: 32px 0 28px;
  }
`;

const HeroGrid = styled(Container)`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 22px;
  }
`;

const HeroCopy = styled.div`
  min-width: 0;
`;

const HeroCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 26px;
  box-shadow: ${({ theme }) => theme.shadows.soft};
  border: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 640px) {
    padding: 16px;
    border-radius: 18px;
  }
`;

const Mockup = styled.img`
  width: 100%;
  border-radius: 22px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};
`;

const Title = styled.h1`
  font-size: clamp(2.6rem, 4vw, 3.5rem);
  line-height: 1.05;
  margin-bottom: 16px;
  letter-spacing: -1px;

  @media (max-width: 640px) {
    font-size: clamp(2rem, 9vw, 2.5rem);
    line-height: 1.1;
    margin-bottom: 14px;
    text-align: center;
  }
`;

const AnimatedTitle = styled(Title)`
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  border-right: 3px solid ${({ theme }) => theme.colors.primary};
  display: inline-block;
  max-width: 100%;
  animation: typing 4.4s steps(25, end) 0.2s infinite,
    blink 0.9s step-end infinite;

  @keyframes typing {
    0% {
      width: 0;
    }
    55% {
      width: 100%;
    }
    100% {
      width: 0;
    }
  }

  @keyframes blink {
    0%,
    100% {
      border-color: transparent;
    }
    50% {
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }

  @media (max-width: 640px) {
    white-space: normal;
    overflow: visible;
    border-right: none;
    display: block;
    animation: fadeInText 1s ease both;

    @keyframes fadeInText {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
`;

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 1.05rem;
  margin-bottom: 18px;

  @media (max-width: 640px) {
    text-align: center;
    font-size: 0.98rem;
  }
`;

const PoweredBy = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.soft};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 24px;

  @media (max-width: 640px) {
    display: flex;
    width: 100%;
    justify-content: center;
    text-align: center;
    padding: 10px 14px;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const PrimaryButton = styled(Link)`
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  padding: 12px 20px;
  border-radius: 999px;
  font-weight: 600;
  box-shadow: ${({ theme }) => theme.shadows.card};
  text-align: center;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const GhostButton = styled(Link)`
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 12px 20px;
  border-radius: 999px;
  font-weight: 600;
  text-align: center;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const GhostActionButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 12px 20px;
  border-radius: 999px;
  font-weight: 600;
  text-align: center;
  background: #fff;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const StatGrid = styled(Container)`
  margin-top: 26px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 18px;
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const StatValue = styled.div`
  font-size: 22px;
  font-weight: 700;
`;

const StatLabel = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
  margin-top: 4px;
`;

const Section = styled.section`
  padding: 46px 0;
`;

const SectionTitle = styled.h2`
  font-size: 28px;
  margin-bottom: 10px;

  @media (max-width: 640px) {
    font-size: 24px;
  }
`;

const SectionSub = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 26px;
`;

const StepsRow = styled(Container)`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  align-items: center;
  position: relative;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StepCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 22px;
  box-shadow: ${({ theme }) => theme.shadows.card};
  display: grid;
  gap: 8px;
`;

const StepIcon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: ${({ theme }) => theme.colors.soft};
  display: grid;
  place-items: center;
`;

const Arrow = styled.div`
  position: absolute;
  top: 50%;
  left: 33%;
  width: 34%;
  height: 2px;
  background: ${({ theme }) => theme.colors.soft};
  transform: translateY(-50%);

  &::after,
  &::before {
    content: "";
    position: absolute;
    top: 50%;
    width: 10px;
    height: 10px;
    border-right: 2px solid ${({ theme }) => theme.colors.primary};
    border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
    transform: translateY(-50%) rotate(-45deg);
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }

  @media (max-width: 900px) {
    display: none;
  }
`;

const TrustText = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.muted};
  margin-top: 18px;
  font-size: 14px;
`;

const HousesGrid = styled(Container)`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Highlight = styled.div`
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 760px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 22px;
  }
`;

const HighlightTitle = styled.h3`
  font-size: 24px;
  margin-bottom: 8px;
`;

const HighlightButton = styled(Link)`
  background: #fff;
  color: ${({ theme }) => theme.colors.primary};
  padding: 12px 20px;
  border-radius: 999px;
  font-weight: 600;
`;

const Partners = styled.section`
  padding: 40px 0 20px;
`;

const PartnerRow = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const PartnerTitle = styled.p`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.muted};
`;

const PartnerLogos = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const PartnerBadge = styled.div`
  padding: 10px 16px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-weight: 600;
`;

const Footer = styled.footer`
  padding: 36px 0 50px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const FooterGrid = styled(Container)`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const FooterBrand = styled.div`
  display: grid;
  gap: 8px;
  color: ${({ theme }) => theme.colors.muted};
`;

const FooterLogo = styled.span`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 20px;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const Socials = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;

  @media (max-width: 900px) {
    justify-content: flex-start;
  }
`;

const SocialChip = styled.span`
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  font-weight: 600;
  font-size: 13px;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 24, 0.35);
  display: grid;
  place-items: center;
  z-index: 60;
  padding: 20px;
`;

const ModalCard = styled.div`
  width: min(520px, 100%);
  background: #fff;
  border-radius: 20px;
  padding: 22px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  display: grid;
  gap: 12px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
`;

const ModalText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 6px;
`;

const ModalGhost = styled.button`
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  font-weight: 900;
  cursor: pointer;
`;

const ModalPrimary = styled.button`
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  font-weight: 900;
  cursor: pointer;
`;

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const preview = houses.slice(0, 3);
  const [config, setConfig] = useState(null);
  const [access, setAccess] = useState(null);
  const [modal, setModal] = useState(null);

  const isGameEnabled = Boolean(access?.enabled ?? config?.features?.weeklyCardGameEnabled);
  const requireWeeklyPurchase = Boolean(access?.requireWeeklyDataPurchase);
  const weeklyPurchaseOk =
    !user ? true : requireWeeklyPurchase ? Boolean(access?.weeklyPurchaseOk) : true;
  const needsWeeklyPurchase = Boolean(user && requireWeeklyPurchase && !weeklyPurchaseOk);
  const hasPhoneNumber = Boolean(String(user?.phoneNumber || "").trim());

  useEffect(() => {
    getBiggiHousePublicConfig()
      .then((cfg) => setConfig(cfg))
      .catch(() => setConfig(null));
  }, []);

  useEffect(() => {
    if (!user) {
      setAccess(null);
      return;
    }
    const token = getAuthToken();
    if (!token) return;
    getBiggiHouseWeeklyCardAccess(token)
      .then((a) => setAccess(a))
      .catch(() => setAccess(null));
  }, [user]);

  const joinHouseHref = user ? "/houses" : "/login";
  const onJoinHouse = useMemo(() => () => navigate(joinHouseHref), [navigate, joinHouseHref]);

  const openWeeklyGame = () => {
    if (!user) {
      setModal({
        title: "Login required",
        text: "Please log in to play the Weekly Card Game.",
        primaryLabel: "Login",
        primaryTo: "/login",
      });
      return;
    }

    if (!isGameEnabled) {
      setModal({
        title: "Game disabled",
        text: "Weekly Card Game is currently disabled. Please check back later.",
        primaryLabel: "Close",
      });
      return;
    }

    if (needsWeeklyPurchase) {
      if (!hasPhoneNumber) {
        setModal({
          title: "Add phone number",
          text: "Please add your phone number in Profile so we can validate your weekly data purchase eligibility.",
          primaryLabel: "Go to Profile",
          primaryTo: "/profile",
        });
        return;
      }

      setModal({
        title: "Buy data required",
        text: "To play the Weekly Card Game, you must purchase at least 1 data bundle this week.",
        primaryLabel: "Buy Data",
        primaryTo: "/buy-data",
      });
      return;
    }

    navigate("/weekly-card-game");
  };

  const confirmLogout = () => {
    if (!user) return;
    setModal({
      title: "Confirm logout",
      text: "Are you sure you want to log out?",
      primaryLabel: "Logout",
      primaryAction: () => {
        logout();
        navigate("/");
      },
    });
  };

  return (
    <>
      <HeroSection>
        <HeroGrid>
          <HeroCopy>
            {user ? (
              <AnimatedTitle>Join biggi house and enjoy biggi rewards, for recharging biggi data bundles.</AnimatedTitle>
            ) : (
              <Title>Join biggi house and enjoy biggi rewards, for recharging biggi data bundles.</Title>
            )}
            <Sub>
              BiggiHouse is a smart group savings platform. Pick a house,
              contribute weekly, and receive scheduled payouts transparently.
            </Sub>
            {user && (
              <PoweredBy>Powered by Biggi Data bundles services</PoweredBy>
            )}
            <ButtonRow>
              {!user ? (
                <>
                  <GhostButton to="/signup">Create Account</GhostButton>
                  <PrimaryButton to="/login">Join a House</PrimaryButton>
                </>
              ) : (
                <>
                  <PrimaryButton to="/houses">Join a House</PrimaryButton>
                  <GhostActionButton type="button" onClick={confirmLogout}>
                    Sign out
                  </GhostActionButton>
                </>
              )}
            </ButtonRow>

            <div style={{ marginTop: 18 }}>
              <Highlight>
                <div>
                  <HighlightTitle>Fund Wallet</HighlightTitle>
                  <p style={{ opacity: 0.9 }}>
                    Add money to your BiggiHouse wallet to make fast house contributions.
                  </p>
                </div>
                <HighlightButton
                  as="button"
                  type="button"
                  disabled={false}
                  onClick={() => navigate(user ? "/wallet" : "/login")}
                  title={user ? "Fund wallet" : "Login to continue"}
                >
                  Fund Wallet
                </HighlightButton>
              </Highlight>

              <Highlight>
                <div>
                  <HighlightTitle>Weekly Card Game</HighlightTitle>
                  <p style={{ opacity: 0.9 }}>
                    Requires at least 1 data purchase this week to win weekly prediction to win free data bundle
                  </p>
                </div>
                <HighlightButton
                  as="button"
                  type="button"
                  disabled={false}
                  onClick={openWeeklyGame}
                  style={{ opacity: isGameEnabled ? 1 : 0.9 }}
                  aria-disabled={!isGameEnabled}
                  title={
                    !isGameEnabled
                      ? "Admin will enable soon"
                      : needsWeeklyPurchase
                      ? "Buy at least 1 data bundle this week to play"
                      : "Open game"
                  }
                >
                  Play now
                </HighlightButton>
              </Highlight>

              <Highlight style={{ marginTop: 12 }}>
                <div>
                  <HighlightTitle>Buy Data</HighlightTitle>
                  <p style={{ opacity: 0.9 }}>
                    Buy at least 1 data bundle weekly to qualify to join a house and play the Weekly Card Game.
                  </p>
                </div>
                <HighlightButton
                  as="button"
                  type="button"
                  disabled={false}
                  onClick={() => navigate(user ? "/buy-data" : "/login")}
                  title={user ? "Buy data" : "Login to continue"}
                >
                  Buy Data
                </HighlightButton>
              </Highlight>
            </div>
          </HeroCopy>
          <HeroCard>
            <Mockup
              src={fintechMockup}
              alt="biggiHouse fintech platform interface preview"
            />
          </HeroCard>
        </HeroGrid>

        <StatGrid>
          {[
            { value: "10", label: "Houses live" },
            { value: "\u20A64.2M", label: "Total payouts" },
            { value: "98%", label: "On-time payouts" },
            { value: "24/7", label: "Support coverage" },
          ].map((stat) => (
            <StatCard key={stat.label}>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatCard>
          ))}
        </StatGrid>
      </HeroSection>

      <Section>
        <Container>
          <SectionTitle>How biggiHouse works</SectionTitle>
          <SectionSub>
            Simple steps designed to feel safe, transparent, and consistent.
          </SectionSub>
        </Container>
        <StepsRow>
          <Arrow />
          {[
            {
              icon: <HouseIcon size={28} />,
              title: "Join a house",
              text: "Select a contribution plan that fits you.",
            },
            {
              icon: <WalletIcon size={28} />,
              title: "Contribute weekly",
              text: "Pay your contribution securely each cycle.",
            },
            {
              icon: <PayoutIcon size={28} />,
              title: "Receive a payout",
              text: "Get your full payout when it is your turn.",
            },
          ].map((step) => (
            <StepCard key={step.title}>
              <StepIcon>{step.icon}</StepIcon>
              <h3>{step.title}</h3>
              <p style={{ color: "#5b6475" }}>{step.text}</p>
            </StepCard>
          ))}
        </StepsRow>
        <TrustText>
          Secured payments {"\u00B7"} Powered by Flutterwave
        </TrustText>
      </Section>

      <Section>
        <Container>
          <SectionTitle>Choose a house</SectionTitle>
          <SectionSub>
            Houses are capped at 10 contributors to keep the cycle clear and
            fair.
          </SectionSub>
        </Container>
        <HousesGrid>
          {preview.map((house) => (
            <HouseCard
              key={house.id}
              house={house}
              onJoin={onJoinHouse}
            />
          ))}
        </HousesGrid>
      </Section>

      <Section>
        <Container>
          <Highlight>
            <div>
              <HighlightTitle>Start your savings journey today</HighlightTitle>
              <p style={{ opacity: 0.85 }}>
                Create an account in minutes and join the right house for you.
              </p>
            </div>
            {!user ? (
              <HighlightButton to="/signup">Get started</HighlightButton>
            ) : (
              <HighlightButton to="/houses">Open houses</HighlightButton>
            )}
          </Highlight>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionTitle>Trust and safety</SectionTitle>
          <SectionSub>
            Transparent cycles, verified payments, and dedicated support.
          </SectionSub>
          <div style={{ display: "grid", gap: "18px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <ShieldIcon size={32} />
              <div>
                <strong>Protected contributions</strong>
                <div style={{ color: "#5b6475" }}>
                  We verify every payment before it enters a house.
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Partners>
        <PartnerRow>
          <PartnerTitle>Trusted payments</PartnerTitle>
          <PartnerLogos>
            <PartnerBadge>Flutterwave</PartnerBadge>
            <PartnerBadge>Paystack</PartnerBadge>
          </PartnerLogos>
        </PartnerRow>
      </Partners>

      <Footer>
        <FooterGrid>
          <FooterBrand>
            <FooterLogo>biggiHouse</FooterLogo>
            <p>Your trusted savings platform.</p>
            <p style={{ color: "#3b82f6", fontWeight: 600 }}>
              Powered by Biggi Data bundles services
            </p>
          </FooterBrand>
          <FooterLinks>
            <Link to="#">Terms</Link>
            <Link to="#">Privacy</Link>
            <Link to="#">Contact</Link>
          </FooterLinks>
          <Socials>
            <SocialChip>Facebook</SocialChip>
            <SocialChip>Twitter</SocialChip>
            <SocialChip>Instagram</SocialChip>
          </Socials>
        </FooterGrid>
      </Footer>

      {modal ? (
        <ModalBackdrop
          role="dialog"
          aria-modal="true"
          aria-label={modal.title || "Notice"}
          onClick={() => setModal(null)}
        >
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{modal.title || "Notice"}</ModalTitle>
            <ModalText>{modal.text || ""}</ModalText>
            <ModalActions>
              <ModalGhost type="button" onClick={() => setModal(null)}>
                Close
              </ModalGhost>
              {modal.primaryLabel ? (
                <ModalPrimary
                  type="button"
                  onClick={() => {
                    const to = modal.primaryTo;
                    const act = modal.primaryAction;
                    setModal(null);
                    if (typeof act === "function") return act();
                    if (to) navigate(to);
                  }}
                >
                  {modal.primaryLabel}
                </ModalPrimary>
              ) : null}
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      ) : null}
    </>
  );
}
