import React from 'react';
import './GameOverCard.css';

const GameOverCard = ({ level, onContinue }) => {
  return (
    <div className="game-over-overlay">
      <div className="game-over-card">
        <div className="game-over-header">
          <h2 className="game-over-title">Game Over!</h2>
        </div>
        
        <div className="game-over-content">
          <div className="game-over-level">
            <span className="game-over-level-label">Level Reached: {level}</span>
          </div>
          
          <div className="game-over-info">
            <p className="game-over-message">
              You've completed {level - 1} level{level - 1 !== 1 ? 's' : ''} of SyncFlow!
            </p>
            <p className="game-over-description">
              Every level requires perfect synchronization and intuition between players.
            </p>
          </div>
        </div>
        
        <div className="game-over-footer">
          <button 
            className="game-over-continue-btn"
            onClick={onContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverCard;