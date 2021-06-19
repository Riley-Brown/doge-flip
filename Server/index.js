import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

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

const server = express();
server.use(express.json());
server.use(cors(corsOptions));
server.use(morgan('dev'));
server.use(cookieParser());

server.use('/wallet', requireUserAuth, Wallet);
server.use('/transactions', requireUserAuth, Transactions);
server.use('/coin-flips', CoinFlips);

const port = process.env.PORT || 9999;

server.listen(port, () => `Server listening on port ${port}`);

export default server;
