import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  timeout: 5000,
  reconnection: false,
  forceNew: true,
});

const done = (ok, message) => {
  console.log(JSON.stringify({ ok, message }));
  socket.disconnect();
  process.exit(ok ? 0 : 1);
};

socket.on('connect', () => {
  console.log('CONNECTED', socket.id);
  socket.emit('join-room', 'room-demo');
  socket.emit('chat:ping', { room: 'room-demo', text: 'hello from socket test' });

  setTimeout(() => {
    done(true, 'socket connected and room events accepted');
  }, 300);
});

socket.on('connect_error', (error) => {
  done(false, String(error));
});

socket.on('disconnect', () => {
  console.log('DISCONNECTED');
});
