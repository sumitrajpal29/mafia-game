const Game = require('./models/Game');

class GameManager {
  constructor() {
    this.games = new Map(); // roomCode -> Game instance
    this.playerRooms = new Map(); // socketId -> roomCode
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom() {
    let roomCode = this.generateRoomCode();
    while (this.games.has(roomCode)) {
      roomCode = this.generateRoomCode();
    }
    
    this.games.set(roomCode, new Game(roomCode));
    return roomCode;
  }

  roomExists(roomCode) {
    return this.games.has(roomCode);
  }

  addPlayerToRoom(roomCode, socketId, playerName) {
    const game = this.games.get(roomCode);
    if (!game) return null;
    
    const player = game.addPlayer(socketId, playerName);
    this.playerRooms.set(socketId, roomCode);
    return player;
  }

  startGame(roomCode) {
    const game = this.games.get(roomCode);
    if (!game) return { success: false, error: 'Room not found' };
    
    return game.startGame();
  }

  getRoomState(roomCode) {
    const game = this.games.get(roomCode);
    return game ? game.getPublicState() : null;
  }

  submitNightAction(roomCode, playerId, targetId, action) {
    const game = this.games.get(roomCode);
    if (!game) return { success: false, error: 'Room not found' };
    
    return game.submitNightAction(playerId, targetId, action);
  }

  processNightActions(roomCode) {
    const game = this.games.get(roomCode);
    if (!game) return null;
    
    return game.processNightActions();
  }

  markReadyForVoting(roomCode, playerId) {
    const game = this.games.get(roomCode);
    if (!game) return { success: false, error: 'Room not found' };
    
    return game.markReadyForVoting(playerId);
  }

  castVote(roomCode, playerId, targetId) {
    const game = this.games.get(roomCode);
    if (!game) return { success: false, error: 'Room not found' };
    
    return game.castVote(playerId, targetId);
  }

  getVoteState(roomCode) {
    const game = this.games.get(roomCode);
    return game ? game.getVoteState() : null;
  }

  processVotes(roomCode) {
    const game = this.games.get(roomCode);
    if (!game) return null;
    
    return game.processVotes();
  }

  removePlayer(socketId) {
    const roomCode = this.playerRooms.get(socketId);
    if (!roomCode) return null;
    
    const game = this.games.get(roomCode);
    if (game) {
      game.removePlayer(socketId);
      
      // If no players left, remove the game
      if (game.getPlayerCount() === 0) {
        this.games.delete(roomCode);
      }
    }
    
    this.playerRooms.delete(socketId);
    return roomCode;
  }

  getAllPlayers(roomCode) {
    const game = this.games.get(roomCode);
    return game ? game.getAllPlayers() : [];
  }

  updateMafiaVote(roomCode, playerId, targetId) {
    const game = this.games.get(roomCode);
    if (!game) return { success: false, error: 'Room not found' };
    
    return game.updateMafiaVote(playerId, targetId);
  }

  getMafiaVotes(roomCode) {
    const game = this.games.get(roomCode);
    return game ? game.getMafiaVotesObject() : {};
  }

  getNightActionsStatus(roomCode) {
    const game = this.games.get(roomCode);
    return game ? game.getNightActionsStatus() : { mafiaReady: false, detectiveReady: false, doctorReady: false };
  }

  acknowledgeInvestigation(roomCode, playerId) {
    const game = this.games.get(roomCode);
    if (!game) return { success: false, error: 'Room not found' };
    
    return game.acknowledgeInvestigation(playerId);
  }
}

module.exports = GameManager;
