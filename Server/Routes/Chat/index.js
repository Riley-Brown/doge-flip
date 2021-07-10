import redis from 'redis';
import { Server } from 'socket.io';
import { Router } from 'express';
import { v4 as uuid } from 'uuid';

import { corsOrigins } from '../../';

import { handleVerifyAdminToken } from '../../Auth';

const router = Router();

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redisClient = redis.createClient({ url: redisUrl });

// clear existing messages after 5 hours
// redisClient.expire('chatMessages', 18000);

export function initSocketIo(server) {
  const socketIo = new Server(server, {
    path: '/socket/chat',
    cors: {
      origin: corsOrigins,
      credentials: true
    }
  });

  const handleUpdateTotalChatters = (socketIo) => {
    socketIo.allSockets().then((sockets) => {
      const totalChatters = sockets.size;
      redisClient.set('totalChatters', totalChatters);
      redisClient.expire('totalChatters', 10);
      socketIo.emit('totalChatters', totalChatters);
    });
  };

  socketIo.on('connection', (socket) => {
    handleUpdateTotalChatters(socketIo);

    socket.on('chatMessage', (message) => {
      const id = uuid();

      socketIo.emit('chatMessage', { ...message, id });
      redisClient.rpush('chatMessages', JSON.stringify({ ...message, id }));
    });

    socket.on('deleteChatMessage', async (data) => {
      const cookie = socket.handshake?.headers?.cookie;

      if (!cookie) return;

      const isAdmin = await handleVerifyAdminToken(
        cookie.split('userToken=')[1]
      );

      if (!isAdmin) {
        return;
      }

      redisClient.lrange('chatMessages', 0, -1, (err, messages) => {
        const parsedMessages = messages.map((message) => JSON.parse(message));

        let messageIndex = -1;

        const filteredMessages = parsedMessages.filter((message, index) => {
          if (message.id === data.id) {
            messageIndex = index;
            return false;
          }

          return true;
        });

        if (messageIndex > -1) {
          redisClient.lset('chatMessages', messageIndex, 'deleted');
          redisClient.lrem('chatMessages', 1, 'deleted');

          socket.emit('messageDeleted', filteredMessages);
        }
      });
    });

    socket.on('disconnect', () => {
      handleUpdateTotalChatters(socketIo);
    });
  });
}

router.get('/total-chatters', async (req, res) => {
  redisClient.get('totalChatters', (err, totalChatters) => {
    res.send({ type: 'ok', data: { totalChatters: Number(totalChatters) } });
  });
});

router.get('/chat-messages', (req, res) => {
  redisClient.lrange('chatMessages', 0, -1, (err, messages) => {
    res.send({
      type: 'ok',
      data: { messages: messages.map((message) => JSON.parse(message)) }
    });
  });
});

export default router;
