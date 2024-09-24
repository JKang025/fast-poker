const io = require('socket.io-client');

// Token for the first connection
const token1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZjI2MGY1MjJmZWI4ZjYxM2FhZWNiMCIsImlhdCI6MTcyNzE2MDU2NSwiZXhwIjoxNzI3MjQ2OTY1fQ.z0VhoLqe8IavbLLDdyL5RupXSPgBekRqyrTT0AgxJWw"; 

// Token for the second connection
const token2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZjI2MTA4MjJmZWI4ZjYxM2FhZWNiMSIsImlhdCI6MTcyNzE2MDU4NSwiZXhwIjoxNzI3MjQ2OTg1fQ.MIcy1hexjLcWahCofJz6MkKNPRQ_yFV6qyt-D0pJM2k"; 

// Helper function to wrap socket events in a promise for sequential control
function socketPromise(socket, event, data = {}) {
  return new Promise((resolve) => {
    socket.emit(event, data, (response) => {
      resolve(response);
    });
  });
}

// Function to handle the flow of socket connections
async function handleSocketConnections() {
  // First socket connection
  const socket1 = io('http://localhost:8080', {
    auth: { token: token1 }
  });

  // Wait for the first socket to connect
  await new Promise((resolve) => socket1.on('connect', resolve));
  console.log('Connected to server with socket1');

  // Example: Create game with socket1
  const createGameResponse1 = await socketPromise(socket1, 'createGame');
  console.log('Socket1 Create Game Response:', createGameResponse1);
  const gameId1 = createGameResponse1.gameId;

  // Example: Join game with socket1
  const joinResponse1 = await socketPromise(socket1, 'joinGame', { gameId: gameId1, username: 'test_user1' });
  console.log('Socket1 Join Game Response:', joinResponse1);

  // Example: Start game with socket2
  const startResponse1 = await socketPromise(socket1, 'startGame', { gameId: gameId1 });
  console.log('Socket2 Start Game Response:', startResponse1);

  // After socket1 completes, handle socket2

  // Second socket connection
  const socket2 = io('http://localhost:8080', {
    auth: { token: token2 }
  });

  // Wait for the second socket to connect
  await new Promise((resolve) => socket2.on('connect', resolve));
  console.log('Connected to server with socket2');

  // Example: Join game with socket2
  const joinResponse2 = await socketPromise(socket2, 'joinGame', { gameId: gameId1, username: 'test_user2' });
  console.log('Socket2 Join Game Response:', joinResponse2);

  // Example: Start game with socket2
  const startResponse2 = await socketPromise(socket2, 'startGame', { gameId: gameId1 });
  console.log('Socket2 Start Game Response:', startResponse2);

  // Optionally disconnect the sockets after the actions are completed
  socket1.disconnect();
  socket2.disconnect();
}

handleSocketConnections().catch(console.error);
