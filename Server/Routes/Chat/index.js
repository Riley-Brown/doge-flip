import ws from 'ws';

const wsServer = new ws.Server({ noServer: true, path: '/chat' });

setInterval(() => {
  wsServer.clients.forEach((client) =>
    client.send(JSON.stringify({ event: 'ping' }))
  );
}, 120000);

wsServer.on('connection', (socket) => {
  socket.on('message', (message) => {
    const parsed = JSON.parse(message);

    if (parsed.event === 'chatMessage') {
      wsServer.clients.forEach((client) => client.send(message));
    }
  });
});

export default wsServer;
