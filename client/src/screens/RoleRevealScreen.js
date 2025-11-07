import React, { useEffect, useState } from 'react';
import './RoleRevealScreen.css';

function RoleRevealScreen({ myRole, onComplete }) {
  const [countdown, setCountdown] = useState(7);

  // Safety check - should not happen with the fix, but just in case
  if (!myRole || !myRole.role) {
    console.error('RoleRevealScreen: No role data available', myRole);
    return (
      <div className="role-reveal-screen">
        <div className="role-reveal-overlay"></div>
        <div className="role-reveal-container">
          <div className="role-reveal-card" style={{ borderColor: '#7f8c8d' }}>
            <div className="role-title" style={{ color: '#7f8c8d' }}>
              ⏳ Loading Role...
            </div>
            <div className="role-description">
              Please wait while your role is being assigned...
            </div>
          </div>
        </div>
      </div>
    );
  }

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

    // Auto-close after 7 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 7000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownInterval);
    };
  }, [onComplete]);

  const getRoleInfo = () => {
    switch (myRole.role) {
      case 'mafia':
        return {
          title: '🔪 MAFIA',
          description: 'You are part of the Mafia! Work with your teammates to eliminate villagers at night.',
          color: '#e74c3c',
          abilities: [
            'Kill one villager each night',
            'Coordinate with fellow mafia members',
            'Blend in during day discussions'
          ]
        };
      case 'detective':
        return {
          title: '🔍 DETECTIVE',
          description: 'You can investigate one player each night to discover their role.',
          color: '#3498db',
          abilities: [
            'Investigate one player per night',
            'Learn if they are Mafia or Villager',
            'Use your knowledge to guide voting'
          ]
        };
      case 'doctor':
        return {
          title: '💊 DOCTOR',
          description: 'You can protect one player from being killed each night.',
          color: '#2ecc71',
          abilities: [
            'Protect one player per night',
            'Save someone from Mafia attack',
            'You can protect yourself'
          ]
        };
      case 'villager':
        return {
          title: '👤 VILLAGER',
          description: 'Use discussion and voting to identify and eliminate the Mafia!',
          color: '#95a5a6',
          abilities: [
            'Participate in day discussions',
            'Vote to eliminate suspects',
            'Work with other villagers to win'
          ]
        };
      default:
        return {
          title: '❓ UNKNOWN',
          description: 'Unknown role',
          color: '#7f8c8d',
          abilities: []
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="role-reveal-screen">
      <div className="role-reveal-overlay"></div>
      <div className="role-reveal-container">
        <div className="countdown-badge">{countdown}s</div>
        
        <div className="role-reveal-card" style={{ borderColor: roleInfo.color }}>
          <div className="role-title" style={{ color: roleInfo.color }}>
            {roleInfo.title}
          </div>
          
          <div className="role-description">
            {roleInfo.description}
          </div>

          {myRole.teammates && myRole.teammates.length > 0 && (
            <div className="teammates-section">
              <h3>Your Fellow Mafia:</h3>
              <div className="teammates-list">
                {myRole.teammates.map((name, index) => (
                  <div key={index} className="teammate-name">
                    🤝 {name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="abilities-section">
            <h3>Your Abilities:</h3>
            <ul className="abilities-list">
              {roleInfo.abilities.map((ability, index) => (
                <li key={index}>{ability}</li>
              ))}
            </ul>
          </div>

          <div className="role-tip">
            💡 Memorize your role! This screen will close in {countdown} seconds.
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleRevealScreen;
