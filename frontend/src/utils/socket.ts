// src/utils/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:8080';

let socket: Socket | null = null;

/**
 * Initializes and returns the singleton socket instance.
 * If the socket is already initialized, it returns the existing instance.
 * @param token - The authentication token
 * @returns Socket instance
 */
export const getSocket = (token: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      autoConnect: true, // Automatically establish the connection
    });

    // Optional: Add event listeners for debugging or handling specific events
    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
};

/**
 * Disconnects the singleton socket instance.
 * Call this when you want to manually disconnect (e.g., on logout).
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
