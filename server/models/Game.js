const ROLES = {
  MAFIA: 'mafia',
  DETECTIVE: 'detective',
  DOCTOR: 'doctor',
  VILLAGER: 'villager'
};

const PHASES = {
  LOBBY: 'lobby',
  NIGHT: 'night',
  DAY: 'day',
  VOTING: 'voting',
  GAME_OVER: 'game_over'
};

class Game {
  constructor(roomCode) {
    this.roomCode = roomCode;
    this.players = new Map(); // socketId -> player object
    this.phase = PHASES.LOBBY;
    this.dayNumber = 0;
    this.nightActions = new Map(); // playerId -> {targetId, action}
    this.mafiaVotes = new Map(); // mafiaId -> targetId (for consensus)
    this.readyForVoting = new Set(); // playerIds who are ready to vote
    this.votes = new Map(); // voterId -> targetId (for day voting)
    this.eliminatedLastNight = null;
    this.eliminatedByVote = null;
    this.investigationAcknowledged = false; // Track if detective saw their result
  }

  addPlayer(socketId, playerName) {
    const player = {
      id: socketId,
      name: playerName,
      role: null,
      isAlive: true,
      isHost: this.players.size === 0 // First player is host
    };
    
    this.players.set(socketId, player);
    return player;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  getPlayerCount() {
    return this.players.size;
  }

  startGame() {
    if (this.players.size < 6) {
      return { success: false, error: 'Need at least 6 players to start' };
    }

    if (this.phase !== PHASES.LOBBY) {
      return { success: false, error: 'Game already started' };
    }

    this.assignRoles();
    this.phase = PHASES.NIGHT;
    this.dayNumber = 1;
    this.investigationAcknowledged = false;
    
    return { success: true };
  }

  assignRoles() {
    const playerCount = this.players.size;
    const roles = [];
    
    // Balanced role distribution (25-33% mafia)
    let mafiaCount;
    if (playerCount <= 8) {
      mafiaCount = 2;
    } else if (playerCount <= 12) {
      mafiaCount = 3;
    } else {
      mafiaCount = 4;
    }
    
    // Add mafia
    for (let i = 0; i < mafiaCount; i++) {
      roles.push(ROLES.MAFIA);
    }
    
    // Add special roles (always 1 detective and 1 doctor for 6+ players)
    roles.push(ROLES.DETECTIVE);
    roles.push(ROLES.DOCTOR);
    
    // Fill rest with villagers
    while (roles.length < playerCount) {
      roles.push(ROLES.VILLAGER);
    }
    
    // Shuffle roles using Fisher-Yates
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    
    // Assign to players
    let i = 0;
    for (const player of this.players.values()) {
      player.role = roles[i++];
      player.isAlive = true;
    }
  }

  updateMafiaVote(playerId, targetId) {
    const player = this.players.get(playerId);
    
    if (!player || !player.isAlive || player.role !== ROLES.MAFIA) {
      return { success: false, error: 'Invalid mafia member' };
    }

    if (this.phase !== PHASES.NIGHT) {
      return { success: false, error: 'Not night phase' };
    }

    this.mafiaVotes.set(playerId, targetId);
    return { success: true, votes: this.getMafiaVotesObject() };
  }

  getMafiaVotesObject() {
    const votesObj = {};
    for (const [playerId, targetId] of this.mafiaVotes.entries()) {
      votesObj[playerId] = targetId;
    }
    return votesObj;
  }

  checkMafiaConsensus() {
    const aliveMafia = Array.from(this.players.values())
      .filter(p => p.isAlive && p.role === ROLES.MAFIA);
    
    if (aliveMafia.length === 0) return { consensus: true, target: null };
    
    // Get votes only from alive mafia (filter out any dead mafia votes)
    const aliveMafiaIds = new Set(aliveMafia.map(m => m.id));
    const aliveVotes = Array.from(this.mafiaVotes.entries())
      .filter(([voterId]) => aliveMafiaIds.has(voterId))
      .map(([, targetId]) => targetId);
    
    // Check if all alive mafia have voted
    if (aliveVotes.length !== aliveMafia.length) {
      return { consensus: false, target: null };
    }
    
    // Check if all votes are for the same target
    const firstVote = aliveVotes[0];
    const allSame = aliveVotes.every(vote => vote === firstVote);
    
    return { consensus: allSame, target: allSame ? firstVote : null };
  }

  submitNightAction(playerId, targetId, action) {
    const player = this.players.get(playerId);
    
    if (!player || !player.isAlive) {
      return { success: false, error: 'Player not found or dead' };
    }

    if (this.phase !== PHASES.NIGHT) {
      return { success: false, error: 'Not night phase' };
    }

    // Validate action based on role
    if ((action === 'kill' && player.role !== ROLES.MAFIA) ||
        (action === 'investigate' && player.role !== ROLES.DETECTIVE) ||
        (action === 'heal' && player.role !== ROLES.DOCTOR) ||
        (action === 'wait' && player.role !== ROLES.VILLAGER)) {
      return { success: false, error: 'Invalid action for role' };
    }

    // For mafia, record their vote and check if all mafia have voted
    if (action === 'kill') {
      this.mafiaVotes.set(playerId, targetId);
      
      // Check if we have mafia consensus
      const consensus = this.checkMafiaConsensus();
      if (consensus.consensus && consensus.target) {
        // All mafia agree, record the kill action with consensus target
        this.nightActions.set(playerId, { targetId: consensus.target, action });
      } else {
        // Mafia voted but no consensus yet, just record the vote
        return { success: true, allActionsComplete: false };
      }
    } else if (action === 'investigate') {
      // For detective, process investigation immediately
      this.nightActions.set(playerId, { targetId, action });
      const target = this.players.get(targetId);
      if (target) {
        const investigationResult = {
          targetId: targetId,
          targetName: target.name,
          targetRole: target.role,
          isMafia: target.role === ROLES.MAFIA
        };
        // Check if all required night actions are submitted
        const allActionsComplete = this.areNightActionsComplete();
        return { success: true, allActionsComplete, investigationResult };
      }
    } else {
      // Doctor and Villager actions
      this.nightActions.set(playerId, { targetId, action });
    }
    
    // Check if all required night actions are submitted
    const allActionsComplete = this.areNightActionsComplete();
    
    return { success: true, allActionsComplete };
  }

  acknowledgeInvestigation(playerId) {
    const player = this.players.get(playerId);
    
    if (!player || !player.isAlive) {
      return { success: false, error: 'Player not found or dead' };
    }
    
    if (player.role !== ROLES.DETECTIVE) {
      return { success: false, error: 'Only detective can acknowledge investigation' };
    }
    
    if (this.phase !== PHASES.NIGHT) {
      return { success: false, error: 'Not in night phase' };
    }
    
    this.investigationAcknowledged = true;
    console.log('[DETECTIVE] Investigation result acknowledged');
    
    // Check if all actions are now complete
    const allActionsComplete = this.areNightActionsComplete();
    
    return { success: true, allActionsComplete };
  }

  areNightActionsComplete() {
    const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive);
    
    // Check mafia consensus and submission
    const aliveMafia = alivePlayers.filter(p => p.role === ROLES.MAFIA);
    const consensus = this.checkMafiaConsensus();
    const mafiaActed = aliveMafia.length === 0 || 
                       (consensus.consensus && aliveMafia.some(m => this.nightActions.has(m.id)));
    
    // Check detective - must have submitted AND acknowledged result (unless no detective)
    const detective = alivePlayers.find(p => p.role === ROLES.DETECTIVE);
    const detectiveActed = !detective || (this.nightActions.has(detective.id) && this.investigationAcknowledged);
    
    // Check doctor
    const doctor = alivePlayers.find(p => p.role === ROLES.DOCTOR);
    const doctorActed = !doctor || this.nightActions.has(doctor.id);
    
    // Check villagers - all must submit
    const villagers = alivePlayers.filter(p => p.role === ROLES.VILLAGER);
    const villagersActed = villagers.every(v => this.nightActions.has(v.id));
    
    console.log('[NIGHT CHECK] Mafia:', mafiaActed, '| Detective:', detectiveActed, '(ack:', this.investigationAcknowledged, ') | Doctor:', doctorActed, '| Villagers:', villagersActed);
    
    return mafiaActed && detectiveActed && doctorActed && villagersActed;
  }

