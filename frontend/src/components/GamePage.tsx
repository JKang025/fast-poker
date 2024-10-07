// frontend/src/pages/GamePage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSocket } from '../utils/socket';

interface Player {
  playerId: string;
  username: string;
}


const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const socket = token ? getSocket(token) : null;
  const [players, setPlayers] = useState<Player[]>([]);
  const hasJoinedRef = useRef(false);

  const [gameState, setGameState] = useState<any>(null);


  // join game upon component mounting
  useEffect(() => {
    if (!socket) {
      console.error('Socket is not connected.');
      navigate('/lobby');
      return;
    }

    if (!gameId) {
      console.error('No gameId provided.');
      navigate('/lobby');
      return;
    }

    if (!username) {
      console.error('Username not found.');
      navigate('/lobby');
      return;
    }

    // joining game ONCE when page is loaded
    if (!hasJoinedRef.current) {
      console.log('Emitting joinGame');
      hasJoinedRef.current = true; 
      socket.emit('joinGame', { gameId, username }, (response: any) => {
          if (response.success) {
            console.log(`Joined game ${gameId} successfully.`);
            setPlayers(response.players || []);
          } else {
            console.error('Join game failed:', response.message);
            navigate('/gg');
          }
        }
      );
    }

    // EVENT RECIEVED: playerJoined
    const handlePlayerJoined = (data: any) => {
      if (data.players) {
        setPlayers(data.players);
        console.log('Players updated:', data.players);
      }
    };

    socket.on('playerJoined', handlePlayerJoined);

  }, [socket, gameId, username, navigate]);




  
  if(gameState){ // game has started
    return(<div></div>)




  }else{  // waiting for game to start

      return (
      <div>
        <h1>Game ID: {gameId}</h1>
        <h2>Players:</h2>
        {players.length > 0 ? (
          <ul>
            {players.map((player) => (
              <li key={player.playerId}>
                {player.username} (ID: {player.playerId})
              </li>
            ))}
          </ul>
        ) : (
          <p>No players have joined yet.</p>
        )}
      </div>
    );
  }
  
};

export default GamePage;
