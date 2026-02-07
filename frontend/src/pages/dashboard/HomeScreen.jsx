import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import FloatingBottomNav from '../../components/FloatingBottomNav'; 
import { FEATURE_FLAGS } from '../../constants/featureFlags'; 
import './HomeScreen.css';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    refreshUser();
  }, []);

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
        // Handle upload to server here
      };
      reader.readAsDataURL(file);
    }
  };

  const mainBalance = Number(user.mainBalance || 0);
  const rewardBalance = Number(user.rewardBalance || 0);
  const tickets = Number(user.tickets || 0);

  return (
    <div className="home-container">
      {/* Header */}
      <div className="home-header">
        <div className="user-info">
          <div className="avatar-container">
            <img 
              src={user?.photo || '/assets/default-profile.png'} 
              alt="Profile" 
              className="avatar"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="avatar-upload"
            />
            <label htmlFor="avatar-upload" className="avatar-upload-label">
              📷
            </label>
          </div>
          <div>
            <h2 className="welcome-text">Hi, {user.username}</h2>
            <p className="sub-text">Welcome back</p>
          </div>
        </div>
        
        <button 
          className="notification-btn"
          onClick={() => navigate('/notifications')}
        >
          🔔
          {user.notificationCount > 0 && (
            <span className="notification-badge">
              {user.notificationCount > 9 ? '9+' : user.notificationCount}
            </span>
          )}
        </button>
      </div>

      {/* Wallet Card */}
      <div className="wallet-card">
        <div className="balance-row">
          <div>
            <p className="balance-label">Main Balance</p>
            <h1 className="balance">₦{mainBalance.toLocaleString()}</h1>
          </div>
          <div className="action-buttons">
            <button 
              className="action-btn"
              onClick={() => navigate('/deposit')}
            >
              Deposit
            </button>
            <button 
              className="action-btn"
              onClick={() => navigate('/withdraw')}
            >
              Withdraw
            </button>
          </div>
        </div>
        
        <div className="divider"></div>
        
        <div className="balance-row">
          <div>
            <p className="balance-label">Reward Balance</p>
            <h1 className="balance">₦{rewardBalance.toLocaleString()}</h1>
          </div>
          <button 
            className="redeem-btn"
            onClick={() => !FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM && navigate('/redeem')}
            disabled={FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM}
          >
            Redeem
          </button>
        </div>
      </div>

      {/* Tickets Info */}
      <div className="ticket-info">
        <p>🎫 Available Tickets: <strong>{tickets}</strong></p>
        <p className="info-text">✅ Buy Any Bundle → Unlock Daily Games + Monthly Draw</p>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Bundle Card */}
        <div className="bundle-card">
          <div className="bundle-left">
            <div className="bundle-icon">📶</div>
            <h3>Buy Data Bundle Daily</h3>
            <button 
              className="small-btn"
              onClick={() => navigate('/buy-data')}
            >
              Buy Now
            </button>
          </div>
          <div className="divider-vertical"></div>
          <div className="bundle-right">
            <div className="ticket-display">
              <div className="ticket-icon">🎫</div>
              <span className="ticket-count">{tickets}</span>
            </div>
            <p>Win Daily Tickets + Monthly Draw Entry!</p>
          </div>
        </div>

        {/* Daily Game Card */}
        <div className="game-card">
          <div className="game-icon">🎮</div>
          <h3>Daily Number Picker Game</h3>
          <p className="game-prize">
            {FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? 'Win (prize hidden)' : 'Win ₦2,000 Daily'}
          </p>
          <button
            className={`play-btn ${tickets <= 0 ? 'disabled' : ''}`}
            onClick={() => {
              if (tickets <= 0) {
                setTicketModalVisible(true);
              } else {
                navigate('/daily-game');
              }
            }}
            disabled={tickets <= 0}
          >
            Play Now
          </button>
        </div>

        {/* Monthly Game Card */}
        <div className="monthly-card">
          <div className="monthly-header">
            <div className="trophy-icon">🏆</div>
            <h3>Monthly Draw</h3>
            <span className="eligible-badge">ELIGIBLE</span>
          </div>
          <h1 className="monthly-prize">
            {FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? 'Prize hidden' : '₦5,000'}
          </h1>
          <p className="monthly-subtitle">Monthly Jackpot</p>
          
          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-labels">
              <span>3/5 purchases</span>
              <span>60%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '60%' }}></div>
            </div>
            <p className="days-left">15 days left this month</p>
          </div>
          
          <button 
            className="monthly-btn"
            onClick={() => navigate('/monthly-draw')}
          >
            Check Eligibility
          </button>
        </div>
      </div>

      {/* Modals */}
      {ticketModalVisible && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-icon">⚠️</div>
            <h3>No Tickets Available</h3>
            <p>You need at least 1 ticket to play daily games.</p>
            <div className="modal-actions">
              <button 
                className="modal-btn primary"
                onClick={() => navigate('/buy-data')}
              >
                Buy Data Bundle
              </button>
              <button 
                className="modal-btn secondary"
                onClick={() => setTicketModalVisible(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <FloatingBottomNav />
    </div>
  );
};

export default HomeScreen;