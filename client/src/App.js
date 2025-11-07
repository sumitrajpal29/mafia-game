import React, { useState, useEffect } from 'react';
import './App.css';
import { socket, connectSocket, disconnectSocket } from './services/socket';

// Import screens
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import RoleRevealScreen from './screens/RoleRevealScreen';
import NightPhaseScreen from './screens/NightPhaseScreen';
import NightResultScreen from './screens/NightResultScreen';
import DayDiscussionScreen from './screens/DayDiscussionScreen';
import VotingScreen from './screens/VotingScreen';
import GameOverScreen from './screens/GameOverScreen';
import SpectatorScreen from './screens/SpectatorScreen';

function App() {
  const [screen, setScreen] = useState('home'); // home, lobby, roleReveal, night, nightResult, dayDiscussion, voting, gameOver
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [gameState, setGameState] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [nightResult, setNightResult] = useState(null);
  const [voteResults, setVoteResults] = useState(null);
  const [winner, setWinner] = useState(null);

  // Warn user before leaving the page if in an active game
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Only show warning if not on home screen (meaning user is in a game)
      if (screen !== 'home') {
        e.preventDefault();
        e.returnValue = '⚠️ You are in an active game! If you leave, you will lose your progress. Are you sure?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [screen]);

  useEffect(() => {
    connectSocket();

    // Listen for room updates
    socket.on('room-update', (state) => {
      setGameState(state);
    });

    // Listen for role assignment
    socket.on('role-assigned', (data) => {
      console.log('Role assigned:', data);
      setMyRole(data);
      // Show role reveal screen only after role is received
      setScreen('roleReveal');
    });

    // Listen for game start
    socket.on('game-started', (state) => {
      console.log('Game started:', state);
      setGameState(state);
      // Don't set screen here - wait for role-assigned event
    });

    // Listen for night results
    socket.on('night-result', (result) => {
      console.log('Night result:', result);
      setNightResult(result);
      
      if (result.gameOver) {
        setScreen('gameOver');
      } else {
        // Show night result screen
        setScreen('nightResult');
      }
    });

    // Listen for phase changes
    socket.on('phase-change', (data) => {
      console.log('Phase change:', data.phase);
      setGameState(prev => ({ ...prev, phase: data.phase }));
      
      // Only change screen if we're transitioning to a different phase
      if (data.phase === 'day') {
        // Only go to day discussion if we're not already there
        setScreen(prevScreen => {
          if (prevScreen !== 'dayDiscussion') {
            return 'dayDiscussion';
          }
          return prevScreen;
        });
      } else if (data.phase === 'voting') {
        setScreen('voting');
        setVoteResults(null); // Clear previous results
      } else if (data.phase === 'night') {
        setScreen('night'); // Go to night phase screen
      }
    });

    // Listen for vote updates
    socket.on('vote-update', (voteState) => {
      console.log('Vote update:', voteState);
    });

    // Listen for vote results
    socket.on('vote-result', (result) => {
      console.log('Vote result:', result);
      setVoteResults(result);
      // Server will handle timing for phase transition
    });

    // Listen for game over
    socket.on('game-over', (winnerData) => {
      console.log('Game over:', winnerData);
      setWinner(winnerData);
      setScreen('gameOver');
    });

    // Listen for player left
    socket.on('player-left', (data) => {
      console.log('Player left:', data);
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const handleCreateRoom = (name) => {
    socket.emit('create-room', name, (response) => {
      if (response.success) {
        setRoomCode(response.roomCode);
        setPlayerId(response.player.id);
        setScreen('lobby');
      }
    });
  };

  const handleJoinRoom = (name, code) => {
    setRoomCode(code);
    socket.emit('join-room', { roomCode: code, playerName: name }, (response) => {
      if (response.success) {
        setPlayerId(response.player.id);
        setScreen('lobby');
      } else {
        alert(response.error);
      }
    });
  };

  const handleStartGame = () => {
    socket.emit('start-game', roomCode, (response) => {
      if (!response.success) {
        alert(response.error);
      }
    });
  };

  const handleRoleRevealComplete = () => {
    // After role reveal, go to night phase (first night)
    setScreen('night');
  };

  const handleNightResultComplete = () => {
    // After night result, phase change will handle transition to day
    // The server already sent phase-change to 'day' after 5 seconds
    setScreen('dayDiscussion');
  };

  const handleProceedToVote = () => {
    socket.emit('ready-to-vote', roomCode, (response) => {
      if (!response.success) {
        alert(response.error);
      }
    });
  };

  const handleCastVote = (targetId) => {
    socket.emit('cast-vote', { roomCode, targetId }, (response) => {
      if (!response.success) {
        alert(response.error);
      }
    });
  };

  // Check if player is dead - show spectator screen instead of game screens
  const myPlayer = gameState?.players?.find(p => p.id === playerId);
  const isPlayerDead = myPlayer && !myPlayer.isAlive;
  const gameInProgress = screen !== 'home' && screen !== 'lobby' && screen !== 'gameOver';

  return (
    <div className="App">
      {screen === 'home' && (
        <HomeScreen 
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      )}
      
      {screen === 'lobby' && (
        <LobbyScreen
          roomCode={roomCode}
          gameState={gameState}
          playerId={playerId}
          onStartGame={handleStartGame}
        />
      )}
      
      {/* Show spectator screen for dead players during game */}
      {isPlayerDead && gameInProgress ? (
        <SpectatorScreen
          gameState={gameState}
          myPlayer={myPlayer}
        />
      ) : (
        <>
          {screen === 'roleReveal' && myRole && (
            <RoleRevealScreen
              myRole={myRole}
              onComplete={handleRoleRevealComplete}
            />
          )}
          
          {screen === 'night' && (
        <NightPhaseScreen
          roomCode={roomCode}
          gameState={gameState}
          playerId={playerId}
          myRole={myRole}
        />
      )}
      
      {screen === 'nightResult' && nightResult && (
        <NightResultScreen
          nightResult={nightResult}
          onComplete={handleNightResultComplete}
        />
      )}
      
      {screen === 'dayDiscussion' && (
        <DayDiscussionScreen
          gameState={gameState}
          playerId={playerId}
          nightResult={nightResult}
          onProceedToVote={handleProceedToVote}
        />
      )}
      
      {screen === 'voting' && (
        <VotingScreen
          gameState={gameState}
          playerId={playerId}
          onCastVote={handleCastVote}
          voteResults={voteResults}
        />
      )}
      
          {screen === 'gameOver' && (
            <GameOverScreen
              gameState={gameState}
              winner={winner}
              onPlayAgain={() => setScreen('home')}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
