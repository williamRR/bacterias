const io = require('socket.io-client');

console.log('Creando sala...');
const socket = io('http://192.168.1.93:3001');

socket.on('connect', () => {
  console.log('Conectado con ID:', socket.id);
  socket.emit('create-room', { playerName: 'TestBot' });
});

socket.on('room-created', (data) => {
  console.log('Sala creada:', data);
});

socket.on('error', (error) => {
  console.log('Error:', error);
});

socket.on('disconnect', () => {
  console.log('Desconectado');
  process.exit(0);
});

setTimeout(() => {
  socket.disconnect();
}, 5000);