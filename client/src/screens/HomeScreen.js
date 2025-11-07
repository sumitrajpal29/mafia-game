import React, { useState } from 'react';
import './HomeScreen.css';

function HomeScreen({ onCreateRoom, onJoinRoom }) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState(''); // 'create' or 'join'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (mode === 'create') {
      onCreateRoom(playerName);
    } else if (mode === 'join') {
      if (!roomCode.trim()) {
        alert('Please enter room code');
        return;
      }
      onJoinRoom(playerName, roomCode.toUpperCase());
    }
  };

  return (
    <div className="home-screen">
      <div className="home-container card">
        <h1 className="home-title">🎭 Mafia Party Game</h1>
        <p className="home-subtitle">No God Role Needed - Fully Automated</p>

        {mode === '' && (
          <div className="mode-selection">
            <button 
              className="btn btn-primary mode-btn"
              onClick={() => setMode('create')}
            >
              Create New Game
            </button>
            <button 
              className="btn btn-secondary mode-btn"
              onClick={() => setMode('join')}
            >
              Join Existing Game
            </button>
          </div>
        )}

        {mode !== '' && (
          <form onSubmit={handleSubmit} className="home-form">
            <div className="form-group">
              <input
                type="text"
                className="input"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
              />
            </div>

            {mode === 'join' && (
              <div className="form-group">
                <input
                  type="text"
                  className="input"
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {mode === 'create' ? 'Create Room' : 'Join Room'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setMode('');
                  setPlayerName('');
                  setRoomCode('');
                }}
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default HomeScreen;
