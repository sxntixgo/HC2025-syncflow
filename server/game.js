const MAX_PLAYERS = 4;
const REWARD_LEVELS_LIVES = [2, 5, 8];
const REWARD_LEVELS_STARS = [3, 6, 9];
const settings = require('./settings');

class SyncFlowGame {
    constructor(dealingMode = settings.GAME_MODES.NORMAL, deckType = settings.DEFAULT_DECK_TYPE) {
        this.dealingMode = dealingMode;
        this.deckType = deckType;
        this.resetGame();
    }

    resetGame() {
        this.players = [];
        this.level = 0;
        this.lives = 0;
        this.throwingStars = 0;
        this.playedCards = [];
        this.gameState = 'lobby'; // lobby, playing, level_end, flag_display, game_over, win
        this.lastPlayedCard = this.getLowestCardValue();
        this.mistakeMade = false;
    }

    generateDeck() {
        if (this.deckType === settings.DECK_TYPES.HEX) {
            return [...settings.CUSTOM_DECKS.hex.values];
        } else {
            // Default numbers deck (1-100)
            return Array.from({ length: 100 }, (_, i) => i + 1);
        }
    }

    getCardValue(card) {
        if (this.deckType === settings.DECK_TYPES.HEX) {
            return parseInt(card, 16);
        } else {
            return card;
        }
    }

    getLowestCardValue() {
        if (this.deckType === settings.DECK_TYPES.HEX) {
            return parseInt(settings.CUSTOM_DECKS.hex.values[0], 16) - 1;
        } else {
            return 0; // Default for numbers
        }
    }

    compareCards(card1, card2) {
        return this.getCardValue(card1) - this.getCardValue(card2);
    }

    addPlayer(id, name) {
        if (this.players.length >= MAX_PLAYERS) {
            return { error: 'Game is full.' };
        }
        if (this.gameState !== 'lobby') {
            return { error: 'Game has already started.' };
        }
        const newPlayer = {
            id,
            name,
            hand: [],
            isReady: false,
            isBot: false,
        };
        this.players.push(newPlayer);
        return { player: newPlayer };
    }

    addBotPlayer(name = 'SyncBot') {
        if (this.players.length >= MAX_PLAYERS) {
            return { error: 'Game is full.' };
        }
        const botId = `bot-${Date.now()}`;
        const newPlayer = {
            id: botId,
            name,
            hand: [],
            isReady: false, // Bot will be set to ready by the server
            isBot: true,
        };
        this.players.push(newPlayer);
        return { player: newPlayer };
    }

    removePlayer(id) {
        this.players = this.players.filter(p => p.id !== id);
        if (this.players.length === 0) {
            this.resetGame();
        }
    }

    returnToLobby() {
        this.level = 0;
        this.lives = 0;
        this.throwingStars = 0;
        this.playedCards = [];
        this.gameState = 'lobby';
        this.lastPlayedCard = 0;
        this.mistakeMade = false;
        // Mark remaining players as not ready for the next game
        this.players.forEach(p => p.isReady = false);
    }

    playerReady(id) {
        const player = this.players.find(p => p.id === id);
        if (player) {
            player.isReady = true;
        }
    }

    areAllPlayersReady() {
        return this.players.length > 0 && this.players.every(p => p.isReady);
    }

    startLevel() {
        if (this.gameState === 'lobby') {
            this.lives = this.players.length;
            this.throwingStars = 1;
        }

        this.level++;
        this.lastPlayedCard = this.getLowestCardValue();
        this.playedCards = [];
        this.mistakeMade = false;
        this.players.forEach(p => p.isReady = false);

        // Grant rewards
        if (REWARD_LEVELS_LIVES.includes(this.level)) {
            this.lives++;
        }
        if (REWARD_LEVELS_STARS.includes(this.level)) {
            this.throwingStars++;
        }

        // Deal cards based on dealing mode
        if (this.dealingMode === settings.GAME_MODES.PREDICTABLE) {
            this.dealPredictableCards();
        } else {
            this.dealRandomCards();
        }
    }

    dealRandomCards() {
        const deck = this.generateDeck();
        deck.sort(() => Math.random() - 0.5); // Shuffle

        this.players.forEach(player => {
            player.hand = deck.splice(0, this.level).sort((a, b) => this.compareCards(a, b));
        });

        this.gameState = 'playing';
    }

