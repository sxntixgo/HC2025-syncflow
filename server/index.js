const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const SyncFlowGame = require('./game');
const settings = require('./settings');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for Docker setup
        methods: ["GET", "POST"],
    }
});

const PORT = settings.PORT;

const games = new Map(); // <roomId, SyncFlowGame>
const roomBotTimeouts = new Map(); // <roomId, Map<botId, timeoutId>>

// CTF Configuration
const getCTFFlag = (level) => {
  return settings.CTF_ENABLED ? settings.CTF_FLAGS[level.toString()] : null;
};

// Bot configuration is now in settings.js

const clearBotTimeouts = (roomId) => {
    const botTimeouts = roomBotTimeouts.get(roomId);
    if (botTimeouts) {
        botTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        botTimeouts.clear();
    }
};

const scheduleBotActions = (roomId) => {
    clearBotTimeouts(roomId);
    const game = games.get(roomId);
    if (!game || (game.gameState !== 'playing' && game.gameState !== 'flag_display')) {
        return;
    }
    
    // Don't schedule bot actions if a flag is being displayed
    if (game.gameState === 'flag_display') {
        return;
    }

    const bots = game.players.filter(p => p.isBot && p.hand.length > 0);
    const botTimeouts = roomBotTimeouts.get(roomId) || new Map();

    bots.forEach(bot => {
        // The bot should only consider playing its lowest card.
        const cardToPlay = bot.hand[0]; // Hand is sorted

        // Check if the bot's card is playable (higher than last played card)
        if (game.compareCards(cardToPlay, game.lastPlayedCard) <= 0) {
            return; // Bot's card is not playable, skip
        }

        // More realistic delay: base delay per number difference + randomness
        let delay;

        // Check if this bot is the only player with cards remaining
        const isLastPlayerWithCards = game.players.every(p => p.id === bot.id || p.hand.length === 0);

        if (isLastPlayerWithCards) {
            // If the bot is the last one with cards, play quickly.
            delay = 250; // A short, fixed delay
        } else {
            // Otherwise, calculate delay based on card difference, without randomness.
            const cardValue = game.getCardValue(cardToPlay);
            const lastCardValue = game.getCardValue(game.lastPlayedCard);
            delay = (cardValue - lastCardValue) * settings.BOT_DELAY_MULTIPLIER_MS;
        }

        const timeoutId = setTimeout(() => {
            
            // Check if game state is still valid before playing
            const currentGame = games.get(roomId);
            const currentBot = currentGame?.players.find(p => p.id === bot.id);
            
            
            if (currentGame && currentGame.gameState === 'playing' && currentBot && currentBot.hand.includes(cardToPlay)) {
                
                // Capture state before the bot plays
                const preActionState = {
                    livesBefore: currentGame.lives,
                    starsBefore: currentGame.throwingStars,
                    gameStateBefore: currentGame.gameState
                };

                currentGame.playCard(bot.id, cardToPlay);

                // Process the action just like a human player's action
                processGameAction(roomId, currentGame, preActionState);
            } else {
            }
        }, delay);
        botTimeouts.set(bot.id, timeoutId);
    });
    roomBotTimeouts.set(roomId, botTimeouts);
};

const broadcastGameState = (roomId) => {
    const game = games.get(roomId);
    if (!game) return;

    // Send the latest game state (including their specific hand) to each player.
    game.players.forEach(player => {
        if (!player.isBot) {
            io.to(player.id).emit('gameState', game.getStateForPlayer(player.id));
        }
    });
};

const processGameAction = (roomId, game, preActionState) => {
    const { livesBefore, starsBefore, gameStateBefore } = preActionState;

    // Check for state changes and emit toast events
    if (game.lives < livesBefore) {
        io.to(roomId).emit('toast', { message: 'A life was lost!', type: 'error' });
    }
    if (game.throwingStars < starsBefore) {
        io.to(roomId).emit('toast', { message: 'A throwing star was used!', type: 'info' });
    }
    if (game.gameState === 'level_end' && gameStateBefore !== 'level_end') {
        io.to(roomId).emit('toast', { message: `Level ${game.level} Complete!`, type: 'success' });
        
        // Check if this is a single-player game and if there's a CTF flag for this level
        const isSinglePlayer = game.players.length === 2 && game.players.some(p => p.isBot);
        const flag = getCTFFlag(game.level);
        
        if (isSinglePlayer && flag) {
            // Set game state to flag_display to pause bot actions
            game.gameState = 'flag_display';
            
            // Send flag only to human players in single-player mode
            game.players.forEach(player => {
                if (!player.isBot) {
                    io.to(player.id).emit('ctfFlag', { 
                        level: game.level, 
                        flag: flag,
                        eventName: settings.CTF_EVENT_NAME || 'CTF Event',
                        eventDescription: settings.CTF_EVENT_DESCRIPTION || 'CTF Challenge'
                    });
                }
            });
        }
    }
    if (game.gameState === 'win' && gameStateBefore !== 'win') {
        io.to(roomId).emit('toast', { message: 'You won the game! Congratulations!', type: 'success' });
        
        // Check if this is a single-player game and if there's a CTF flag for completing the game
        const isSinglePlayer = game.players.length === 2 && game.players.some(p => p.isBot);
        const flag = getCTFFlag(game.level); // Final level flag
        
        if (isSinglePlayer && flag) {
            // Set game state to flag_display to pause any further actions
            game.gameState = 'flag_display';
            
            // Send final flag only to human players in single-player mode
            game.players.forEach(player => {
                if (!player.isBot) {
                    io.to(player.id).emit('ctfFlag', { 
                        level: game.level, 
                        flag: flag,
                        eventName: settings.CTF_EVENT_NAME || 'CTF Event',
                        eventDescription: settings.CTF_EVENT_DESCRIPTION || 'CTF Challenge',
                        isFinalFlag: true
                    });
                }
            });
        }
    }

    scheduleBotActions(roomId); // Always reschedule bot actions after any player action

    // Broadcast the immediate result of the action
    broadcastGameState(roomId);

    // If the action resulted in a level end, the server will now handle the delay.
    // But only if no flag is being displayed
    if (game.gameState === 'level_end') {
        setTimeout(() => {
            const currentGame = games.get(roomId);
            // Ensure the game still exists and is in the same state before advancing.
            if (currentGame && currentGame.gameState === 'level_end') {
                currentGame.startLevel();
                scheduleBotActions(roomId); // Schedule bot actions for the new level
                broadcastGameState(roomId);
            }
        }, 3000);
    }
}

