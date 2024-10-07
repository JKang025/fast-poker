// frontend/src/pages/LobbyPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../utils/socket';

// Define interfaces for type safety
interface CreateGameResponse {
  success: boolean;
  gameId?: string;
  message?: string;
}

const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const socket = token ? getSocket(token) : null;

  // State for Join Game
  const [joinGameId, setJoinGameId] = useState<string>('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // State for Create Game
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const handleCreateGame = () => {
    if (!socket) {
      alert('Socket not connected.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    socket.emit('createGame', {}, (response: CreateGameResponse) => {
      setIsCreating(false);
      if (response.success && response.gameId) {
        const { gameId } = response;
        console.log(`Game created with ID: ${gameId}`);
        navigate(`/game/${gameId}`); // Navigate to GamePage
      } else {
        console.error('Create game failed:', response.message);
        setCreateError(response.message || 'Failed to create a new game.');
      }
    });
  };

  const handleJoinGame = () => {
    if (!joinGameId.trim()) {
      setJoinError('Please enter a valid Game ID.');
      return;
    }

    navigate(`/game/${joinGameId.trim()}`);
  };

  return (
    <div style={styles.container}>
      {/* Create Game Section */}
      <div style={styles.section}>
        <h2>Create a New Game</h2>
        <button
          onClick={handleCreateGame}
          disabled={isCreating}
          style={styles.button}
        >
          {isCreating ? 'Creating...' : 'Create Game'}
        </button>
        {createError && <p style={styles.error}>{createError}</p>}
      </div>

      {/* Join Game Section */}
      <div style={styles.section}>
        <h2>Join an Existing Game</h2>
        <input
          type="text"
          placeholder="Enter Game ID"
          value={joinGameId}
          onChange={(e) => {
            setJoinGameId(e.target.value);
            setJoinError(null); // Clear error when user types
          }}
          style={styles.input}
        />
        <button onClick={handleJoinGame} style={styles.button}>
          Join Game
        </button>
        {joinError && <p style={styles.error}>{joinError}</p>}
      </div>
    </div>
  );
};

// Inline styles for simplicity
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh', // Full viewport height
    backgroundColor: '#ffffff', // White background
    padding: '1rem',
  },
  section: {
    width: '100%',
    maxWidth: '300px',
    marginBottom: '2rem',
    textAlign: 'center',
  },
  input: {
    padding: '0.5rem',
    width: '100%',
    marginBottom: '1rem',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  button: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    cursor: 'pointer',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#ffffff', // White background for button
    transition: 'background-color 0.3s ease',
  },
  error: {
    color: 'red',
    marginTop: '0.5rem',
  },
};

export default LobbyPage;
