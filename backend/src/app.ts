// src/app.ts
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import routes from './routes';
import jwt from 'jsonwebtoken';
import { SECRETKEY } from './utils/auth';
import { GameManager } from './game/GameManager';
import { Player } from './game/models/Player';
import { SocketResponse } from './utils/SocketResponse';

const app = express();
const PORT = 8080;

app.use(express.json());
app.use('/api', routes);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Replace with your frontend origin
    methods: ['GET', 'POST'],
  },
});

// Middleware for Socket.IO authentication
io.use((socket: Socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  jwt.verify(token, SECRETKEY, (err: any, decoded: any) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.data.userId = decoded.id;
    next();
  });
});

io.on('connection', (socket: Socket) => {
  console.log(`User connected: ${socket.data.userId}`);

  // Event: createGame
  socket.on('createGame', async (data: any, callback: (response: SocketResponse) => void) => {
    try {
      const gameId = generateUniqueGameId();
      GameManager.createGame(gameId);
      callback({ success: true, gameId });
    } catch (error: unknown) {
      console.error(`Error in createGame handler:`, error);
      if (error instanceof Error) {
        callback({ success: false, message: error.message });
      } else {
        callback({ success: false, message: 'An unexpected error occurred.' });
      }
    }
  });

  // Event: joinGame
  socket.on(
    'joinGame',
    async (
      { gameId, username }: { gameId: string; username: string },
      callback: (response: SocketResponse) => void
    ) => {
      try {
        const player = new Player(socket.data.userId, username, 1000); // Starting chips
        GameManager.addPlayerToGame(gameId, player);
        socket.join(gameId);
        io.to(gameId).emit('playerJoined', { playerId: player.id, username: player.username });
        callback({ success: true });
      } catch (error: unknown) {
        console.error(`Error in joinGame handler:`, error);
        if (error instanceof Error) {
          callback({ success: false, message: error.message });
        } else {
          callback({ success: false, message: 'An unexpected error occurred.' });
        }
      }
    }
  );

  // Event: startGame
  socket.on(
    'startGame',
    async (
      { gameId }: { gameId: string },
      callback: (response: SocketResponse) => void
    ) => {
      try {
        const game = GameManager.getGame(gameId);
        if (game) {
          game.startGame(); // This might throw an error
          io.to(gameId).emit('gameStarted', game.getGameState());
          callback({ success: true });
        } else {
          callback({ success: false, message: 'Game not found' });
        }
      } catch (error: unknown) {
        console.error(`Error in startGame handler:`, error);
        if (error instanceof Error) {
          callback({ success: false, message: error.message });
        } else {
          callback({ success: false, message: 'An unexpected error occurred.' });
        }
      }
    }
  );

  // Event: playerAction
  socket.on(
    'playerAction',
    async (
      { gameId, action, amount }: { gameId: string; action: 'fold' | 'call' | 'raise'; amount: number },
      callback: (response: SocketResponse) => void
    ) => {
      try {
        const game = GameManager.getGame(gameId);
        if (game) {
          game.handlePlayerAction(socket.data.userId, action, amount);
          io.to(gameId).emit('gameUpdate', game.getGameState());
          callback({ success: true });
        } else {
          callback({ success: false, message: 'Game not found' });
        }
      } catch (error: unknown) {
        console.error(`Error in playerAction handler:`, error);
        if (error instanceof Error) {
          callback({ success: false, message: error.message });
        } else {
          callback({ success: false, message: 'An unexpected error occurred.' });
        }
      }
    }
  );

  // Event: disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.data.userId}`);
    // Handle player disconnection logic
  });

  // Global socket error handling
  socket.on('error', (error: Error) => {
    console.error(`Socket Error from ${socket.data.userId}:`, error);
    socket.emit('errorMessage', { message: error.message || 'An error occurred' });
  });
});

function generateUniqueGameId(): string {
  return Math.random().toString(36).substr(2, 9);
}

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