io.on('connection', (socket) => {
    // Wait for user to create or join a room

    socket.on('createRoom', ({ name, mode }) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        socket.join(roomId);
        socket.roomId = roomId;

        const game = new SyncFlowGame(settings.DEFAULT_DEALING_MODE, settings.DEFAULT_DECK_TYPE);
        games.set(roomId, game);

        game.addPlayer(socket.id, name);

        if (mode === 'singlePlayer') {
            const { player: bot } = game.addBotPlayer();
            game.playerReady(socket.id);
            game.playerReady(bot.id);
            game.startLevel();
            scheduleBotActions(roomId);
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

    const handleGameAction = (actionName, handler) => {
        return (data) => {
            const { roomId } = socket;
            if (!roomId) return;
            const game = games.get(roomId);
            if (!game) return;

            // Capture state before the action
            const livesBefore = game.lives;
            const starsBefore = game.throwingStars;
            const gameStateBefore = game.gameState;

            const result = handler(game, data); // Execute the game action

            // Handle errors from the game action
            if (result && result.error) {
                return socket.emit('error', result.error);
            }

            processGameAction(roomId, game, { livesBefore, starsBefore, gameStateBefore });
        };
    };

    socket.on('playerReady', handleGameAction('playerReady', (game) => {
        game.playerReady(socket.id);
        if (game.areAllPlayersReady()) {
            // A single player game is started from createRoom, so this only affects multiplayer lobbies.
            if (game.players.length < 2) {
                return { error: 'You need at least two players to start.' };
            }
            game.startLevel();
        }
    }));

    socket.on('playCard', handleGameAction('playCard', (game, card) => {
        return game.playCard(socket.id, card);
    }));

    socket.on('useThrowingStar', handleGameAction('useThrowingStar', (game) => {
        return game.useThrowingStar(socket.id);
    }));

    socket.on('flagDismissed', (data) => {
        const { roomId } = socket;
        if (!roomId) return;
        const game = games.get(roomId);
        if (!game) return;

        // Resume the game after flag is dismissed
        if (game.gameState === 'flag_display') {
            // Check what the previous state should be
            if (game.level >= (settings.MAX_LEVELS[game.players.length] || 12)) {
                game.gameState = 'win';
            } else {
                // Resume level progression
                game.gameState = 'level_end';
                
                // Trigger the level transition after a brief delay
                setTimeout(() => {
                    const currentGame = games.get(roomId);
                    if (currentGame && currentGame.gameState === 'level_end') {
                        currentGame.startLevel();
                        scheduleBotActions(roomId);
                        broadcastGameState(roomId);
                    }
                }, 1000);
            }
            
            broadcastGameState(roomId);
        }
    });

    socket.on('disconnect', () => {
        const { roomId } = socket;
        if (!roomId) return;

        const game = games.get(roomId);
        if (!game) return;

        // Capture game state before player removal to determine if it was an active game
        const wasActiveGame = game.gameState !== 'lobby' && game.gameState !== 'game_over' && game.gameState !== 'win';

        game.removePlayer(socket.id);

        // After removing the player, check if the game should end due to insufficient players
        const humanPlayersRemaining = game.players.filter(p => !p.isBot).length;
        const botsRemaining = game.players.filter(p => p.isBot).length;

        // A game should reset if:
        // 1. It was an active game (not lobby, game_over, win)
        // 2. And now there are less than 2 human players
        // 3. AND it's not a valid single-player game (1 human + 1 bot)
        const shouldResetGame = wasActiveGame && humanPlayersRemaining < 2 && !(humanPlayersRemaining === 1 && botsRemaining === 1);

        if (shouldResetGame) {
            io.to(roomId).emit('returnToHomeScreen', { message: 'A player disconnected. The game has ended.' }); // Notify remaining players
            games.delete(roomId); // Delete the game room
            clearBotTimeouts(roomId); // Clear any pending bot actions for this game
            roomBotTimeouts.delete(roomId);
        }
        else if (game.players.length === 0) {
            games.delete(roomId);
            clearBotTimeouts(roomId);
            roomBotTimeouts.delete(roomId);
        } else {
            broadcastGameState(roomId);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
