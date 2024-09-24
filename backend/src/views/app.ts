import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import routes from '../routes';
import jwt from 'jsonwebtoken';
import { SECRETKEY } from '../utils/auth';
import { GameManager } from '../game/GameManager';
import { Player } from '../game/models/Player';

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
io.use((socket, next) => {
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

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.data.userId}`);

  socket.on('createGame', (callback) => {
    const gameId = generateUniqueGameId();
    GameManager.createGame(gameId);
    callback({ gameId });
  });

  socket.on('joinGame', ({ gameId, username }, callback) => {
    try {
      const player = new Player(socket.data.userId, username, 1000); // Starting chips
      GameManager.addPlayerToGame(gameId, player);
      socket.join(gameId);
      io.to(gameId).emit('playerJoined', { playerId: player.id, username: player.username });
      callback({ success: true });
    } catch (error: any) {
      callback({ success: false, message: error.message });
    }
  });

  socket.on('startGame', ({ gameId }, callback) => {
    const game = GameManager.getGame(gameId);
    if (game) {
      game.startGame();
      io.to(gameId).emit('gameStarted', game.getGameState());
      callback({ success: true });
    } else {
      callback({ success: false, message: 'Game not found' });
    }
  });

  socket.on('playerAction', ({ gameId, action, amount }, callback) => {
    const game = GameManager.getGame(gameId);
    if (game) {
      try {
        game.handlePlayerAction(socket.data.userId, action, amount);
        io.to(gameId).emit('gameUpdate', game.getGameState());
        callback({ success: true });
      } catch (error: any) {
        callback({ success: false, message: error.message });
      }
    } else {
      callback({ success: false, message: 'Game not found' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.data.userId}`);
    // Handle player disconnection logic
  });
});

function generateUniqueGameId(): string {
  return Math.random().toString(36).substr(2, 9);
}

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
