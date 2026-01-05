import React from 'react';

const EndScreen = ({ message, level }) => {
  const handlePlayAgain = () => {
    window.location.reload();
  };

  return (
    <div className="end-screen">
      <h2>{message}</h2>
      {level && <p>You reached level {level}.</p>}
      <button onClick={handlePlayAgain} style={{ marginTop: '20px' }}>Play Again</button>
    </div>
  );
};

export default EndScreen;
