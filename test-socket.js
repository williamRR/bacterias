const io = require('socket.io-client');

console.log('Conectando al servidor...');
const socket = io('http://192.168.1.93:3001');

socket.on('connect', () => {
  console.log('Conectado con ID:', socket.id);
  
  // Unirse a la sala
  socket.emit('join-room', { roomId: 'S5D6DF', playerName: 'TestBot' });
});

socket.on('room-joined', (data) => {
  console.log('Unido a la sala:', data);
  
  // Iniciar el juego
  setTimeout(() => {
    console.log('Iniciando juego...');
    socket.emit('start-game', { roomId: 'S5D6DF' });
  }, 1000);
});

socket.on('game-started', (data) => {
  console.log('Juego iniciado!');
  console.log('GameState:', JSON.stringify(data, null, 2));
  
  const players = data.gameState.players;
  players.forEach((player, index) => {
    console.log(`\nJugador ${index + 1}: ${player.name}`);
    console.log(`  Cartas en mano: ${player.hand.length}`);
    console.log(`  Cartas:`, player.hand.map(c => `${c.type} ${c.color}`));
    console.log(`  Órganos en cuerpo: ${Array.from(player.body.entries()).length} slots`);
  });
});

socket.on('game-state', (data) => {
  console.log('GameState actualizado:', JSON.stringify(data, null, 2));
});

socket.on('error', (error) => {
  console.log('Error:', error);
});

socket.on('disconnect', () => {
  console.log('Desconectado');
  process.exit(0);
});

// Desconectar después de 10 segundos
setTimeout(() => {
  socket.disconnect();
}, 10000);