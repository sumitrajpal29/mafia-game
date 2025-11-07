import React from 'react';
import './GameOverScreen.css';

function GameOverScreen({ gameState, winner, onPlayAgain }) {
  const players = gameState?.players || [];
  
  // Sort players: alive first, then dead; within each group, mafia first
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isAlive !== b.isAlive) return b.isAlive - a.isAlive;
    const roleOrder = { mafia: 0, detective: 1, doctor: 2, villager: 3 };
    return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'mafia': return '🔪';
      case 'detective': return '🔍';
      case 'doctor': return '⚕️';
      case 'villager': return '👤';
      default: return '❓';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'mafia': return '#e74c3c';
      case 'detective': return '#3498db';
      case 'doctor': return '#2ecc71';
      case 'villager': return '#95a5a6';
      default: return '#7f8c8d';
    }
  };

  const winningTeam = winner?.team || 'unknown';
  const winMessage = winner?.message || 'Game Over';

  return (
    <div className="gameover-screen">
      <div className="gameover-container card">
        <h1 className="gameover-title">🎉 Game Over!</h1>
        
        <div className={`winner-announcement ${winningTeam}`}>
          <div className="winner-icon">
            {winningTeam === 'mafia' ? '🔪' : '🏆'}
          </div>
          <h2 className="winner-team">
            {winningTeam === 'mafia' ? 'MAFIA WINS!' : 'VILLAGERS WIN!'}
          </h2>
          <p className="winner-message">{winMessage}</p>
        </div>

        <div className="final-roles">
          <h3>Final Roles</h3>
          <div className="roles-list">
            {sortedPlayers.map(player => (
              <div key={player.id} className="role-item">
                <div className="role-player-info">
                  <span className="role-icon">{getRoleIcon(player.role)}</span>
                  <span className="role-player-name">{player.name}</span>
                  {!player.isAlive && <span className="eliminated-badge">☠️</span>}
                </div>
                <span 
                  className="role-badge" 
                  style={{ 
                    backgroundColor: getRoleColor(player.role),
                    color: 'white'
                  }}
                >
                  {player.role?.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="gameover-actions">
          <button className="btn btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOverScreen;