    dealPredictableCards() {
        // Create random cards but distributed to maintain turn order
        const totalCards = this.players.length * this.level;
        const deck = this.generateDeck();
        deck.sort(() => Math.random() - 0.5); // Shuffle randomly
        
        // Take the first totalCards from shuffled deck
        const cardPool = deck.slice(0, totalCards);
        // Sort the selected cards to maintain predictable turn order
        cardPool.sort((a, b) => this.compareCards(a, b));
        
        // Deal cards in round-robin fashion to ensure turn order
        this.players.forEach(player => {
            player.hand = [];
        });

        for (let cardIndex = 0; cardIndex < totalCards; cardIndex++) {
            const playerIndex = cardIndex % this.players.length;
            this.players[playerIndex].hand.push(cardPool[cardIndex]);
        }

        // Sort each player's hand
        this.players.forEach(player => {
            player.hand.sort((a, b) => this.compareCards(a, b));
        });

        this.gameState = 'playing';
    }

    playCard(playerId, card) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !player.hand.includes(card) || this.gameState !== 'playing') {
            return { error: 'Invalid move.' };
        }

        // Remove card from player's hand
        player.hand = player.hand.filter(c => c !== card);

        // Check for mistakes
        const mistake = this.players.some(p => p.hand.some(c => this.compareCards(c, card) < 0));

        if (mistake) {
            this.lives--;
            this.mistakeMade = true;
            const cardsToDiscard = [];
            this.players.forEach(p => {
                const lowerCards = p.hand.filter(c => this.compareCards(c, card) < 0);
                if (lowerCards.length > 0) {
                    cardsToDiscard.push(...lowerCards);
                    p.hand = p.hand.filter(c => this.compareCards(c, card) >= 0);
                }
            });
            this.playedCards.push({ card, player: player.name, mistake: true, discarded: cardsToDiscard });

            if (this.lives <= 0) {
                this.gameState = 'game_over';
                return {};
            }
        } else {
            this.mistakeMade = false;
            this.playedCards.push({ card, player: player.name, mistake: false });
        }

        this.lastPlayedCard = card;

        // Check for level completion
        if (this.players.every(p => p.hand.length === 0)) {
            const maxLevel = settings.MAX_LEVELS[this.players.length] || 12;
            if (this.level >= maxLevel) {
                this.gameState = 'win';
            } else {
                this.gameState = 'level_end';
            }
        }

        return {};
    }

    useThrowingStar(playerId) {
        if (this.throwingStars <= 0 || this.gameState !== 'playing') {
            return { error: 'No throwing stars available or not in playing state.' };
        }

        const player = this.players.find(p => p.id === playerId);
        if (!player) return { error: 'Player not found.' };

        this.throwingStars--;

        const discardedCards = [];
        this.players.forEach(p => {
            if (p.hand.length > 0) {
                const lowestCard = p.hand.shift(); // Hand is sorted, so first card is lowest
                this.playedCards.push({ card: lowestCard, player: p.name, mistake: false });
                discardedCards.push(lowestCard);
            }
        });

        // Set the last played card to the highest of the discarded cards
        if (discardedCards.length > 0) {
            this.lastPlayedCard = discardedCards.reduce((max, card) => 
                this.compareCards(card, max) > 0 ? card : max
            );
        }

        // Check for level completion after using star
        if (this.players.every(p => p.hand.length === 0)) {
            const maxLevel = settings.MAX_LEVELS[this.players.length] || 12;
            if (this.level >= maxLevel) {
                this.gameState = 'win';
            } else {
                this.gameState = 'level_end';
            }
        }

        return {};
    }

    getStateForPlayer(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return null;

        return {
            ...this.getPublicState(),
            myHand: player.hand,
        };
    }

    getPublicState() {
        return {
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                cardCount: p.hand.length,
                isReady: p.isReady,
                isBot: p.isBot,
            })),
            level: this.level,
            lives: this.lives,
            throwingStars: this.throwingStars,
            playedCards: this.playedCards,
            lastPlayedCard: this.lastPlayedCard,
            gameState: this.gameState,
            mistakeMade: this.mistakeMade,
        };
    }
}

module.exports = SyncFlowGame;
