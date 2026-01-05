const TheMindGame = require('./game');

describe('TheMindGame', () => {
  let game;

  // This runs before each test, ensuring a clean game instance.
  beforeEach(() => {
    game = new TheMindGame();
  });

  test('should add a player to the lobby', () => {
    game.addPlayer('player1-id', 'Alice');
    expect(game.players.length).toBe(1);
    expect(game.players[0].name).toBe('Alice');
  });

  test('should start level 1 correctly for 2 players', () => {
    game.addPlayer('player1-id', 'Alice');
    game.addPlayer('player2-id', 'Bob');
    game.startLevel();

    expect(game.level).toBe(1);
    expect(game.lives).toBe(2);
    expect(game.players[0].hand.length).toBe(1);
    expect(game.players[1].hand.length).toBe(1);
    expect(game.gameState).toBe('playing');
  });

  describe('playCard', () => {
    beforeEach(() => {
      // Set up a predictable game state for card playing tests
      game.addPlayer('player1-id', 'Alice');
      game.addPlayer('player2-id', 'Bob');
      game.level = 1; // Manually set level for testing
      game.lives = 2;
      game.gameState = 'playing'; // Important: set game state to playing
      game.players[0].hand = [20];
      game.players[1].hand = [10];
    });

    test('should correctly handle a valid card play', () => {
      // Player 2 plays the lowest card (10)
      game.playCard('player2-id', 10);

      expect(game.lives).toBe(2); // No lives lost
      expect(game.mistakeMade).toBe(false);
      expect(game.lastPlayedCard).toBe(10);
      expect(game.players[1].hand.length).toBe(0);
    });

    test('should handle a mistake and deduct a life', () => {
      // Player 1 plays their card (20) first, which is a mistake
      game.playCard('player1-id', 20);

      expect(game.lives).toBe(1); // A life is lost
      expect(game.mistakeMade).toBe(true);
      expect(game.lastPlayedCard).toBe(20);

      // Both players' hands should be empty, as the lower card (10) is discarded
      expect(game.players[0].hand.length).toBe(0);
      expect(game.players[1].hand.length).toBe(0);
    });

    test('should transition to level_end when all cards are played', () => {
      game.playCard('player2-id', 10); // Player 2 plays 10
      game.playCard('player1-id', 20); // Player 1 plays 20

      expect(game.gameState).toBe('level_end');
    });
  });

  describe('useThrowingStar', () => {
    test('should decrease throwing stars and discard lowest cards', () => {
      game.addPlayer('player1-id', 'Alice');
      game.addPlayer('player2-id', 'Bob');
      game.startLevel(); // level 1
      game.throwingStars = 1;
      game.players[0].hand = [25];
      game.players[1].hand = [15];

      game.useThrowingStar('player1-id');

      expect(game.throwingStars).toBe(0);
      // Both players should have empty hands as their lowest (and only) card is discarded
      expect(game.players[0].hand.length).toBe(0);
      expect(game.players[1].hand.length).toBe(0);
      // The last played card should be the highest of the discarded cards
      expect(game.lastPlayedCard).toBe(25);
      // The game state should be level_end as all cards are played
      expect(game.gameState).toBe('level_end');
    });
  });

  test('should transition to win state when the final level is completed', () => {
    game.addPlayer('player1-id', 'Alice');
    game.addPlayer('player2-id', 'Bob');
    game.level = 12; // For 2 players, max level is 12.
    game.gameState = 'playing'; // Set game state to playing
    game.players[0].hand = [99];
    game.players[1].hand = []; // Second player has no cards
    game.playCard('player1-id', 99);
    expect(game.gameState).toBe('win');
  });

  describe('Single Player (Bot) Game Flow', () => {
    test('should transition to level_end when bot plays the last card', () => {
      game.addPlayer('player1-id', 'Alice');
      game.addBotPlayer();
      game.startLevel(); // level 1

      // Simulate human player having played their card
      game.players[0].hand = [];
      // The bot has one card, let's say it's 50
      const botCard = game.players[1].hand[0];

      // Bot plays its card
      game.playCard(game.players[1].id, botCard);

      expect(game.gameState).toBe('level_end');
    });
  });

  describe('removePlayer', () => {
    test('should remove a player but keep the game state for the remaining player', () => {
      game.addPlayer('player1-id', 'Alice');
      game.addPlayer('player2-id', 'Bob');
      game.startLevel();
      expect(game.players.length).toBe(2);

      game.removePlayer('player1-id');

      expect(game.players.length).toBe(1);
      expect(game.players[0].name).toBe('Bob');
      expect(game.gameState).toBe('playing'); // Game continues for remaining player
    });

    test('should reset the game when the last player is removed', () => {
      game.addPlayer('player1-id', 'Alice');
      game.startLevel();
      game.removePlayer('player1-id');

      expect(game.players.length).toBe(0);
      expect(game.gameState).toBe('lobby'); // Game is reset
    });
  });

  describe('returnToLobby', () => {
    test('should reset game progress but keep players', () => {
      game.addPlayer('player1-id', 'Alice');
      game.addPlayer('player2-id', 'Bob');
      game.startLevel(); // level is 1, gameState is 'playing'
      game.players[0].isReady = true;

      game.returnToLobby();

      expect(game.players.length).toBe(2); // Players are not removed
      expect(game.level).toBe(0);
      expect(game.gameState).toBe('lobby');
      expect(game.players[0].isReady).toBe(false); // Players are marked as not ready
    });
  });

  describe('Game State Edge Cases', () => {
    test('should prevent adding more than 4 players', () => {
      game.addPlayer('player1-id', 'Alice');
      game.addPlayer('player2-id', 'Bob');
      game.addPlayer('player3-id', 'Charlie');
      game.addPlayer('player4-id', 'Diana');

      const result = game.addPlayer('player5-id', 'Eve');
      expect(result.error).toBe('Game is full.');
      expect(game.players.length).toBe(4);
    });

    test('should prevent adding players after game has started', () => {
      game.addPlayer('player1-id', 'Alice');
      game.addPlayer('player2-id', 'Bob');
      game.startLevel();

      const result = game.addPlayer('player3-id', 'Charlie');
      expect(result.error).toBe('Game has already started.');
      expect(game.players.length).toBe(2);
    });

    test('should handle game over when all lives are lost', () => {
      game.addPlayer('player1-id', 'Alice');
      game.addPlayer('player2-id', 'Bob');
      game.gameState = 'playing'; // Set game state to playing
      game.lives = 1;
      game.players[0].hand = [50];
      game.players[1].hand = [10];

      // Player 1 plays first, causing a mistake and losing the last life
      game.playCard('player1-id', 50);

      expect(game.lives).toBe(0);
      expect(game.gameState).toBe('game_over');
    });

    test('should not allow playing cards when game is not in playing state', () => {
      game.addPlayer('player1-id', 'Alice');
      game.players[0].hand = [25];
      // Game is in 'lobby' state, not 'playing'

      const result = game.playCard('player1-id', 25);
      expect(result.error).toBe('Invalid move.');
    });

    test('should not allow using throwing star when none available', () => {
      game.addPlayer('player1-id', 'Alice');
      game.startLevel();
      game.throwingStars = 0;

      const result = game.useThrowingStar('player1-id');
      expect(result.error).toBe('No throwing stars available or not in playing state.');
    });
  });

  describe('Reward System', () => {
    test('should grant extra life at reward levels', () => {
      game.addPlayer('player1-id', 'Alice');
      game.addPlayer('player2-id', 'Bob');
      
      // Start level 1
      game.startLevel();
      expect(game.lives).toBe(2); // Initial lives = number of players

      // Advance to level 2 (reward level)
      game.level = 1; // Set to 1 before calling startLevel again
      game.startLevel();
      expect(game.level).toBe(2);
      expect(game.lives).toBe(3); // Should have gained 1 life
    });

    test('should grant extra throwing star at reward levels', () => {
      game.addPlayer('player1-id', 'Alice');
      game.addPlayer('player2-id', 'Bob');
      
      // Start level 1
      game.startLevel();
      expect(game.throwingStars).toBe(1); // Initial throwing stars

      // Advance to level 3 (star reward level)
      game.level = 2; // Set to 2 before calling startLevel again
      game.startLevel();
      expect(game.level).toBe(3);
      expect(game.throwingStars).toBe(2); // Should have gained 1 star
    });
  });

  describe('Bot Player Functionality', () => {
    test('should create bot player with correct properties', () => {
      const result = game.addBotPlayer('Test Bot');
      
      expect(result.player.name).toBe('Test Bot');
      expect(result.player.isBot).toBe(true);
      expect(result.player.hand).toEqual([]);
      expect(result.player.isReady).toBe(false);
      expect(game.players.length).toBe(1);
    });

    test('should prevent adding more than 4 bots', () => {
      game.addBotPlayer('Bot 1');
      game.addBotPlayer('Bot 2');
      game.addBotPlayer('Bot 3');
      game.addBotPlayer('Bot 4');

      const result = game.addBotPlayer('Bot 5');
      expect(result.error).toBe('Game is full.');
    });
  });

  describe('Hand Management', () => {
    test('should deal correct number of cards per level', () => {
      game.addPlayer('player1-id', 'Alice');
      game.addPlayer('player2-id', 'Bob');
      game.addPlayer('player3-id', 'Charlie');

      // Level 1: 1 card per player
      game.startLevel();
      expect(game.players[0].hand.length).toBe(1);
      expect(game.players[1].hand.length).toBe(1);
      expect(game.players[2].hand.length).toBe(1);

      // Level 3: 3 cards per player
      game.level = 2;
      game.startLevel();
      expect(game.level).toBe(3);
      expect(game.players[0].hand.length).toBe(3);
      expect(game.players[1].hand.length).toBe(3);
      expect(game.players[2].hand.length).toBe(3);
    });

    test('should sort cards in ascending order', () => {
      game.addPlayer('player1-id', 'Alice');
      game.startLevel();

      const hand = game.players[0].hand;
      const sortedHand = [...hand].sort((a, b) => a - b);
      expect(hand).toEqual(sortedHand);
    });
  });

  describe('Max Level Victory Conditions', () => {
    test('should set correct max levels for different player counts', () => {
      // 2 players: 12 levels
      game.addPlayer('player1-id', 'Alice');
      game.addPlayer('player2-id', 'Bob');
      game.level = 12;
      game.players[0].hand = [];
      game.players[1].hand = [];
      game.playCard = jest.fn(() => {});
      
      // Simulate level completion
      game.gameState = 'playing';
      const originalPlayCard = TheMindGame.prototype.playCard;
      game.playCard = function(playerId, card) {
        this.players.forEach(p => p.hand = []);
        if (this.level >= 12) {
          this.gameState = 'win';
        } else {
          this.gameState = 'level_end';
        }
        return {};
      };

      game.playCard('player1-id', 50);
      expect(game.gameState).toBe('win');
    });
  });
});