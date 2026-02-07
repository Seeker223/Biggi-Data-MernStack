import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FEATURE_FLAGS } from '../constants/featureFlags';
import './FloatingBottomNav.css';

const FloatingBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: '🏠', label: 'Home', path: '/' },
    { 
      icon: '🎫', 
      label: 'Draws', 
      path: '/daily-draw',
      disabled: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM
    },
    { icon: '💰', label: 'Wallet', path: '/wallet' },
    { icon: '👤', label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="bottom-nav-wrapper">
      <div className="bottom-nav">
        {navItems.map((item, index) => (
          <button
            key={index}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
            onClick={() => !item.disabled && navigate(item.path)}
            disabled={item.disabled}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FloatingBottomNav;