// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalStyle from './globalStyles';

// Import pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import HomeScreen from './pages/dashboard/HomeScreen';
import DepositScreen from './pages/dashboard/DepositScreen';
import WithdrawScreen from './pages/dashboard/WithdrawScreen';// Add this import
import BuyDataScreen from './pages/dashboard/BuyDataScreen'; // Add this import (create this file)
import RedeemScreen from './pages/dashboard/RedeemScreen'; // Add this import (create this file)

function App() {
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
            
            {/* Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;