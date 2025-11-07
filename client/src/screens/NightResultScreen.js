import React, { useEffect, useState } from 'react';
import './NightResultScreen.css';

function NightResultScreen({ nightResult, onComplete }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-transition after 5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [onComplete]);

  const eliminatedPlayer = nightResult?.eliminated;

  return (
    <div className="night-result-screen">
      <div className="night-result-overlay"></div>
      <div className="night-result-container">
        <div className="countdown-badge">{countdown}s</div>
        
        <div className="night-result-card">
          <h1 className="result-title">🌙 Night Has Ended</h1>
          
          {eliminatedPlayer ? (
            <div className="death-announcement">
              <div className="skull-icon">💀</div>
              <h2 className="victim-name">{eliminatedPlayer.name}</h2>
              <p className="death-message">was killed during the night</p>
            </div>
          ) : (
            <div className="no-death-announcement">
              <div className="safe-icon">✨</div>
              <h2 className="no-death-message">No one died tonight</h2>
              <p className="safe-message">Everyone survived the night!</p>
            </div>
          )}

          <div className="transition-info">
            Transitioning to day phase...
          </div>
        </div>
      </div>
    </div>
  );
}

export default NightResultScreen;
