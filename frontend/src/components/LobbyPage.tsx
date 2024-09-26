// LobbyPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSocket } from '../utils/socket'; // Import the createSocket function

const LobbyPage: React.FC = () => {
  const [gameId, setGameId] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [socket, setSocket] = useState<any>(null); // State to hold the socket instance

  useEffect(() => {
    // Initialize the socket when the component mounts
    const socketInstance = createSocket(token!);
    setSocket(socketInstance);

    // Cleanup: Disconnect socket when the component unmounts
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [token]);

  // Function to handle creating a new game
  const handleCreateGame = () => {
    if (socket) {
      socket.emit('createGame', {}, (response: any) => {
        if (response.success) {
          const newGameId = response.gameId;
          navigate(`/game/${newGameId}`);
        } else {
          console.error('Create game failed:', response.message);
          alert('Failed to create a new game.');
        }
      });
    } else {
      alert('Socket not connected.');
    }
  };

  // Function to handle joining an existing game
  const handleJoinGame = () => {
    if (socket) {
      socket.emit(
        'joinGame',
        { gameId },
        (response: any) => {
          if (response.success) {
            navigate(`/game/${gameId}`);
          } else {
            console.error('Join game failed:', response.message);
            alert('Failed to join the game. Please check the Game ID.');
          }
        }
      );
    } else {
      alert('Socket not connected.');
    }
  };

  return (
    <div>
      <h1>Lobby</h1>

      {/* Button to create a new game */}
      <button onClick={handleCreateGame}>Create Game</button>
      <br /><br />

      {/* Input for Game ID to join an existing game */}
      <label>
        Game ID:
        <input value={gameId} onChange={(e) => setGameId(e.target.value)} />
      </label>
      <button onClick={handleJoinGame}>Join Game</button>
    </div>
  );
};

export default LobbyPage;
