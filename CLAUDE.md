# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
- `npm run install` - Install dependencies for both client and server
- `npm start` - Start both server and client concurrently
- `npm run start:server` - Start only the Node.js server (runs on port 4001)
- `npm run start:client` - Start only the React client (runs on port 3000)

### Server Commands (in ./server/)
- `npm start` - Start server with nodemon for auto-restart
- `npm test` - Run Jest tests

### Client Commands (in ./client/)
- `npm start` - Start React development server
- `npm run build` - Build production React app
- `npm test` - Run React component tests

### Docker
- `docker-compose up` - Build and run containerized version
- Client accessible at localhost:3000
- Server runs internally in Docker network

## Architecture

### Project Structure
This is a full-stack real-time multiplayer card game "SyncFlow" with the following structure:

- **Root**: Orchestration level with concurrently setup
- **server/**: Node.js backend with Socket.IO for real-time communication
- **client/**: React frontend with Socket.IO client

### Core Components

#### Server (server/)
- `index.js` - Main server file with Socket.IO event handlers and bot AI logic
- `game.js` - Game logic class (SyncFlowGame) handling rules, state, and player management
- `game.test.js` - Jest tests for game logic

#### Client (client/src/)
- `App.js` - Main React component managing socket connections and game state routing
- `components/HomeScreen.js` - Initial screen for creating/joining rooms
- `components/Lobby.js` - Waiting room for players before game start
- `components/GameBoard.js` - Main game interface during play
- `components/PlayerHand.js` - Player's hand display and card interaction
- `components/EndScreen.js` - Victory screen
- `components/ToastNotification.js` - Toast notifications system

### Game Logic
- **SyncFlow** is a cooperative card game where players must play cards in ascending order without communication
- Supports 2-4 players with single-player mode including bot AI
- Bot players use intelligent timing based on card values for realistic gameplay
- Game progression through levels (2 players: 12 levels, 3 players: 10 levels, 4 players: 8 levels)
- Lives and throwing stars system for mistake recovery

### Real-time Architecture
- Socket.IO handles all real-time communication between client and server
- Room-based multiplayer with unique room IDs
- Server manages game state and broadcasts updates to all players in room
- Bot AI integrated server-side with realistic delay calculations
- Automatic game cleanup on player disconnect

### Theme Support
Client includes light/dark mode toggle with localStorage persistence.

### Docker Setup
Containerized with nginx serving the client and internal networking between services.