// SyncFlow Game Settings
// Configuration for CTF flags and game settings

module.exports = {
  // CTF Configuration
  CTF_ENABLED: true,
  
  // CTF Event Information
  CTF_EVENT_NAME: "SyncFlow",
  CTF_EVENT_DESCRIPTION: "Team up with SyncBot to achieve perfect synchronization and unlock flags",
  
  // CTF Flags - awarded when completing specific levels in single-player mode
  CTF_FLAGS: {
    "4": "HC{perfect_sync_unlocked}",
    "6": "HC{sixth_sense_synchrony}",
    "8": "HC{octuple_sync_mastery}",
    "10": "HC{double_digit_unlocked}"
  },
  
  // Game Mode Configuration (server-side only, hidden from clients)
  DEFAULT_DEALING_MODE: 'normal', // 'normal' or 'predictable'
  GAME_MODES: {
    NORMAL: 'normal',           // Random card dealing
    PREDICTABLE: 'predictable'  // Cards dealt in predictable turn order
  },

  // Deck Configuration (server-side only)
  DEFAULT_DECK_TYPE: 'numbers', // 'numbers', 'hex'
  DECK_TYPES: {
    NUMBERS: 'numbers',    // Standard 1-100 deck
    HEX: 'hex'            // Hexadecimal values
  },

  // Custom deck configurations
  CUSTOM_DECKS: {
    hex: {
      // 48 cards: multiples of both 4 and 3
      size: 48,
      values: [
        '01', '02', '03', '04', '05', '06', '07', '08',
        '09', '0A', '0B', '0C', '0D', '0E', '0F', '10',
        '11', '12', '13', '14', '15', '16', '17', '18',
        '19', '1A', '1B', '1C', '1D', '1E', '1F', '20',
        '21', '22', '23', '24', '25', '26', '27', '28',
        '29', '2A', '2B', '2C', '2D', '2E', '2F', '30'
      ]
    }
  },

  // Game Level Configuration
  MAX_LEVELS: { 2: 12, 3: 10, 4: 8 },

  // Bot Configuration (server-side only)
  BOT_DELAY_MULTIPLIER_MS: 1000, // Base delay in ms per card number difference
  
  // Server Configuration
  PORT: process.env.PORT || 4001
};