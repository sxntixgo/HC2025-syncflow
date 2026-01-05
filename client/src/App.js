import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import HomeScreen from './components/HomeScreen';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import EndScreen from './components/EndScreen';
import ToastNotification from './components/ToastNotification';
import FlagCard from './components/FlagCard';
import GameOverCard from './components/GameOverCard';
import GameRules from './components/GameRules';
import './App.css';

const App = () => {
  const [gameState, setGameState] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [myHand, setMyHand] = useState([]); // Re-introducing myHand state
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light'); // 'light' or 'dark'
  const [currentFlag, setCurrentFlag] = useState(null); // For CTF flag display
  const [showRules, setShowRules] = useState(false); // For game rules modal
  const socketRef = useRef(null);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  };

  const dismissToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  // Effect to apply theme class to body and save to localStorage
  useEffect(() => {
    document.body.className = theme + '-mode';
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    // Connect to the server
    socketRef.current = io.connect('/');

    // Listen for gameState updates
    socketRef.current.on('gameState', (newGameState) => {
        setMyHand(newGameState.myHand || []);
        setGameState(newGameState);
    });

    // Initial room creation event
    socketRef.current.on('roomCreated', ({ roomId, gameState }) => {
        setRoomId(roomId);
        setGameState(gameState);
        setMyHand(gameState.myHand || []); // Set initial hand
    });

    // Listen for explicit toast events from the server
    socketRef.current.on('toast', ({ message, type }) => {
      addToast(message, type);
    });

    // Listen for CTF flags
    socketRef.current.on('ctfFlag', (flagData) => {
      setCurrentFlag(flagData);
    });

    // Listen for explicit event to return to home screen
    socketRef.current.on('returnToHomeScreen', ({ message }) => {
      if (message) addToast(message, 'error');
      // Use a simple timeout to delay the state reset, allowing the toast to be seen.
      setTimeout(() => {
        setGameState(null);
        setRoomId('');
        setMyHand([]);
      }, 3000); // Wait 3 seconds (the duration of the toast)
    });

    // Listen for errors
    socketRef.current.on('error', (errorMessage) => {
      alert(errorMessage);
    });

    // Clean up on component unmount
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const handleCreateRoom = ({ name, mode }) => {
    socketRef.current.emit('createRoom', { name, mode });
  };

  const handleJoinRoom = ({ name, roomId }) => {
    socketRef.current.emit('joinRoom', { name, roomId });
    setRoomId(roomId);
  };

  const handlePlayerReady = () => {
    socketRef.current.emit('playerReady');
  };

  const handlePlayCard = (card) => {
    socketRef.current.emit('playCard', card);
  };

  const handleUseStar = () => {
    socketRef.current.emit('useThrowingStar');
  };

  const handleContinueGame = () => {
    setGameState(null);
    setRoomId('');
    setMyHand([]);
  };

  const handleCloseFlag = () => {
    // Notify server that flag has been dismissed
    socketRef.current.emit('flagDismissed');
    setCurrentFlag(null);
  };

  const toggleRules = () => {
    setShowRules(prev => !prev);
  };

  const renderContent = () => {
    if (!gameState) {
      return <HomeScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
    }

    // Defensively check for a valid players array to prevent crashes.
    if (!gameState.players || !Array.isArray(gameState.players)) {
        // This prevents a crash if the gameState is malformed.
        // Instead of a blank screen, the user will see this message.
        return <div>Waiting for game data...</div>;
        }
      

    const me = gameState.players.find(p => p.id === socketRef.current.id);

    switch (gameState.gameState) {
      case 'lobby':
        return (
          <Lobby
            roomId={roomId}
            players={gameState.players}
            isReady={me?.isReady}
            onPlayerReady={handlePlayerReady}
          />
        );
      case 'playing':
      case 'level_end':
      case 'game_over':
        return (
          <GameBoard
            gameState={gameState}
            myHand={myHand} // Pass the dedicated myHand state
            onPlayCard={handlePlayCard}
            onUseStar={handleUseStar}
            onContinueGame={handleContinueGame} // Pass the new handler
            myId={socketRef.current.id}
          />
        );
      case 'win':
        return <EndScreen message="You Won! Congratulations!" level={gameState.level} />;
      default:
        return <div>Unknown game state</div>;
    }
  };

  return (
    <div className="app-container">
      {!currentFlag && gameState?.gameState !== 'game_over' && !showRules && (
        <>
          {renderContent()}
          <button onClick={toggleTheme} style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1001 }}>
            Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
          <button onClick={toggleRules} style={{ position: 'fixed', bottom: '20px', left: '230px', zIndex: 1001 }}>
            Game Rules
          </button>
        </>
      )}
      <div className="toast-container">
        {toasts.map((toast) => (
          <ToastNotification key={toast.id} {...toast} onDismiss={dismissToast} />
        ))}
      </div>
      {currentFlag && (
        <FlagCard
          flag={currentFlag.flag}
          level={currentFlag.level}
          eventName={currentFlag.eventName}
          eventDescription={currentFlag.eventDescription}
          isFinalFlag={currentFlag.isFinalFlag}
          onClose={handleCloseFlag}
        />
      )}
      {gameState?.gameState === 'game_over' && (
        <GameOverCard
          level={gameState.level}
          onContinue={handleContinueGame}
        />
      )}
      <GameRules 
        isOpen={showRules} 
        onClose={() => setShowRules(false)} 
      />
    </div>
  );
};

export default App;
