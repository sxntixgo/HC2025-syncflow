const { createServer } = require('http');
const { Server } = require('socket.io');
const Client = require('socket.io-client');

describe('Socket.IO Integration Tests', () => {
  let io, serverSocket, clientSocket1, clientSocket2, httpServer;
  const port = 3001; // Use different port for testing

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      }
    });

    // Import and set up the game logic (similar to index.js but for testing)
    const TheMindGame = require('./game');
    const games = new Map();
    const roomBotTimeouts = new Map();

    const clearBotTimeouts = (roomId) => {
      const botTimeouts = roomBotTimeouts.get(roomId);
      if (botTimeouts) {
        botTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        botTimeouts.clear();
      }
    };

    const broadcastGameState = (roomId) => {
      const game = games.get(roomId);
      if (!game) return;
      game.players.forEach(player => {
        if (!player.isBot) {
          io.to(player.id).emit('gameState', game.getStateForPlayer(player.id));
        }
      });
    };

    io.on('connection', (socket) => {
      serverSocket = socket;

      socket.on('createRoom', ({ name, mode }) => {
        const roomId = 'TEST123'; // Fixed room ID for testing
        socket.join(roomId);
        socket.roomId = roomId;

        const game = new TheMindGame();
        games.set(roomId, game);
        game.addPlayer(socket.id, name);

        if (mode === 'singlePlayer') {
          const { player: bot } = game.addBotPlayer();
          game.playerReady(socket.id);
          game.playerReady(bot.id);
          game.startLevel();
        }

        const initialState = game.getStateForPlayer(socket.id);
        socket.emit('roomCreated', { roomId, gameState: initialState });

        if (mode !== 'singlePlayer') {
          broadcastGameState(roomId);
        }
      });

      socket.on('joinRoom', ({ name, roomId }) => {
        const game = games.get(roomId);
        if (!game) {
          return socket.emit('error', 'Room not found.');
        }

        const { error } = game.addPlayer(socket.id, name);
        if (error) {
          return socket.emit('error', error);
        }

        socket.join(roomId);
        socket.roomId = roomId;
        broadcastGameState(roomId);
      });

      socket.on('playerReady', () => {
        const { roomId } = socket;
        if (!roomId) return;
        const game = games.get(roomId);
        if (!game) return;

        game.playerReady(socket.id);
        if (game.areAllPlayersReady() && game.players.length >= 2) {
          game.startLevel();
        }
        broadcastGameState(roomId);
      });

      socket.on('playCard', (card) => {
        const { roomId } = socket;
        if (!roomId) return;
        const game = games.get(roomId);
        if (!game) return;

        const result = game.playCard(socket.id, card);
        if (result && result.error) {
          return socket.emit('error', result.error);
        }

        broadcastGameState(roomId);
      });

      socket.on('useThrowingStar', () => {
        const { roomId } = socket;
        if (!roomId) return;
        const game = games.get(roomId);
        if (!game) return;

        const result = game.useThrowingStar(socket.id);
        if (result && result.error) {
          return socket.emit('error', result.error);
        }

        broadcastGameState(roomId);
      });

      socket.on('disconnect', () => {
        const { roomId } = socket;
        if (!roomId) return;

        const game = games.get(roomId);
        if (!game) return;

        game.removePlayer(socket.id);
        if (game.players.length === 0) {
          games.delete(roomId);
          clearBotTimeouts(roomId);
          roomBotTimeouts.delete(roomId);
        } else {
          broadcastGameState(roomId);
        }
      });
    });

    httpServer.listen(port, () => {
      done();
    });
  });

  afterAll((done) => {
    io.close();
    httpServer.close(done);
  });

  beforeEach((done) => {
    clientSocket1 = new Client(`http://localhost:${port}`);
    clientSocket1.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket1.connected) {
      clientSocket1.disconnect();
    }
    if (clientSocket2 && clientSocket2.connected) {
      clientSocket2.disconnect();
    }
  });

  test('should create room and receive room ID', (done) => {
    clientSocket1.on('roomCreated', ({ roomId, gameState }) => {
      expect(roomId).toBe('TEST123');
      expect(gameState).toBeDefined();
      expect(gameState.players).toBeDefined();
      expect(gameState.players[0].name).toBe('Alice');
      done();
    });

    clientSocket1.emit('createRoom', { name: 'Alice', mode: 'multiplayer' });
  });

  test('should join existing room and receive game state', (done) => {
    let roomCreated = false;

    clientSocket1.on('roomCreated', ({ roomId }) => {
      expect(roomId).toBe('TEST123');
      roomCreated = true;
      
      // Create second client to join the room
      clientSocket2 = new Client(`http://localhost:${port}`);
      clientSocket2.on('connect', () => {
        clientSocket2.emit('joinRoom', { name: 'Bob', roomId: 'TEST123' });
      });
    });

    clientSocket1.on('gameState', (gameState) => {
      if (roomCreated && gameState.players.length === 2) {
        expect(gameState.players).toHaveLength(2);
        expect(gameState.players.some(p => p.name === 'Alice')).toBe(true);
        expect(gameState.players.some(p => p.name === 'Bob')).toBe(true);
        done();
      }
    });

    clientSocket1.emit('createRoom', { name: 'Alice', mode: 'multiplayer' });
  });

  test('should handle player ready and start game when all ready', (done) => {
    let playersJoined = false;

    clientSocket1.on('roomCreated', () => {
      clientSocket2 = new Client(`http://localhost:${port}`);
      clientSocket2.on('connect', () => {
        clientSocket2.emit('joinRoom', { name: 'Bob', roomId: 'TEST123' });
      });
    });

    clientSocket1.on('gameState', (gameState) => {
      if (!playersJoined && gameState.players.length === 2) {
        playersJoined = true;
        // Both players mark themselves as ready
        clientSocket1.emit('playerReady');
        setTimeout(() => {
          clientSocket2.emit('playerReady');
        }, 50);
      } else if (playersJoined && gameState.gameState === 'playing') {
        expect(gameState.level).toBe(1);
        expect(gameState.gameState).toBe('playing');
        expect(gameState.players.every(p => p.isReady)).toBe(false); // Reset after game start
        done();
      }
    });

    clientSocket1.emit('createRoom', { name: 'Alice', mode: 'multiplayer' });
  });

  test('should handle card play and game progression', (done) => {
    let gameStarted = false;

    clientSocket1.on('roomCreated', () => {
      clientSocket2 = new Client(`http://localhost:${port}`);
      clientSocket2.on('connect', () => {
        clientSocket2.emit('joinRoom', { name: 'Bob', roomId: 'TEST123' });
      });
    });

    clientSocket1.on('gameState', (gameState) => {
      if (gameState.players.length === 2 && !gameStarted) {
        clientSocket1.emit('playerReady');
        setTimeout(() => {
          clientSocket2.emit('playerReady');
        }, 50);
      } else if (gameState.gameState === 'playing' && !gameStarted) {
        gameStarted = true;
        // Play the lowest card from player 1's hand
        if (gameState.myHand && gameState.myHand.length > 0) {
          const cardToPlay = gameState.myHand[0];
          clientSocket1.emit('playCard', cardToPlay);
        }
      } else if (gameStarted && gameState.playedCards.length > 0) {
        expect(gameState.playedCards).toHaveLength(1);
        expect(gameState.playedCards[0].player).toBe('Alice');
        done();
      }
    });

    clientSocket1.emit('createRoom', { name: 'Alice', mode: 'multiplayer' });
  });

  test('should handle throwing star usage', (done) => {
    let gameStarted = false;

    clientSocket1.on('roomCreated', () => {
      clientSocket2 = new Client(`http://localhost:${port}`);
      clientSocket2.on('connect', () => {
        clientSocket2.emit('joinRoom', { name: 'Bob', roomId: 'TEST123' });
      });
    });

    clientSocket1.on('gameState', (gameState) => {
      if (gameState.players.length === 2 && !gameStarted) {
        clientSocket1.emit('playerReady');
        setTimeout(() => {
          clientSocket2.emit('playerReady');
        }, 50);
      } else if (gameState.gameState === 'playing' && !gameStarted) {
        gameStarted = true;
        expect(gameState.throwingStars).toBeGreaterThan(0);
        clientSocket1.emit('useThrowingStar');
      } else if (gameStarted && gameState.playedCards.length > 0) {
        // After using throwing star, should have played cards from both players
        expect(gameState.playedCards.length).toBeGreaterThanOrEqual(2);
        expect(gameState.throwingStars).toBe(0); // Should have used the throwing star
        done();
      }
    });

    clientSocket1.emit('createRoom', { name: 'Alice', mode: 'multiplayer' });
  });

  test('should handle errors for invalid moves', (done) => {
    clientSocket1.on('roomCreated', () => {
      // Try to play a card when game hasn't started
      clientSocket1.emit('playCard', 50);
    });

    clientSocket1.on('error', (errorMessage) => {
      expect(errorMessage).toBe('Invalid move.');
      done();
    });

    clientSocket1.emit('createRoom', { name: 'Alice', mode: 'multiplayer' });
  });

  test('should handle single player mode with bot', (done) => {
    clientSocket1.on('roomCreated', ({ gameState }) => {
      expect(gameState.players).toHaveLength(2);
      expect(gameState.players.some(p => p.isBot)).toBe(true);
      expect(gameState.gameState).toBe('playing'); // Should auto-start in single player
      expect(gameState.level).toBe(1);
      done();
    });

    clientSocket1.emit('createRoom', { name: 'Alice', mode: 'singlePlayer' });
  });

  test('should handle room not found error', (done) => {
    clientSocket1.on('error', (errorMessage) => {
      expect(errorMessage).toBe('Room not found.');
      done();
    });

    clientSocket1.emit('joinRoom', { name: 'Bob', roomId: 'NONEXISTENT' });
  });

  test('should handle player disconnection', (done) => {
    let secondPlayerJoined = false;

    clientSocket1.on('roomCreated', () => {
      clientSocket2 = new Client(`http://localhost:${port}`);
      clientSocket2.on('connect', () => {
        clientSocket2.emit('joinRoom', { name: 'Bob', roomId: 'TEST123' });
      });
    });

    clientSocket1.on('gameState', (gameState) => {
      if (gameState.players.length === 2 && !secondPlayerJoined) {
        secondPlayerJoined = true;
        // Disconnect the second player
        clientSocket2.disconnect();
        
        // Wait a bit then check if game state updated
        setTimeout(() => {
          expect(gameState.players.length).toBe(2); // Before disconnect
        }, 100);
      } else if (secondPlayerJoined && gameState.players.length === 1) {
        expect(gameState.players[0].name).toBe('Alice');
        done();
      }
    });

    clientSocket1.emit('createRoom', { name: 'Alice', mode: 'multiplayer' });
  });
});