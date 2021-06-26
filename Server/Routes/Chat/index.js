import ws from 'ws';

const wsServer = new ws.Server({ noServer: true, path: '/chat' });

wsServer.on('connection', (socket) => {
  socket.on('message', (message) => {
    const parsed = JSON.parse(message);
    switch (parsed.event) {
      case 'chatMessage':
        wsServer.clients.forEach((client) => {
          client.send(message);
        });
        break;
      case 'ping':
        wsServer.clients.forEach((client) => {
          client.send(JSON.stringify({ event: 'pong' }));
        });
        break;
      default:
        console.error('something went wrong');
    }
  });
});

export default wsServer;
