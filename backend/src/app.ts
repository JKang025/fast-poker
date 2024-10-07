// src/app.ts
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import routes from './routes';
import jwt from 'jsonwebtoken';
import { GameManager } from './game/GameManager';
import { Player } from './game/models/Player';
import { SocketResponse } from './utils/SocketResponse';
import * as dotenv from 'dotenv';
dotenv.config();

const SECRETKEY: string = process.env.SECRETKEY || 'defaultSecretKey';

const cors = require('cors');

const app = express();
const PORT = 8080;

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from your frontend
  methods: ['GET', 'POST'],        // Specify allowed HTTP methods
  credentials: true,               // If you're using cookies or authentication
}));

app.use('/api', routes);



const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Replace with your frontend origin
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
  socket.on(
    'createGame',
    async (
      data: { /* any additional data if needed */ },
      callback: (response: SocketResponse) => void
    ) => {
      try {
        // Generate a unique game ID and create the game
        const gameId = generateUniqueGameId();
        GameManager.createGame(gameId);

        console.log(`Game created with ID: ${gameId}`);

        // Send a success response back to the creator with the game ID
        callback({ success: true, gameId });
      } catch (error: unknown) {
        console.error(`Error in createGame handler:`, error);
        if (error instanceof Error) {
          callback({ success: false, message: error.message });
        } else {
          callback({ success: false, message: 'An unexpected error occurred.' });
        }
      }
    }
  );

  // Event: joinGame
  socket.on(
    'joinGame',
    async (
      { gameId, username }: { gameId: string; username: string },
      callback: (response: SocketResponse) => void
    ) => {
      try {
        console.log("why running!!")
        if (!username) {
          return callback({ success: false, message: 'Username is required to join a game.' });
        }

        const game = GameManager.getGame(gameId);
        if (!game) {
          return callback({ success: false, message: 'Game not found.' });
        }

        // Create a new player and add to the game
        const player = new Player(socket.data.userId, username, 1000); // Starting chips
        GameManager.addPlayerToGame(gameId, player);

        // Join the socket to the game room
        socket.join(gameId);

        // Notify all clients in the game room that a new player has joined
        const players = game.getPlayers().map((p: Player) => ({
          playerId: p.id,
          username: p.username,
        }));

        console.log(`Player ${username} joined game ${gameId}`);
        console.log(players);

        io.to(gameId).emit('playerJoined', { players });

        // Send a success response with the updated players list
        callback({ success: true, players });
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
    //TODO remove users when disconnected
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
