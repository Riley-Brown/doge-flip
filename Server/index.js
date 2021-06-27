import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';

import Wallet from './Routes/Wallet';
import Transactions from './Routes/Transactions';
import CoinFlips from './Routes/CoinFlips';

import { requireUserAuth } from './Middleware/authMiddleware';

const corsOptions = {
  credentials: true,
  origin: [
    'http://localhost:3000',
    'https://competent-shannon-ea4b21.netlify.app',
    'https://doge-flip.riley.gg'
  ]
};

const PORT = process.env.PORT || 9999;

const app = express();
const server = app.listen(PORT);

export const io = new Server(server, {
  path: '/chat',
  cors: {
    origin: [
      'http://localhost:3000',
      'https://competent-shannon-ea4b21.netlify.app',
      'https://doge-flip.riley.gg'
    ]
  }
});

io.on('connection', (socket) => {
  socket.on('chatMessage', (message) => {
    io.emit('chatMessage', message);
  });
});

app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(cookieParser());

app.use('/wallet', requireUserAuth, Wallet);
app.use('/transactions', requireUserAuth, Transactions);
app.use('/coin-flips', CoinFlips);

export default app;
