import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Houses from "./pages/Houses";
import Subscription from "./pages/Subscription";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PaymentSuccess from "./pages/PaymentSuccess";
import Wallet from "./pages/Wallet";
import Profile from "./pages/Profile";
import FAQ from "./pages/FAQ";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import CPanel from "./pages/CPanel";
import WeeklyCardGame from "./pages/WeeklyCardGame";
import { useAuth } from "./utils/AuthContext";

const AppShell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  flex: 1;
  padding: 0 0 64px;
`;

const Banner = styled.div`
  width: 100%;
  padding: 16px 20px;
  background: #fff5c2;
  color: #3b2f0b;
  font-weight: 700;
  text-align: center;
  border-radius: 0 0 16px 16px;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.05);
`;

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const hideNav = ["/login", "/signup", "/forgot-password", "/verify-email"].includes(
    location.pathname
  );
  const showBanner = user && !hideNav;
  if (loading) {
    return null;
  }
  return (
    <AppShell>
      {!hideNav && <Navbar />}
      {showBanner && <Banner>WELCOME TO BIGGI HOUSE</Banner>}
      <Main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/houses"
            element={user ? <Houses /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/subscription"
            element={user ? <Subscription /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/dashboard"
            element={user ? <Dashboard /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/wallet"
            element={user ? <Wallet /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/weekly-card-game"
            element={user ? <WeeklyCardGame /> : <Navigate to="/login" replace />}
          />
          <Route path="/monthly-card-game" element={<Navigate to="/weekly-card-game" replace />} />
          <Route
            path="/profile"
            element={user ? <Profile /> : <Navigate to="/login" replace />}
          />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/payment-success"
            element={user ? <PaymentSuccess /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/c-panel"
            element={
              user && String(user?.role || "").toLowerCase() === "admin" ? (
                <CPanel />
              ) : (
                <Navigate to={user ? "/dashboard" : "/"} replace />
              )
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </Main>
    </AppShell>
  );
}

export default App;
