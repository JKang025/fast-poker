import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createSocket } from '../utils/socket';

interface GameState {
  players: Array<{ id: string; username: string; chips: number }>;
  communityCards: string[];
  pot: number;
  currentTurn: string;
  // Add other game state properties as needed
}

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [socket, setSocket] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [actionAmount, setActionAmount] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const newSocket = createSocket(token!);
    setSocket(newSocket);

    newSocket.emit('joinGame', { gameId }, (response: any) => {
      if (!response.success) {
        alert(response.message);
      }
    });

    newSocket.on('gameUpdate', (state: GameState) => {
      setGameState(state);
    });

    //TODO have a list of current players, and then add a start game button
    //newSocket.on('playerJoined', )

    return () => {
      newSocket.disconnect();
    };
  }, [gameId, token]);

  const handleAction = (action: string) => {
    socket.emit('playerAction', { gameId, action, amount: actionAmount }, (response: any) => {
      if (!response.success) {
        alert(response.message);
      }
    });
  };

  if (!gameState) {
    return (
      <div>
        Loading game... <br />
        Game ID: {gameId}
      </div>
    );
}


  return (
    <div>
      <h1>Game ID: {gameId}</h1>
      <div>
        <h2>Community Cards:</h2>
        <p>{gameState.communityCards.join(', ')}</p>
      </div>
      <div>
        <h2>Players:</h2>
        <ul>
          {gameState.players.map((player) => (
            <li key={player.id}>
              {player.username} - Chips: {player.chips}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Pot: {gameState.pot}</h2>
        <p>Current Turn: {gameState.currentTurn}</p>
      </div>
      <div>
        <button onClick={() => handleAction('fold')}>Fold</button>
        <button onClick={() => handleAction('call')}>Call</button>
        <input
          type="number"
          value={actionAmount}
          onChange={(e) => setActionAmount(parseInt(e.target.value))}
          placeholder="Raise Amount"
        />
        <button onClick={() => handleAction('raise')}>Raise</button>
      </div>
    </div>
  );
};

export default GamePage;
