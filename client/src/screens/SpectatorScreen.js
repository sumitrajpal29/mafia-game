import React from 'react';
import './SpectatorScreen.css';

function SpectatorScreen({ gameState, myPlayer }) {
  const players = gameState?.players || [];
  const alivePlayers = players.filter(p => p.isAlive);

  return (
    <div className="spectator-screen">
      <div className="spectator-container">
        <div className="spectator-card card">
          <div className="spectator-icon">☠️</div>
          <h1 className="spectator-title">You Have Been Eliminated</h1>
          <p className="spectator-message">
            You can no longer participate in the game, but you can watch as a spectator.
          </p>
          
          <div className="spectator-info">
            <div className="info-item">
              <span className="info-label">Your Name:</span>
              <span className="info-value">{myPlayer?.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className="info-value status-dead">Dead</span>
            </div>
          </div>

          <div className="game-status">
            <h3>Game Status</h3>
            <div className="status-item">
              <span className="status-label">Phase:</span>
              <span className="status-value">{gameState?.phase || 'Unknown'}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Day:</span>
              <span className="status-value">{gameState?.dayNumber || 1}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Players Alive:</span>
              <span className="status-value">{alivePlayers.length} / {players.length}</span>
            </div>
          </div>

          <div className="spectator-note">
            <p>👁️ You are spectating the game</p>
            <p>The game will continue without you</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpectatorScreen;
