import React from 'react';
import './GameRules.css';

const GameRules = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="rules-overlay">
      <div className="rules-modal">
        <div className="rules-header">
          <h2 className="rules-title">SyncFlow Rules</h2>
          <button className="rules-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="rules-content">
          <div className="rules-section">
            <h3>Objective</h3>
            <p>Play all cards in ascending order without communication. Work together through increasing levels of difficulty.</p>
          </div>

          <div className="rules-section">
            <h3>How to Play</h3>
            <ul>
              <li>Each level, players receive cards equal to the level number</li>
              <li>Cards must be played in ascending order across all players</li>
              <li><strong>No communication allowed</strong> - rely on timing and intuition</li>
              <li>Playing a card out of order costs a life</li>
              <li>Complete all cards in a level to advance</li>
            </ul>
          </div>

          <div className="rules-section">
            <h3>Lives & Stars</h3>
            <ul>
              <li><strong>Lives:</strong> Start with lives equal to player count</li>
              <li><strong>Throwing Stars:</strong> Discard everyone's lowest card simultaneously</li>
              <li><strong>Rewards:</strong> Gain extra lives and stars at certain levels</li>
              <li>Game ends when all lives are lost</li>
            </ul>
          </div>

          <div className="rules-section">
            <h3>Victory Conditions</h3>
            <ul>
              <li><strong>2 Players:</strong> Complete 12 levels</li>
              <li><strong>3 Players:</strong> Complete 10 levels</li>
              <li><strong>4 Players:</strong> Complete 8 levels</li>
            </ul>
          </div>

        </div>
        
        <div className="rules-footer">
          <button className="rules-close-bottom-btn" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameRules;