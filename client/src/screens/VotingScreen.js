import React, { useState, useEffect } from 'react';
import './VotingScreen.css';
import { socket } from '../services/socket';

function VotingScreen({ gameState, playerId, onCastVote, voteResults }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [voteState, setVoteState] = useState(null);

  useEffect(() => {
    // Listen for vote updates
    socket.on('vote-update', (state) => {
      console.log('Vote update received:', state);
      setVoteState(state);
    });

    return () => {
      socket.off('vote-update');
    };
  }, []);

  useEffect(() => {
    // Start countdown when results are shown
    if (voteResults) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [voteResults]);

  const players = gameState?.players || [];
  const alivePlayers = players.filter(p => p.isAlive);
  const myPlayer = players.find(p => p.id === playerId);
  const isAlive = myPlayer?.isAlive;
  const dayNumber = gameState?.dayNumber || 1;

  const handleVote = () => {
    if (!selectedPlayer || hasVoted) return;
    
    onCastVote(selectedPlayer);
    setHasVoted(true);
  };

  // Show results if available
  if (voteResults) {
    return (
      <div className="voting-screen">
        <div className="voting-container">
          <div className="vote-results card">
            <h1>📊 Voting Results</h1>
            
            {voteResults.eliminated ? (
              <>
                <div className="eliminated-announcement">
                  <h2>🔥 Eliminated</h2>
                  <div className="eliminated-player">
                    <div className="eliminated-avatar">
                      {voteResults.eliminated.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="eliminated-info">
                      <div className="eliminated-name">{voteResults.eliminated.name}</div>
                    </div>
                  </div>
                </div>
                <p className="vote-message">
                  The village has spoken. {voteResults.eliminated.name} has been eliminated.
                </p>
              </>
            ) : voteResults.tie ? (
              <div className="tie-announcement">
                <h2>⚖️ It's a Tie!</h2>
                <p className="vote-message">
                  The votes were tied. No one was eliminated this round.
                </p>
              </div>
            ) : (
              <div className="no-elimination">
                <h2>🤷 No Elimination</h2>
                <p className="vote-message">
                  No clear majority. No one was eliminated this round.
                </p>
              </div>
            )}

            {voteResults.gameOver ? (
              <div className="game-over-preview">
                <h3>🎮 Game Over!</h3>
                <p>The game will end in {countdown} seconds...</p>
              </div>
            ) : (
              <div className="next-phase-info">
                <p>🌙 Night is falling... Starting in {countdown} seconds.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-screen">
      <div className="voting-container">
        {/* Header */}
        <div className="voting-header card">
          <h1>🗳️ Day {dayNumber} - Voting</h1>
          <p className="phase-description">
            Vote to eliminate a suspected Mafia member
          </p>
        </div>

        {isAlive ? (
          <>
            {/* Voting Instructions */}
            <div className="voting-instructions card">
              <h3>How to Vote</h3>
              <p>Select a player you want to eliminate, then click "Cast Vote"</p>
              <p className="warning-text">⚠️ You cannot change your vote once submitted!</p>
            </div>

            {/* Players to Vote For */}
            <div className="voting-section card">
              <h2>Select Player to Eliminate</h2>
              
              <div className="voting-grid">
                {alivePlayers
                  .filter(p => p.id !== playerId) // Can't vote for yourself
                  .map(player => {
                    // Get vote info for this player
                    const voteInfo = voteState?.votersByTarget?.find(v => v.targetId === player.id);
                    const voteCount = voteInfo?.count || 0;
                    const voters = voteInfo?.voters || [];
                    
                    if (voteCount > 0) {
                      console.log(`Player ${player.name} has ${voteCount} votes from:`, voters);
                    }
                    
                    return (
                      <div
                        key={player.id}
                        className={`vote-player-card ${selectedPlayer === player.id ? 'selected' : ''} ${hasVoted ? 'disabled' : ''}`}
                        onClick={() => !hasVoted && setSelectedPlayer(player.id)}
                      >
                        <div className="vote-player-avatar">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="vote-player-name">{player.name}</div>
                        
                        {/* Vote Count Badge */}
                        {voteCount > 0 && (
                          <div className="vote-count-badge">
                            {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                          </div>
                        )}
                        
                        {/* Voters List */}
                        {voters.length > 0 && (
                          <div className="voters-list">
                            {voters.map((voterName, idx) => (
                              <span key={idx} className="voter-tag">
                                {voterName}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {selectedPlayer === player.id && (
                          <div className="selected-indicator">✓</div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Vote Button */}
            <div className="vote-action card">
              {hasVoted ? (
                <div className="voted-message">
                  <h3>✅ Vote Submitted</h3>
                  <p>Waiting for other players to vote...</p>
                </div>
              ) : (
                <>
                  <button
                    className="btn btn-primary btn-large"
                    onClick={handleVote}
                    disabled={!selectedPlayer || hasVoted}
                  >
                    {selectedPlayer 
                      ? `Vote to Eliminate ${players.find(p => p.id === selectedPlayer)?.name}`
                      : 'Select a Player First'
                    }
                  </button>
                  {selectedPlayer && (
                    <p className="vote-warning">
                      ⚠️ This action cannot be undone!
                    </p>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="spectator-voting card">
            <h2>👁️ Spectating Vote</h2>
            <p>You are eliminated and cannot vote.</p>
            <p>Watch as the remaining players decide who to eliminate.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VotingScreen;
