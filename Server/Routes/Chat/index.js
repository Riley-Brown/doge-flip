import { handleVerifyToken } from '../../Middleware/authMiddleware';
import ws from 'ws';

const wsServer = new ws.Server({ noServer: true, path: '/chat' });

wsServer.on('connection', async (client, req) => {
  const userToken = req.headers?.cookie?.split('userToken=');

  if (!userToken?.length || !userToken[1]) {
    client.close();
    return;
  }

  const decodedToken = await handleVerifyToken(userToken[1]);

  client.id = decodedToken.userId;

  client.on('message', (message) => {
    const parsed = JSON.parse(message);

    if (parsed.event === 'chatMessage') {
      wsServer.clients.forEach((client) => client.send(message));
    }

    if (parsed.event === 'ping') {
      wsServer.clients.forEach((client) => {
        if (client.id === parsed.data.userId) {
          client.send(JSON.stringify({ event: 'pong' }));
        }
      });
    }
  });

  client.send(JSON.stringify({ event: 'chatInitialized' }));
});

export default wsServer;
