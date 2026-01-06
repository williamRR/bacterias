const io = require('socket.io-client');

let roomId = '';
let gameStarted = false;

const socket1 = io('http://192.168.1.93:3001');
const socket2 = io('http://192.168.1.93:3001');

socket1.on('connect', () => {
  console.log('Player 1 conectado con ID:', socket1.id);
  socket1.emit('create-room', { playerName: 'Player1' });
});

socket1.on('room-created', (data) => {
  roomId = data.roomId;
  console.log('Sala creada:', roomId);
});

socket2.on('connect', () => {
  console.log('Player 2 conectado con ID:', socket2.id);
});

setTimeout(() => {
  if (roomId) {
    socket2.emit('join-room', { roomId, playerName: 'Player2' });
  }
}, 1000);

socket2.on('room-joined', (data) => {
  console.log('Player 2 unido a la sala:', data);
  console.log('Iniciando juego...');
  socket1.emit('start-game', { roomId });
});

socket1.on('game-started', (data) => {
  console.log('\n=== JUEGO INICIADO ===');
  console.log('GameState:', JSON.stringify(data, null, 2));
  gameStarted = true;
  
  setTimeout(() => {
    console.log('\n=== ESTADO FINAL ===');
    data.gameState.players.forEach((player, index) => {
      console.log(`\nJugador ${index + 1}: ${player.name}`);
      console.log(`  ID: ${player.id}`);
      console.log(`  Cartas en mano: ${player.hand.length}`);
      player.hand.forEach((card, cardIndex) => {
        console.log(`    ${cardIndex + 1}. ${card.type} ${card.color} (id: ${card.id})`);
      });
      console.log(`  Órganos en cuerpo: ${Object.keys(player.body).length} slots`);
      Object.entries(player.body).forEach(([color, slot]) => {
        console.log(`    ${color}: ${slot.organCard ? slot.organCard.type : 'Vacío'}`);
      });
    });
    
    socket1.disconnect();
    socket2.disconnect();
    process.exit(0);
  }, 1000);
});

socket1.on('error', (error) => {
  console.log('Error socket1:', error);
});

socket2.on('error', (error) => {
  console.log('Error socket2:', error);
});

setTimeout(() => {
  if (!gameStarted) {
    console.log('Timeout: El juego no se inició');
    socket1.disconnect();
    socket2.disconnect();
    process.exit(1);
  }
}, 15000);