// frontend/src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalStyle from './globalStyles';
import SplashScreen from './components/SplashScreen';

// Import pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
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
import WalletScreen from './pages/dashboard/WalletScreen';
import DailyLuckyDrawScreen from './pages/dashboard/DailyLuckyDrawScreen';
import DailyNumberDrawScreen from './pages/dashboard/DailyNumberDrawScreen';
import DailyHistoryScreen from './pages/dashboard/DailyHistoryScreen';
import GameWinnersScreen from './pages/dashboard/GameWinnersScreen';
import TopRandomScreen from './pages/dashboard/TopRandomScreen';

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
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
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
            
            {/* Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;
