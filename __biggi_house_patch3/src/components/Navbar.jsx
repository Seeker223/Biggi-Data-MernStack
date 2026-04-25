import styled from "styled-components";
import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import Container from "./Container";
import biggiLogo from "../assets/biggiHouse2.png";
import { getStoredHouses } from "../utils/auth";
import { useAuth } from "../utils/AuthContext";

const NavWrap = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const NavInner = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  gap: 16px;
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  letter-spacing: -0.5px;
  line-height: 1;
`;

const LogoMark = styled.img`
  width: 56px;
  height: 56px;
  object-fit: contain;
  display: block;
`;

const NavGroup = styled.nav`
  display: flex;
  align-items: center;
  gap: 18px;

  @media (max-width: 860px) {
    display: none;
  }
`;

const HouseLabel = styled.span`
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #5b6475;
  font-size: 14px;
`;

const NavItem = styled(NavLink)`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.muted};
  padding: 6px 12px;
  border-radius: 999px;

  &.active {
    color: #fff;
    background: ${({ theme }) => theme.gradients.brand};
  }

  &:hover {
    color: #fff;
    background: ${({ theme }) => theme.gradients.brand};
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 860px) {
    display: none;
  }
`;

const OutlineButton = styled(Link)`
  padding: 10px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 999px;
  font-weight: 600;
`;

const SolidButton = styled(Link)`
  padding: 10px 18px;
  border-radius: 999px;
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  font-weight: 600;
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const Hamburger = styled.button`
  display: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-direction: column;
  cursor: pointer;

  span {
    width: 18px;
    height: 2px;
    background: ${({ theme }) => theme.colors.primary};
    display: block;
  }

  @media (max-width: 860px) {
    display: flex;
  }
`;

const MobileMenu = styled.div`
  display: none;
  background: #fff;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 12px 0 18px;

  @media (max-width: 860px) {
    display: ${({ $open }) => ($open ? "block" : "none")};
  }
`;

const MobileLinks = styled.div`
  display: grid;
  gap: 12px;
  padding: 8px 0;
`;

const MobileActions = styled.div`
  display: grid;
  gap: 10px;
  padding-top: 8px;
`;

const MobileButton = styled(Link)`
  padding: 12px 16px;
  border-radius: 12px;
  background: ${({ $variant, theme }) =>
    $variant === "solid" ? theme.gradients.brand : "transparent"};
  color: ${({ $variant }) => ($variant === "solid" ? "#fff" : "inherit")};
  border: 1px solid
    ${({ $variant, theme }) =>
      $variant === "solid" ? "transparent" : theme.colors.border};
  font-weight: 600;
`;

const MobileLogout = styled.button`
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  font-weight: 600;
  text-align: left;
`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";
  const navigate = useNavigate();
  const userId = user?.id || user?._id || user?.userId;
  const houses = getStoredHouses(userId);
  const houseLabel = houses.length
    ? `Joined: ${houses.map((h) => `House ${h.number}`).join(", ")}`
    : "No house joined";

  const handleResize = () => {
    if (window.innerWidth > 860) setOpen(false);
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <NavWrap>
      <NavInner>
        <Brand to="/">
          <LogoMark src={biggiLogo} alt="biggiHouse logo" />
        </Brand>
        <NavGroup>
          <NavItem to="/" end>
            Home
          </NavItem>
          <NavItem to="/faq">FAQ</NavItem>
          {user && (
            <>
              <NavItem to="/houses">Houses</NavItem>
              <NavItem to="/subscription">Subscription</NavItem>
              <NavItem to="/buy-data">Buy Data</NavItem>
              <NavItem to="/wallet">Wallet</NavItem>
              <NavItem to="/profile">Profile</NavItem>
              <NavItem to="/dashboard">Dashboard</NavItem>
              {isAdmin && <NavItem to="/c-panel">C-Panel</NavItem>}
              <HouseLabel title={houseLabel}>{houseLabel}</HouseLabel>
            </>
          )}
        </NavGroup>
        <Actions>
          {!user ? (
            <>
              <OutlineButton to="/login">Login</OutlineButton>
              <OutlineButton to="/verify-email">Verify Email</OutlineButton>
              <SolidButton to="/signup">Get Started</SolidButton>
            </>
          ) : (
            <>
              <SolidButton to="/dashboard">Dashboard</SolidButton>
              <OutlineButton as="button" type="button" onClick={handleLogout}>
                Logout
              </OutlineButton>
            </>
          )}
        </Actions>
        <Hamburger type="button" onClick={() => setOpen((prev) => !prev)}>
          <span />
          <span />
          <span />
        </Hamburger>
      </NavInner>
      <MobileMenu $open={open}>
        <Container>
          <MobileLinks>
            <NavItem to="/" end onClick={() => setOpen(false)}>
              Home
            </NavItem>
            <NavItem to="/faq" onClick={() => setOpen(false)}>
              FAQ
            </NavItem>
            {user && (
              <>
                <NavItem to="/houses" onClick={() => setOpen(false)}>
                  Houses
                </NavItem>
                <NavItem to="/subscription" onClick={() => setOpen(false)}>
                  Subscription
                </NavItem>
                <NavItem to="/buy-data" onClick={() => setOpen(false)}>
                  Buy Data
                </NavItem>
                <NavItem to="/wallet" onClick={() => setOpen(false)}>
                  Wallet
                </NavItem>
                <NavItem to="/profile" onClick={() => setOpen(false)}>
                  Profile
                </NavItem>
                <NavItem to="/dashboard" onClick={() => setOpen(false)}>
                  Dashboard
                </NavItem>
                {isAdmin && (
                  <NavItem to="/c-panel" onClick={() => setOpen(false)}>
                    C-Panel
                  </NavItem>
                )}
              </>
            )}
          </MobileLinks>
          <MobileActions>
            {!user ? (
              <>
                <MobileButton to="/login" onClick={() => setOpen(false)}>
                  Login
                </MobileButton>
                <MobileButton
                  to="/signup"
                  $variant="solid"
                  onClick={() => setOpen(false)}
                >
                  Get Started
                </MobileButton>
              </>
            ) : (
              <>
                <MobileButton
                  to="/dashboard"
                  $variant="solid"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </MobileButton>
                <MobileLogout onClick={handleLogout}>Logout</MobileLogout>
              </>
            )}
          </MobileActions>
        </Container>
      </MobileMenu>
    </NavWrap>
  );
}
