import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Ticket, Wallet, User } from 'lucide-react';
import { FEATURE_FLAGS } from '../constants/featureFlags';
import './FloatingBottomNav.css';

const FloatingBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { 
      icon: Ticket, 
      label: 'Buy Data', 
      path: '/buy-data',
      disabled: false
    },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: User, label: 'Profile', path: '/profile' },
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
            <span className="nav-icon">
              <item.icon className="nav-icon-svg" size={22} />
            </span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FloatingBottomNav;
