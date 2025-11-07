# 🎭 Mafia Party Game

A fully automated Mafia party game that eliminates the need for a "God" role. Built with Node.js, Express, Socket.IO, and React.

## Features

- ✨ **No God Role Needed** - Fully automated game management
- 🎮 **Real-time Multiplayer** - Powered by Socket.IO
- 🎲 **Multiple Roles** - Mafia, Detective, Doctor, and Villagers
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔒 **Secure** - Roles are hidden from other players
- 🗳️ **Live Voting** - See vote counts and who voted for whom in real-time
- 👁️ **Spectator Mode** - Eliminated players can watch the game continue
- ⚠️ **Refresh Protection** - Warning before accidentally leaving an active game
- 🎯 **Mafia Coordination** - Mafia members vote together with live consensus
- 🔍 **Detective Investigation** - Must acknowledge results before night ends
- 💊 **Doctor Protection** - Can save players from mafia attacks
- 🎨 **Beautiful UI** - Modern gradients, animations, and glass-morphism effects

## Game Roles

- **Mafia** - Eliminate villagers at night
- **Detective** - Investigate one player each night
- **Doctor** - Protect one player from being killed each night
- **Villager** - Vote during the day to eliminate suspected mafia

## Tech Stack

### Backend
- Node.js
- Express
- Socket.IO
- Real-time game state management

### Frontend
- React
- Socket.IO Client
- Modern CSS with gradients and animations

## Project Structure

```
mafia-game/
├── server/                 # Backend server
│   ├── server.js          # Main server file with Socket.IO
│   ├── gameManager.js     # Game room management
│   ├── models/
│   │   └── Game.js        # Game logic and state
│   └── package.json
│
└── client/                # React frontend
    ├── public/
    ├── src/
    │   ├── screens/       # Game screens
    │   │   ├── HomeScreen.js
    │   │   ├── LobbyScreen.js
    │   │   ├── GameScreen.js
    │   │   └── GameOverScreen.js
    │   ├── services/
    │   │   └── socket.js  # Socket.IO client
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Install Client Dependencies**
   ```bash
   cd client
   npm install
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd server
   npm start
   ```
   Server will run on `http://localhost:3001`

2. **Start the Frontend Client** (in a new terminal)
   ```bash
   cd client
   npm start
   ```
   Client will run on `http://localhost:3000`

3. **Open Your Browser**
   Navigate to `http://localhost:3000`

## How to Play

### Setup
1. **Create or Join a Game**
   - One player creates a room and receives a 6-character room code
   - Share the room code with friends
   - Players join using the room code
   - Need **minimum 6 players** to start

2. **Start the Game**
   - Host clicks "Start Game"
   - Roles are randomly assigned:
     - **2 Mafia** members
     - **1 Detective**
     - **1 Doctor**
     - **Rest are Villagers**

### Game Flow

**🌙 Night Phase**
- **Mafia**: Vote together to eliminate a player (must reach consensus)
- **Detective**: Investigate one player to learn if they're Mafia
- **Doctor**: Protect one player from being killed
- **Villagers**: Submit a "wait" action
- All actions must be completed before night ends

**☀️ Day Phase**
- Eliminated player (if any) is revealed
- All alive players can see the results
- Click "Proceed to Voting" when ready

**🗳️ Voting Phase**
- Everyone votes to eliminate a suspected Mafia
- See **live vote counts** and **who voted for whom**
- Player with most votes is eliminated
- Ties result in no elimination

**Game repeats Night → Day → Voting until...**

### Win Conditions
- **👥 Villagers win** if all Mafia are eliminated
- **😈 Mafia wins** if they equal or outnumber villagers

### Special Features
- **Spectator Mode**: Dead players can watch the game continue
- **Live Updates**: All actions update in real-time
- **Refresh Warning**: Get warned before accidentally leaving
- **Vote Transparency**: Everyone sees who voted for whom

## Development

### Server Development Mode
```bash
cd server
npm run dev  # Uses nodemon for auto-restart
```

### Client Development Mode
```bash
cd client
npm start  # Hot reloading enabled
```

## Implemented Features ✅

- ✅ Real-time multiplayer with Socket.IO
- ✅ All 4 roles (Mafia, Detective, Doctor, Villager)
- ✅ Mafia consensus voting system
- ✅ Detective investigation with acknowledgment
- ✅ Doctor protection mechanics
- ✅ Day discussion and voting phases
- ✅ Live vote counts and voter names
- ✅ Spectator mode for eliminated players
- ✅ Win condition detection
- ✅ Role reveal at game end
- ✅ Refresh/close page warning
- ✅ Responsive UI with modern design
- ✅ Real-time game state synchronization

## Future Roadmap 🚀

- [ ] In-game chat functionality
- [ ] Timer/countdown for phases
- [ ] Sound effects and animations
- [ ] Game history and statistics
- [ ] Custom role configurations
- [ ] Additional roles (Jester, Serial Killer, etc.)
- [ ] Private messaging for Mafia team
- [ ] Replay/review completed games
- [ ] Player profiles and rankings
- [ ] Mobile app version

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT License - feel free to use this project for your own party games!

## Acknowledgments

Built with ❤️ for party game enthusiasts who hate being the "God" role.
