import React from 'react';
import './GameScreen.css';

function GameScreen({ roomCode, gameState, playerId, myRole }) {
  // Placeholder for game screen
  // Will be customized based on user's requirements
  
  const phase = gameState?.phase || 'night';
  const dayNumber = gameState?.dayNumber || 1;
  const players = gameState?.players || [];
  const myPlayer = players.find(p => p.id === playerId);

  return (
    <div className="game-screen">
      <div className="game-container">
        <div className="game-header card">
          <div className="header-info">
            <h2>Day {dayNumber}</h2>
            <span className={`phase-badge phase-${phase}`}>
              {phase.toUpperCase()}
            </span>
          </div>
          <div className="room-code-small">Room: {roomCode}</div>
        </div>

        {myRole && (
          <div className="role-card card">
            <h3>Your Role</h3>
            <div className={`role-display role-${myRole.role}`}>
              {myRole.role.toUpperCase()}
            </div>
            {myRole.teammates && myRole.teammates.length > 0 && (
              <div className="teammates">
                <p>Fellow Mafia:</p>
                <ul>
                  {myRole.teammates.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="players-grid card">
          <h3>Players</h3>
          <div className="grid">
            {players.map(player => (
              <div 
                key={player.id} 
                className={`player-card ${!player.isAlive ? 'dead' : ''}`}
              >
                <div className="player-avatar">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  {!player.isAlive && (
                    <div className="player-status">☠️ Eliminated</div>
                  )}
                  {player.role && (
                    <div className="player-role">{player.role}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="action-area card">
          <h3>Actions</h3>
          <p className="placeholder-text">
            Game screen will be customized based on phase and role.
            This is a placeholder for now.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GameScreen;
