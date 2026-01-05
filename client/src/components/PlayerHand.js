import React from 'react';

const PlayerHand = ({ hand, onPlayCard, onUseStar, canUseStar, isMyTurn }) => {
  return (
    <div className="player-hand">
      <h3>Your Hand</h3>
      <div className="cards-container">
        {hand.map((card) => (
          <div
            key={card}
            className="card"
            onClick={() => isMyTurn && onPlayCard(card)}
          >
            {card}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '20px' }}>
        <button onClick={onUseStar} disabled={!canUseStar}>
          Use Throwing Star ⭐
        </button>
      </div>
    </div>
  );
};

export default PlayerHand;

