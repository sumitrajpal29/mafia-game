const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameManager = require('./gameManager');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const gameManager = new GameManager();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mafia game server is running' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join or create game room
  socket.on('create-room', (playerName, callback) => {
    const roomCode = gameManager.createRoom();
    const player = gameManager.addPlayerToRoom(roomCode, socket.id, playerName);
    socket.join(roomCode);
    
    callback({ success: true, roomCode, player });
    io.to(roomCode).emit('room-update', gameManager.getRoomState(roomCode));
  });

  // Join existing room
  socket.on('join-room', (data, callback) => {
    const { roomCode, playerName } = data;
    
    if (!gameManager.roomExists(roomCode)) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    const player = gameManager.addPlayerToRoom(roomCode, socket.id, playerName);
    socket.join(roomCode);
    
    callback({ success: true, roomCode, player });
    io.to(roomCode).emit('room-update', gameManager.getRoomState(roomCode));
  });

  // Start game
  socket.on('start-game', (roomCode, callback) => {
    const result = gameManager.startGame(roomCode);
    
    if (result.success) {
      const roomState = gameManager.getRoomState(roomCode);
      const allPlayers = gameManager.getAllPlayers(roomCode);
      
      // Send each player their role privately using full player data
      allPlayers.forEach(player => {
        io.to(player.id).emit('role-assigned', {
          role: player.role,
          teammates: player.role === 'mafia' ? 
            allPlayers.filter(p => p.role === 'mafia' && p.id !== player.id).map(p => p.name) : 
            []
        });
      });
      
      // Broadcast game started to all players
      io.to(roomCode).emit('game-started', roomState);
      callback({ success: true });
    } else {
      callback({ success: false, error: result.error });
    }
  });

  // Mafia vote change (only for real-time coordination)
  socket.on('mafia-vote-change', (data) => {
    const { roomCode, targetId } = data;
    const result = gameManager.updateMafiaVote(roomCode, socket.id, targetId);
    
    if (result.success) {
      // Get all mafia members and send them the updated votes
      const allPlayers = gameManager.getAllPlayers(roomCode);
      const mafiaPlayers = allPlayers.filter(p => p.role === 'mafia' && p.isAlive);
      
      mafiaPlayers.forEach(mafia => {
        io.to(mafia.id).emit('mafia-vote-update', result.votes);
      });
      
      // Broadcast night actions status to all players
      const status = gameManager.getNightActionsStatus(roomCode);
      io.to(roomCode).emit('night-actions-status', status);
    }
  });

  // Night action submission
  socket.on('night-action', (data, callback) => {
    const { roomCode, targetId, action } = data;
    const result = gameManager.submitNightAction(roomCode, socket.id, targetId, action);
    
    if (result.success) {
      callback({ success: true });
      
      // If detective investigation, send result immediately (no delay)
      if (result.investigationResult) {
        io.to(socket.id).emit('investigation-result', {
          targetName: result.investigationResult.targetName,
          isMafia: result.investigationResult.isMafia
        });
      }
      
      // Broadcast updated status to all players
      const status = gameManager.getNightActionsStatus(roomCode);
      io.to(roomCode).emit('night-actions-status', status);
      
      // Check if all night actions are complete
      if (result.allActionsComplete) {
        const nightResult = gameManager.processNightActions(roomCode);
        
        io.to(roomCode).emit('night-result', nightResult);
        
        if (nightResult.gameOver) {
          // Send updated game state with GAME_OVER phase (exposes all roles)
          io.to(roomCode).emit('room-update', gameManager.getRoomState(roomCode));
          io.to(roomCode).emit('game-over', nightResult.winner);
        } else {
          // Delay phase change to allow night result screen to display (5 seconds)
          setTimeout(() => {
            io.to(roomCode).emit('phase-change', { phase: 'day' });
            // Send updated game state with dead player marked
            io.to(roomCode).emit('room-update', gameManager.getRoomState(roomCode));
          }, 5000); // 5 second delay matches NightResultScreen countdown
        }
      }
    } else {
      callback({ success: false, error: result.error });
    }
  });

  // Detective acknowledges seeing investigation result
  socket.on('acknowledge-investigation', (roomCode, callback) => {
    const result = gameManager.acknowledgeInvestigation(roomCode, socket.id);
    
    if (result.success) {
      callback({ success: true });
      
      // Broadcast updated status to all players
      const status = gameManager.getNightActionsStatus(roomCode);
      io.to(roomCode).emit('night-actions-status', status);
      
      // Check if all night actions are now complete
      if (result.allActionsComplete) {
        const nightResult = gameManager.processNightActions(roomCode);
        
        io.to(roomCode).emit('night-result', nightResult);
        
        if (nightResult.gameOver) {
          // Send updated game state with GAME_OVER phase (exposes all roles)
          io.to(roomCode).emit('room-update', gameManager.getRoomState(roomCode));
          io.to(roomCode).emit('game-over', nightResult.winner);
        } else {
          // Delay phase change to allow night result screen to display (5 seconds)
          setTimeout(() => {
            io.to(roomCode).emit('phase-change', { phase: 'day' });
            // Send updated game state with dead player marked
            io.to(roomCode).emit('room-update', gameManager.getRoomState(roomCode));
          }, 5000); // 5 second delay matches NightResultScreen countdown
        }
      }
    } else {
      callback({ success: false, error: result.error });
    }
  });

  // Ready for voting (discussion phase)
  socket.on('ready-to-vote', (roomCode, callback) => {
    const result = gameManager.markReadyForVoting(roomCode, socket.id);
    
    if (result.success) {
      callback({ success: true });
      
      // Broadcast ready status to all players
      io.to(roomCode).emit('voting-ready-update', {
        readyCount: result.readyCount,
        totalAlive: result.totalAlive
      });
      
      // If all ready, start voting phase
      if (result.allReady) {
        io.to(roomCode).emit('phase-change', { phase: 'voting' });
      }
    } else {
      callback({ success: false, error: result.error });
    }
  });

  // Vote
  socket.on('cast-vote', (data, callback) => {
    const { roomCode, targetId } = data;
    const result = gameManager.castVote(roomCode, socket.id, targetId);
    
    if (result.success) {
      callback({ success: true });
      const voteState = gameManager.getVoteState(roomCode);
      console.log('[VOTE] Broadcasting vote state:', JSON.stringify(voteState, null, 2));
      io.to(roomCode).emit('vote-update', voteState);
      
      // Check if all votes are in
      if (result.allVotesComplete) {
        const voteResult = gameManager.processVotes(roomCode);
        io.to(roomCode).emit('vote-result', voteResult);
        
        if (voteResult.gameOver) {
          // Show results for 5 seconds before game over
          setTimeout(() => {
            // Send updated game state with GAME_OVER phase (exposes all roles)
            io.to(roomCode).emit('room-update', gameManager.getRoomState(roomCode));
            io.to(roomCode).emit('game-over', voteResult.winner);
          }, 5000);
        } else {
          // Delay phase change to night to let players see vote results
          setTimeout(() => {
            io.to(roomCode).emit('phase-change', { phase: 'night' });
            // Send updated game state with eliminated player marked
            io.to(roomCode).emit('room-update', gameManager.getRoomState(roomCode));
          }, 5000); // 5 second delay to see who was eliminated
        }
      }
    } else {
      callback({ success: false, error: result.error });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const roomCode = gameManager.removePlayer(socket.id);
    if (roomCode) {
      io.to(roomCode).emit('player-left', { playerId: socket.id });
      io.to(roomCode).emit('room-update', gameManager.getRoomState(roomCode));
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎮 Mafia game server running on port ${PORT}`);
});
