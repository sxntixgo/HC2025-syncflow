# The HACKERS CHALLENGE - SyncFlow

A real-time multiplayer cooperative card game CTF challenge demonstrating server-side vulnerabilities through game mechanics analysis. Players must achieve perfect synchronization with an AI bot to unlock hidden flags.

## 🎯 Challenge Overview

| Challenge Aspect | Details |
|-----------------|---------|
| Vulnerability Type | Server-Side Logic Analysis & Predictable Behavior |
| Difficulty | Medium |
| Port | 8000 (Docker) / 3000 (Local Dev) |
| Flags Available | 4 flags (levels 4, 6, 8, 10) |
| Skills Required | Reverse engineering, timing analysis, pattern recognition |

## 🎮 About The Game

SyncFlow is a cooperative card game where players must play cards numbered 1-100 in ascending order without any communication. The challenge involves playing against **SyncBot**, an AI opponent with predictable behavior patterns that can be exploited to capture CTF flags.

### Game Rules
- Players receive cards equal to the current level number (Level 1 = 1 card, Level 2 = 2 cards, etc.)
- Cards must be played in ascending order across all players
- No communication allowed - players must rely on timing and intuition
- Making a mistake costs a life; losing all lives ends the game
- Throwing stars can be used to discard everyone's lowest card simultaneously
- Win by completing all levels for your player count:
  - 2 players: 12 levels
  - 3 players: 10 levels
  - 4 players: 8 levels

## 🏁 CTF Flags

Flags are awarded when completing specific levels in **single-player mode** against SyncBot.

**All flags are stored in `server/settings.js:13-18`**

## ⚙️ Server Configuration

The server behavior is controlled by settings in `server/settings.js`. Understanding these configurations is key to solving the challenge.

### Game Modes (Server-Side)

**Dealing Modes** (`server/settings.js:21-25`):
- **`'normal'`** (CURRENT): Random card distribution from shuffled deck
- **`'predictable'`**: Deterministic round-robin card dealing from sorted pool
  - Creates exploitable patterns in card distribution
  - Players could potentially deduce opponent's cards

**Deck Types** (`server/settings.js:28-32`):
- **`'numbers'`** (CURRENT): Standard 1-100 numbered cards
- **`'hex'`**: Hexadecimal values (01-30, total 48 cards)
  - Players must think in hexadecimal
  - Bot timing calculations still use decimal internally

## 🚀 Quick Start

### Docker Deployment (Recommended)
```bash
docker-compose -f docker-compose-dev.yml up -d
```

**Access the game at: http://localhost:8000**

To stop:
```bash
docker-compose -f docker-compose-dev.yml down
```

### Local Development (Hot Reload)
```bash
# Install dependencies
npm run install

# Start both client and server
npm start
```

**Access the game at: http://localhost:3000**

To start services individually:
```bash
# Server only
npm run start:server

# Client only
npm run start:client
```

## 🔌 Port Configuration

| Deployment | Client Access | Server Port | Notes |
|------------|---------------|-------------|-------|
| **Docker** | localhost:8000 | 4001 (internal only) | Client served by nginx, connects to server via Docker network |
| **Local Dev** | localhost:3000 | localhost:4001 | React dev server with hot reload, direct server access |


## 📁 Project Structure

```
HC2025-syncflow/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── FlagCard.js     # CTF flag display component
│   │   │   ├── GameBoard.js    # Main game interface
│   │   │   ├── HomeScreen.js   # Room creation/joining
│   │   │   ├── Lobby.js        # Pre-game waiting room
│   │   │   └── PlayerHand.js   # Card hand display
│   │   └── App.js              # Socket.IO integration
│   └── Dockerfile
├── server/                      # Node.js backend
│   ├── index.js                # Socket.IO server & bot AI
│   ├── game.js                 # Core game logic
│   ├── settings.js             # CTF flags & configuration
│   ├── game.test.js           # Game logic tests
│   └── Dockerfile
├── conf/                       # nginx configuration
├── docker-compose.yml          # Production deployment
├── docker-compose-dev.yml      # Development deployment
├── CLAUDE.md                   # Development guidelines
├── SOLUTION.md                 # Challenge walkthrough
└── README.md                   # This file
```

## 🧪 Testing & Development

### Running Tests
```bash
# Server tests
cd server
npm test

# Client tests
cd client
npm test
```

### Docker Management
```bash
# Start services
docker-compose -f docker-compose-dev.yml up -d

# Stop services
docker-compose -f docker-compose-dev.yml down

# View logs
docker-compose -f docker-compose-dev.yml logs -f

# Rebuild after changes
docker-compose -f docker-compose-dev.yml up --build
```
