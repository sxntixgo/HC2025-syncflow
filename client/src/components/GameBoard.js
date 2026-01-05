import React, { useState, useEffect } from 'react';
import PlayerHand from './PlayerHand';

const GameBoard = ({ gameState, myHand, onPlayCard, onUseStar, onContinueGame, myId }) => {
  const {
    players,
    level,
    lives,
    throwingStars,
    lastPlayedCard,
    mistakeMade,
    playedCards, // Access the playedCards array
  } = gameState;

  const otherPlayers = players.filter(p => p.id !== myId);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate how many cards can fit in the play area
  // Each card is 80px wide + 10px gap, container has 30px padding (15px each side)
  const calculateMaxCards = () => {
    const containerWidth = windowWidth > 1000 ? 1000 : windowWidth - 40;
    const cardWidth = 80 + 10; // card width + gap
    const availableWidth = containerWidth - 30; // subtract padding
    const hiddenIndicatorWidth = 110; // width of +X more indicator (100px + 10px gap)
    
    // Reserve space for the hidden indicator if there are more cards than can fit
    let maxCards = Math.floor(availableWidth / cardWidth);
    
    // If we need to show the indicator, reduce available space
    if (playedCards.length > maxCards) {
      const remainingWidth = availableWidth - hiddenIndicatorWidth;
      maxCards = Math.floor(remainingWidth / cardWidth);
    }
    
    return Math.max(1, maxCards); // Always show at least 1 card
  };

  // Filter cards to show only the most recent ones that fit
  const getVisibleCards = () => {
    const maxCards = calculateMaxCards();
    if (playedCards.length <= maxCards) {
      return playedCards;
    }
    // Show only the most recent cards (remove oldest/lowest)
    return playedCards.slice(-maxCards);
  };

  const visibleCards = getVisibleCards();

  return (
    <div className="game-board">
      <div className="game-info">
        <div className="info-item">Level: {level}</div>
        <div className="info-item">Lives: {'❤️'.repeat(lives)}</div>
        <div className="info-item">Stars: {'⭐'.repeat(throwingStars)}</div>
      </div>

      <div className="other-players">
        {otherPlayers.map(player => (
          <div key={player.id} className="other-player">
            <h4>{player.name} {player.isBot && '🤖'}</h4>
            <div className="player-cards">
              {Array.from({ length: player.cardCount }, (_, index) => (
                <div key={index} className="card-back"></div>
              ))}
            </div>
            {player.cardCount === 0 && (
              <div className="no-cards">No cards</div>
            )}
          </div>
        ))}
      </div>

      {gameState.gameState === 'level_end' && (
        <div className="level-end-banner">
          <h2>Level {level} Complete!</h2>
          <p>Starting next level...</p>
        </div>
      )}

      {gameState.gameState === 'game_over' && (
        <div className="level-end-banner">
          <h2>Game Over!</h2>
          <button onClick={onContinueGame}>Continue</button>
        </div>
      )}

      {/* Played Cards History */}
      <div className={`played-cards-history ${playedCards.length === 0 ? 'empty' : ''}`}>
        {playedCards.length === 0 ? (
          <div className="play-area-placeholder">
            <span>Play Area</span>
            <small>Cards will appear here</small>
          </div>
        ) : (
          <>
            {playedCards.length > visibleCards.length && (
              <div className="hidden-cards-indicator">
                <span>+{playedCards.length - visibleCards.length}</span>
                <small>more</small>
              </div>
            )}
            {visibleCards.map((item, index) => (
              <div key={`${item.card}-${index}`} className="played-card-item">
                {item.card}
                {item.mistake && <div className="mistake-indicator">❌</div>}
              </div>
            ))}
          </>
        )}
      </div>

      <PlayerHand
        hand={myHand}
        onPlayCard={onPlayCard}
        onUseStar={onUseStar}
        canUseStar={throwingStars > 0 && gameState.gameState === 'playing'}
        isMyTurn={gameState.gameState === 'playing'}
      />
    </div>
  );
};

export default GameBoard;
