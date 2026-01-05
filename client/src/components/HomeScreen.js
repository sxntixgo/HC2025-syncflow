import React, { useState } from 'react';

const HomeScreen = ({ onCreateRoom, onJoinRoom }) => {
    const [name, setName] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');

    const handleJoin = () => {
        if (name && joinRoomId) {
            onJoinRoom({ name, roomId: joinRoomId.toUpperCase() });
        }
    };

    return (
        <div className="lobby-container">
            <h2>Welcome to SyncFlow</h2>
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength="12"
                />
            </div>

            <div>
                <h3>Create a New Game</h3>
                <button onClick={() => onCreateRoom({ name, mode: 'multiplayer' })} disabled={!name} style={{ marginRight: '10px' }}>
                    Create Multiplayer Room
                </button>
                <button onClick={() => onCreateRoom({ name, mode: 'singlePlayer' })} disabled={!name}>
                    Play with SyncBot for flags
                </button>
            </div>

            <hr style={{ margin: '30px 0', borderColor: 'var(--color-primary)' }} />

            <div>
                <h3>Join an Existing Game</h3>
                <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    maxLength="6"
                    style={{ textTransform: 'uppercase' }}
                />
                <button onClick={handleJoin} disabled={!name || !joinRoomId}>
                    Join Room
                </button>
            </div>
        </div>
    );
};

export default HomeScreen;
