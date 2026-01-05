import React from 'react';

const Lobby = ({ players, isReady, onPlayerReady, roomId }) => {
  const canStart = players.length >= 2;
  return (
    <div className="lobby-container">
      <h2>Lobby - Room: {roomId}</h2>
      <p>Share this ID with your friends to let them join!</p>

      <div>
        <h3>Waiting for players...</h3>
        <button onClick={onPlayerReady} disabled={isReady || !canStart}>
          {isReady ? "Waiting for others..." : (canStart ? "Ready to Start" : "Waiting for more players...")}
        </button>
      </div>

      <h3>Players in Lobby:</h3>
      <ul className="player-list">
        {players.map((player) => (
          <li key={player.id}>
            <span>{player.name} {player.isBot && '🤖'}</span>
            <span className={player.isReady ? 'ready-status' : 'not-ready-status'}>
              {player.isReady ? 'Ready' : 'Not Ready'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;
