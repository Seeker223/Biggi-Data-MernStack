// frontend/src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalStyle from './globalStyles';
import SplashScreen from './components/SplashScreen';
import AlertModalHost from './components/AlertModalHost';
import ConfirmModalHost from './components/ConfirmModalHost';
import BalanceUpdateModalHost from './components/BalanceUpdateModalHost';

// Import pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import LaunchScreen from './pages/LaunchScreen';
import HomeScreen from './pages/dashboard/HomeScreen';
import DepositScreen from './pages/dashboard/DepositScreen';
import WithdrawScreen from './pages/dashboard/WithdrawScreen';// Add this import
import BuyDataScreen from './pages/dashboard/BuyDataScreen'; // Add this import (create this file)
import RedeemScreen from './pages/dashboard/RedeemScreen'; // Add this import (create this file)
import SelectNetworkScreen from './pages/dashboard/SelectNetworkScreen';
import SelectPlanScreen from './pages/dashboard/SelectPlanScreen';
import BuyDataSuccessScreen from './pages/dashboard/BuyDataSuccessScreen';
import NotificationScreen from './pages/dashboard/NotificationScreen';
import ProfileScreen from './pages/dashboard/ProfileScreen';
import EditProfileScreen from './pages/dashboard/EditProfileScreen';
import SettingsScreen from './pages/dashboard/SettingsScreen';
import WalletScreen from './pages/dashboard/WalletScreen';
import DailyLuckyDrawScreen from './pages/dashboard/DailyLuckyDrawScreen';
import DailyNumberDrawScreen from './pages/dashboard/DailyNumberDrawScreen';
import DailyHistoryScreen from './pages/dashboard/DailyHistoryScreen';
import GameWinnersScreen from './pages/dashboard/GameWinnersScreen';
import TopRandomScreen from './pages/dashboard/TopRandomScreen';
import UserRoleScreen from './pages/dashboard/UserRoleScreen';
import TermsScreen from './pages/dashboard/terms';
import DeleteAccountScreen from './pages/dashboard/deleteAccount';
import DepositHistoryScreen from './pages/dashboard/DepositHistoryScreen';
import TransactionHistoryScreen from './pages/dashboard/TransactionHistoryScreen';
import PaymentMethodsScreen from './pages/dashboard/PaymentMethodsScreen';
import LanguageScreen from './pages/dashboard/LanguageScreen';
import PrivacyPolicyScreen from './pages/dashboard/PrivacyPolicyScreen';
import AboutScreen from './pages/dashboard/AboutScreen';
import SupportScreen from './pages/dashboard/SupportScreen';
import AdminScreen from './pages/dashboard/AdminScreen';
import ReferralScreen from './pages/dashboard/ReferralScreen';
import TopPurchasersScreen from './pages/dashboard/TopPurchasersScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <>
        <GlobalStyle />
        <SplashScreen />
      </>
    );
  }

  return (
    <>
      <GlobalStyle />
      <AuthProvider>
        <AlertModalHost />
        <ConfirmModalHost />
        <BalanceUpdateModalHost />
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/launch" element={<LaunchScreen />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomeScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/deposit" element={<DepositScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/withdraw" element={<WithdrawScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/buy-data" element={<BuyDataScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/redeem" element={<RedeemScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/select-network" element={<SelectNetworkScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/select-plan" element={<SelectPlanScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/buy-data-success" element={<BuyDataSuccessScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/notifications" element={<NotificationScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfileScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/edit-profile" element={<EditProfileScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/settings" element={<SettingsScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/wallet" element={<WalletScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/daily-draw" element={<DailyNumberDrawScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/daily-game" element={<DailyLuckyDrawScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/daily-history" element={<DailyHistoryScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/game-winner" element={<GameWinnersScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/top-random" element={<TopRandomScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/user-role" element={<UserRoleScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/terms" element={<TermsScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/delete-account" element={<DeleteAccountScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/deposit-history" element={<DepositHistoryScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/transactions" element={<TransactionHistoryScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/payment-methods" element={<PaymentMethodsScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/language" element={<LanguageScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/privacy-policy" element={<PrivacyPolicyScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/about" element={<AboutScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/support" element={<SupportScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/referrals" element={<ReferralScreen />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/top-purchases" element={<TopPurchasersScreen />} />
            </Route>
            
            {/* Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;