  getNightActionsStatus() {
    const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive);
    
    const aliveMafia = alivePlayers.filter(p => p.role === ROLES.MAFIA);
    const consensus = this.checkMafiaConsensus();
    const mafiaReady = aliveMafia.length === 0 || 
                       (consensus.consensus && aliveMafia.some(m => this.nightActions.has(m.id)));
    
    const detective = alivePlayers.find(p => p.role === ROLES.DETECTIVE);
    const detectiveReady = !detective || (this.nightActions.has(detective.id) && this.investigationAcknowledged);
    
    const doctor = alivePlayers.find(p => p.role === ROLES.DOCTOR);
    const doctorReady = !doctor || this.nightActions.has(doctor.id);
    
    const villagers = alivePlayers.filter(p => p.role === ROLES.VILLAGER);
    const villagersReady = villagers.every(v => this.nightActions.has(v.id));
    
    return { mafiaReady, detectiveReady, doctorReady, villagersReady };
  }

  processNightActions() {
    console.log(`[NIGHT] Processing night actions for Day ${this.dayNumber}`);
    let killTarget = null;
    let healTarget = null;
    const investigations = [];
    
    // Process actions
    for (const [actorId, { targetId, action }] of this.nightActions.entries()) {
      if (action === 'kill') {
        killTarget = targetId;
        console.log(`[NIGHT] Mafia targeting: ${this.players.get(targetId)?.name}`);
      } else if (action === 'heal') {
        healTarget = targetId;
        console.log(`[NIGHT] Doctor protecting: ${this.players.get(targetId)?.name}`);
      } else if (action === 'investigate') {
        const target = this.players.get(targetId);
        if (target) {
          investigations.push({
            investigatorId: actorId,
            targetId: targetId,
            targetName: target.name,
            targetRole: target.role,
            isMafia: target.role === ROLES.MAFIA
          });
        }
      }
    }
    
    // Apply kill (unless healed)
    this.eliminatedLastNight = null;
    if (killTarget && killTarget !== healTarget) {
      const victim = this.players.get(killTarget);
      if (victim) {
        victim.isAlive = false;
        this.eliminatedLastNight = victim;
        console.log(`[NIGHT] ${victim.name} was killed (${victim.role})`);
      }
    } else if (killTarget && killTarget === healTarget) {
      console.log(`[NIGHT] Kill was blocked by doctor!`);
    } else {
      console.log(`[NIGHT] No one died`);
    }
    
    this.nightActions.clear();
    this.mafiaVotes.clear();
    this.readyForVoting.clear();
    this.phase = PHASES.DAY;
    console.log(`[NIGHT] Transitioning to DAY phase`);
    
    // Check win condition
    const winner = this.checkWinCondition();
    
    return {
      eliminated: this.eliminatedLastNight ? {
        id: this.eliminatedLastNight.id,
        name: this.eliminatedLastNight.name,
        role: this.eliminatedLastNight.role
      } : null,
      investigations,
      gameOver: winner !== null,
      winner
    };
  }

  markReadyForVoting(playerId) {
    const player = this.players.get(playerId);
    
    if (!player || !player.isAlive) {
      return { success: false, error: 'Player not found or dead' };
    }

    if (this.phase !== PHASES.DAY) {
      return { success: false, error: 'Not in day phase' };
    }

    this.readyForVoting.add(playerId);
    
    // Check if all alive players are ready
    const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive);
    const allReady = this.readyForVoting.size === alivePlayers.length;
    
    if (allReady) {
      this.phase = PHASES.VOTING;
    }
    
    return { 
      success: true, 
      allReady,
      readyCount: this.readyForVoting.size,
      totalAlive: alivePlayers.length
    };
  }

  castVote(voterId, targetId) {
    const voter = this.players.get(voterId);
    
    if (!voter || !voter.isAlive) {
      return { success: false, error: 'Voter not found or dead' };
    }

    if (this.phase !== PHASES.VOTING) {
      return { success: false, error: 'Not voting phase' };
    }

    this.votes.set(voterId, targetId);
    
    // Check if all votes are in
    const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive);
    const allVotesComplete = this.votes.size === alivePlayers.length;
    
    return { success: true, allVotesComplete };
  }

  getVoteState() {
    const voteCount = new Map();
    const votersByTarget = new Map(); // targetId -> [voter names]
    
    for (const [voterId, targetId] of this.votes.entries()) {
      // Count votes
      voteCount.set(targetId, (voteCount.get(targetId) || 0) + 1);
      
      // Track who voted for whom
      if (!votersByTarget.has(targetId)) {
        votersByTarget.set(targetId, []);
      }
      const voter = this.players.get(voterId);
      if (voter) {
        votersByTarget.get(targetId).push(voter.name);
      }
    }
    
    return {
      votes: Array.from(this.votes.entries()),
      voteCount: Array.from(voteCount.entries()),
      votersByTarget: Array.from(votersByTarget.entries()).map(([targetId, voters]) => ({
        targetId,
        voters,
        count: voters.length
      }))
    };
  }

  processVotes() {
    const voteCount = new Map();
    
    for (const targetId of this.votes.values()) {
      voteCount.set(targetId, (voteCount.get(targetId) || 0) + 1);
    }
    
    // Find player with most votes
    let maxVotes = 0;
    let eliminatedId = null;
    let tie = false;
    
    for (const [playerId, count] of voteCount.entries()) {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedId = playerId;
        tie = false;
      } else if (count === maxVotes && maxVotes > 0) {
        tie = true;
      }
    }
    
    // Eliminate player if no tie
    this.eliminatedByVote = null;
    if (eliminatedId && !tie) {
      const player = this.players.get(eliminatedId);
      if (player) {
        player.isAlive = false;
        this.eliminatedByVote = player;
      }
    }
    
    this.votes.clear();
    this.readyForVoting.clear();
    this.mafiaVotes.clear(); // Clear mafia votes from previous night
    
    // Check win condition before changing phase
    const winner = this.checkWinCondition();
    
    // Only go to next night if game is not over
    if (!winner) {
      this.phase = PHASES.NIGHT;
      this.dayNumber++;
      this.investigationAcknowledged = false;
    }
    
    return {
      eliminated: this.eliminatedByVote ? {
        id: this.eliminatedByVote.id,
        name: this.eliminatedByVote.name,
        role: this.eliminatedByVote.role
      } : null,
      tie,
      gameOver: winner !== null,
      winner
    };
  }

  checkWinCondition() {
    const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive);
    const aliveMafia = alivePlayers.filter(p => p.role === ROLES.MAFIA).length;
    const aliveVillagers = alivePlayers.length - aliveMafia;
    
    console.log(`[WIN CHECK] Day ${this.dayNumber}, Phase ${this.phase}: ${aliveMafia} mafia vs ${aliveVillagers} villagers (${alivePlayers.length} total alive)`);
    
    if (aliveMafia === 0) {
      console.log('[WIN] Villagers win - all mafia eliminated');
      this.phase = PHASES.GAME_OVER;
      return { team: 'villagers', message: 'All mafia have been eliminated!' };
    }
    
    if (aliveMafia >= aliveVillagers) {
      console.log('[WIN] Mafia wins - equal or outnumber villagers');
      this.phase = PHASES.GAME_OVER;
      return { team: 'mafia', message: 'Mafia outnumbers the villagers!' };
    }
    
    console.log('[WIN CHECK] No winner yet, game continues');
    return null;
  }

  getPublicState() {
    const players = Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      isAlive: p.isAlive,
      isHost: p.isHost,
      // Only show role if dead or game over
      role: (!p.isAlive || this.phase === PHASES.GAME_OVER) ? p.role : null
    }));
    
    return {
      roomCode: this.roomCode,
      phase: this.phase,
      dayNumber: this.dayNumber,
      players,
      playerCount: this.players.size
    };
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }
}

module.exports = Game;
