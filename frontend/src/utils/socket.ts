import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:8080';

export const createSocket = (token: string) => {
  return io(SOCKET_URL, {
    auth: {
      token,
    },
  });
};
