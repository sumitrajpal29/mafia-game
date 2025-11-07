import React from 'react';
import './LobbyScreen.css';

function LobbyScreen({ roomCode, gameState, playerId, onStartGame }) {
  const isHost = gameState?.players?.find(p => p.id === playerId)?.isHost;
  const players = gameState?.players || [];
  const minPlayers = 6;
  const canStart = players.length >= minPlayers && isHost;

  return (
    <div className="lobby-screen">
      <div className="lobby-container card">
        <h1 className="lobby-title">Game Lobby</h1>
        
        <div className="room-code-display">
          <span className="room-code-label">Room Code:</span>
          <span className="room-code">{roomCode}</span>
        </div>

        <div className="players-section">
          <h2 className="section-title">
            Players ({players.length}/{minPlayers} minimum)
          </h2>
          
          <div className="players-list">
            {players.map((player, index) => (
              <div key={player.id} className="player-item">
                <span className="player-number">#{index + 1}</span>
                <span className="player-name">
                  {player.name}
                  {player.id === playerId && <span className="you-badge"> (you)</span>}
                </span>
                {player.isHost && <span className="host-badge">HOST</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="lobby-actions">
          {isHost && (
            <button 
              className="btn btn-primary"
              onClick={onStartGame}
              disabled={!canStart}
            >
              {canStart ? 'Start Game' : `Waiting for ${minPlayers - players.length} more player(s)`}
            </button>
          )}
          
          {!isHost && (
            <div className="waiting-message">
              Waiting for host to start the game...
            </div>
          )}
        </div>

        <div className="lobby-info">
          <p>Share the room code with your friends to join!</p>
        </div>
      </div>
    </div>
  );
}

export default LobbyScreen;
