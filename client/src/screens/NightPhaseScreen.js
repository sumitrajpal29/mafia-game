import React, { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import './NightPhaseScreen.css';

function NightPhaseScreen({ roomCode, myRole, gameState, playerId }) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [mafiaVotes, setMafiaVotes] = useState({}); // { playerId: targetId }
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [investigationResult, setInvestigationResult] = useState(null);
  
  // Give villagers a fake role to display (for anti-cheat)
  const [fakeRole] = useState(() => {
    if (myRole.role === 'villager') {
      const roles = ['detective', 'doctor', 'mafia'];
      return roles[Math.floor(Math.random() * roles.length)];
    }
    return myRole.role;
  });
  
  const displayRole = myRole.role === 'villager' ? fakeRole : myRole.role;

  useEffect(() => {
    // Listen for mafia vote updates (only real mafia receive this)
    if (myRole.role === 'mafia') {
      socket.on('mafia-vote-update', (votes) => {
        setMafiaVotes(votes);
      });
    }

    // Listen for investigation results (only real detective receives this)
    if (myRole.role === 'detective') {
      socket.on('investigation-result', (result) => {
        setInvestigationResult(result);
      });
    }

    return () => {
      socket.off('mafia-vote-update');
      socket.off('investigation-result');
    };
  }, [myRole.role]);

  const getAlivePlayers = () => {
    if (!gameState || !gameState.players) return [];
    
    // Doctor can target themselves (self-heal)
    // Villagers with fake doctor role also see themselves (for disguise)
    let alivePlayers;
    if (myRole.role === 'doctor' || (myRole.role === 'villager' && displayRole === 'doctor')) {
      alivePlayers = gameState.players.filter(p => p.isAlive);
    } else {
      alivePlayers = gameState.players.filter(p => p.isAlive && p.id !== playerId);
    }
    
    // Real mafia can't target other mafia members
    if (myRole.role === 'mafia') {
      const mafiaNames = myRole.teammates || [];
      alivePlayers = alivePlayers.filter(p => !mafiaNames.includes(p.name));
    }
    
    return alivePlayers;
  };

  const handlePlayerClick = (targetId) => {
    if (hasSubmitted) return;
    
    setSelectedTarget(targetId);
    
    // For REAL mafia, immediately broadcast vote to other mafia
    if (myRole.role === 'mafia') {
      socket.emit('mafia-vote-change', { roomCode, targetId });
    }
    // Villagers can click but it doesn't do anything special
  };

  const handleSubmit = () => {
    if (hasSubmitted) return;
    
    // Villagers submit with their selection (but server ignores it)
    if (myRole.role === 'villager') {
      socket.emit('night-action', { 
        roomCode, 
        targetId: selectedTarget, // Send selection but server treats as 'wait'
        action: 'wait' 
      }, (response) => {
        if (response.success) {
          setHasSubmitted(true);
        } else {
          alert(response.error);
        }
      });
      return;
    }
    
    if (!selectedTarget) return;
    
    const actionMap = {
      'mafia': 'kill',
      'detective': 'investigate',
      'doctor': 'heal'
    };
    
    const action = actionMap[myRole.role];
    if (!action) return;
    
    socket.emit('night-action', { 
      roomCode, 
      targetId: selectedTarget, 
      action 
    }, (response) => {
      if (response.success) {
        setHasSubmitted(true);
      } else {
        alert(response.error);
      }
    });
  };

  const canSubmit = () => {
    if (hasSubmitted) return false;
    if (!selectedTarget) return false;
    
    // For mafia, check if all ALIVE mafia have voted for the same target
    if (myRole.role === 'mafia') {
      const allPlayers = gameState?.players || [];
      const allMafiaNames = myRole.teammates || [];
      
      // Filter to only count ALIVE mafia teammates
      const aliveTeammates = allMafiaNames.filter(name => {
        const player = allPlayers.find(p => p.name === name);
        return player && player.isAlive;
      });
      
      const totalAliveMafia = aliveTeammates.length + 1; // alive teammates + me
      
      // Get all votes including mine
      const allVotes = { ...mafiaVotes, [playerId]: selectedTarget };
      const voteValues = Object.values(allVotes);
      
      // Check if we have votes from all ALIVE mafia
      if (voteValues.length !== totalAliveMafia) {
        return false; // Not all alive mafia have voted yet
      }
      
      // Check if all votes are for the same target
      const firstVote = voteValues[0];
      return voteValues.every(vote => vote === firstVote);
    }
    
    // Other roles can submit once they select someone
    return true;
  };

  const getActionText = () => {
    // Use display role (fake for villagers) for text
    switch (displayRole) {
      case 'mafia':
        return 'Select target to eliminate';
      case 'detective':
        return 'Select player to investigate';
      case 'doctor':
        return 'Select player to protect';
      default:
        return 'Select target';
    }
  };

  const getPlayerStatus = (playerId) => {
    if (myRole.role === 'mafia' && mafiaVotes[playerId]) {
      return 'voted';
    }
    return null;
  };

  const alivePlayers = getAlivePlayers();

  return (
    <div className="night-phase-screen">
      <div className="night-header">
        <h1>🌙 Night Phase - Day {gameState?.dayNumber || 1}</h1>
        <p className="night-instruction">{getActionText()}</p>
      </div>

      {/* Show mafia coordination info to display mafia (real or fake) */}
      {displayRole === 'mafia' && myRole.role === 'mafia' && (
        <div className="mafia-coordination">
          <h3>Your Team's Votes:</h3>
          <div className="mafia-votes-list">
            {myRole.teammates && myRole.teammates
              .filter(teammate => {
                // Only show ALIVE teammates
                const player = gameState.players.find(p => p.name === teammate);
                return player && player.isAlive;
              })
              .map((teammate, idx) => {
                const teammateVote = Object.entries(mafiaVotes).find(
                  ([voterId, targetId]) => {
                    const voter = gameState.players.find(p => p.id === voterId);
                    return voter && voter.name === teammate;
                  }
                );
                return (
                  <div key={idx} className="mafia-vote-item">
                    🤝 {teammate}: {teammateVote ? 
                      gameState.players.find(p => p.id === teammateVote[1])?.name || 'Unknown' : 
                      'Not voted'}
                  </div>
                );
              })}
            <div className="mafia-vote-item">
              🤝 You: {selectedTarget ? 
                gameState.players.find(p => p.id === selectedTarget)?.name : 
                'Not voted'}
            </div>
          </div>
          {!canSubmit() && selectedTarget && (
            <p className="consensus-warning">⚠️ Waiting for all mafia to vote for the same target</p>
          )}
        </div>
      )}

      {/* Player Grid */}
      <div className="players-grid">
        {alivePlayers.map(player => (
          <div
            key={player.id}
            className={`player-card ${selectedTarget === player.id ? 'selected' : ''} 
                       ${hasSubmitted ? 'disabled' : ''} ${player.id === playerId ? 'self' : ''}`}
            onClick={() => handlePlayerClick(player.id)}
          >
            <div className="player-name">
              {player.name}
              {player.id === playerId && myRole.role === 'doctor' && (
                <span className="you-badge"> (You)</span>
              )}
            </div>
            {getPlayerStatus(player.id) && (
              <div className="vote-indicator">✓</div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="night-actions">
        <button
          className={`submit-btn ${canSubmit() ? 'enabled' : 'disabled'}`}
          onClick={handleSubmit}
          disabled={!canSubmit()}
        >
          {hasSubmitted ? '✓ Submitted' : 'Submit'}
        </button>
        {myRole.role === 'mafia' && selectedTarget && !hasSubmitted && (
          canSubmit() ? (
            <p className="mafia-success">✅ All mafia agree! Ready to submit</p>
          ) : (
            <p className="mafia-hint">⚠️ Waiting for all mafia to vote for the same target</p>
          )
        )}
      </div>

      {/* Investigation Result (Real Detective Only) */}
      {investigationResult && myRole.role === 'detective' && (
        <div className={`investigation-result ${investigationResult.isMafia ? 'result-yes' : 'result-no'}`}>
          <h3>🔍 Is {investigationResult.targetName} Mafia?</h3>
          <div className="result-answer">
            {investigationResult.isMafia ? 'YES' : 'NO'}
          </div>
          <button 
            className="acknowledge-btn"
            onClick={() => {
              socket.emit('acknowledge-investigation', roomCode, (response) => {
                if (!response.success) {
                  alert(response.error);
                }
              });
            }}
          >
            Got It!
          </button>
        </div>
      )}

      {/* Detective waiting message */}
      {hasSubmitted && myRole.role === 'detective' && !investigationResult && (
        <div className="detective-waiting">
          <p>🔍 Investigation in progress... Results will appear shortly.</p>
        </div>
      )}

      {/* Waiting Status */}
      {hasSubmitted && (
        <div className="waiting-status">
          <p>⏳ Waiting for other players to complete their actions...</p>
        </div>
      )}

      {/* Remove villager-specific message to maintain disguise */}
    </div>
  );
}

export default NightPhaseScreen;
