const io = require('socket.io-client');

console.log('Conectando al servidor...');
const socket = io('http://192.168.1.93:3001');

socket.on('connect', () => {
  console.log('Conectado con ID:', socket.id);
  
  // Crear una sala
  socket.emit('create-room', { playerName: 'TestBot' });
});

socket.on('room-created', (data) => {
  console.log('Sala creada:', data);
  roomId = data.roomId;
  
  // Unir un segundo jugador
  setTimeout(() => {
    const socket2 = io('http://192.168.1.93:3001');
    socket2.on('connect', () => {
      console.log('Jugador 2 conectado con ID:', socket2.id);
      socket2.emit('join-room', { roomId, playerName: 'TestBot2' });
    });
    
    socket2.on('room-joined', (data) => {
      console.log('Jugador 2 unido a la sala:', data);
      
      // Iniciar el juego con el primer socket
      setTimeout(() => {
        console.log('Iniciando juego...');
        socket.emit('start-game', { roomId });
      }, 500);
    });
    
    socket2.on('game-started', (data) => {
      console.log('\n=== JUEGO INICIADO ===');
      console.log('GameState:', JSON.stringify(data.gameState, null, 2));
      socket2.disconnect();
      socket.disconnect();
      process.exit(0);
    });
  }, 500);
});

socket.on('error', (error) => {
  console.log('Error:', error);
});

socket.on('disconnect', () => {
  console.log('Desconectado');
});