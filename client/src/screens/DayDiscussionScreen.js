import React, { useState } from 'react';
import './DayDiscussionScreen.css';

function DayDiscussionScreen({ gameState, playerId, nightResult, onProceedToVote }) {
  const [hasClickedReady, setHasClickedReady] = useState(false);
  const players = gameState?.players || [];
  const alivePlayers = players.filter(p => p.isAlive);
  const myPlayer = players.find(p => p.id === playerId);
  const isAlive = myPlayer?.isAlive;
  const dayNumber = gameState?.dayNumber || 1;

  const handleReadyClick = () => {
    if (hasClickedReady) return;
    setHasClickedReady(true);
    onProceedToVote();
  };

  return (
    <div className="day-discussion-screen">
      <div className="day-container">
        {/* Header */}
        <div className="day-header card">
          <h1>☀️ Day {dayNumber} - Discussion</h1>
          <p className="phase-description">
            Discuss with other players and decide who to vote out
          </p>
        </div>

        {/* Night Result */}
        {nightResult && nightResult.eliminated && (
          <div className="night-result card alert-danger">
            <h3>💀 Last Night...</h3>
            <p className="eliminated-message">
              <strong>{nightResult.eliminated.name}</strong> was killed by the Mafia!
            </p>
          </div>
        )}

        {nightResult && !nightResult.eliminated && (
          <div className="night-result card alert-success">
            <h3>✨ Last Night...</h3>
            <p className="safe-message">
              No one was killed! The Doctor saved someone, or the Mafia chose wisely.
            </p>
          </div>
        )}

        {/* Players List */}
        <div className="players-section card">
          <h2>Players ({alivePlayers.length} alive)</h2>
          
          <div className="players-grid">
            {players.map(player => (
              <div 
                key={player.id} 
                className={`player-card ${!player.isAlive ? 'dead' : ''} ${player.id === playerId ? 'you' : ''}`}
              >
                <div className="player-avatar">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="player-info">
                  <div className="player-name">
                    {player.name}
                    {player.id === playerId && <span className="you-tag"> (You)</span>}
                  </div>
                  {!player.isAlive && (
                    <div className="player-status">
                      <span className="dead-badge">☠️ Eliminated</span>
                    </div>
                  )}
                  {player.isAlive && player.id === playerId && !isAlive && (
                    <div className="spectator-badge">👁️ Spectating</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discussion Tips */}
        <div className="discussion-tips card">
          <h3>💬 Discussion Phase</h3>
          <ul>
            <li>Share your suspicions with other players</li>
            <li>Listen to what others have to say</li>
            <li>Look for suspicious behavior</li>
            <li>Consider voting patterns from previous rounds</li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="action-section card">
          {isAlive ? (
            <>
              {!hasClickedReady ? (
                <>
                  <p className="action-description">
                    When you're ready to vote, click the button below.
                    Voting will begin once all players are ready.
                  </p>
                  <button 
                    className="btn btn-primary btn-large"
                    onClick={handleReadyClick}
                  >
                    Ready to Vote
                  </button>
                </>
              ) : (
                <div className="ready-waiting">
                  <h3>✅ You are ready!</h3>
                  <p>Waiting for other players to be ready...</p>
                  <div className="waiting-spinner">⏳</div>
                </div>
              )}
            </>
          ) : (
            <div className="spectator-message">
              <p>You are eliminated and cannot vote.</p>
              <p>You can still watch the game unfold.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DayDiscussionScreen;
