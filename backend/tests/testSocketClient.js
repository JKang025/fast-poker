const io = require('socket.io-client');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZjI1YmJjNjQ3OTE4MjA3NDQ5ZGZjMyIsImlhdCI6MTcyNzE1OTI0MSwiZXhwIjoxNzI3MjQ1NjQxfQ.uznHEkRdcwyqUTIlVtCZm0wM5WuS8Em1rZ-ToGUDhS4"; // Replace with the actual token

const socket = io('http://localhost:8080', {
  auth: {
    token: token
  }
});

// Event listeners
socket.on('connect', () => {
  console.log('Connected to server');
  
  // Example: Create a game
  socket.emit('createGame', (response) => {
    console.log('Create Game Response:', response);
    const gameId = response.gameId;

    // Example: Join the created game
    socket.emit('joinGame', { gameId: gameId, username: 'test_user' }, (joinResponse) => {
      console.log('Join Game Response:', joinResponse);

      // Example: Start the game
      socket.emit('startGame', { gameId: gameId }, (startResponse) => {
        console.log('Start Game Response:', startResponse);

        // Example: Player Action
        socket.emit('playerAction', { gameId: gameId, action: 'bet', amount: 100 }, (actionResponse) => {
          console.log('Player Action Response:', actionResponse);

          // Disconnect after testing
          socket.disconnect();
        });
      });
    });
  });
});
