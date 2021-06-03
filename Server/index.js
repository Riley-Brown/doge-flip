import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import Wallet from './Routes/Wallet';
import Transactions from './Routes/Transactions';
import CoinFlips from './Routes/CoinFlips';

import { setUserCookie } from './Middleware/authMiddleware';

const corsOptions = {
  credentials: true,
  origin: [
    'http://localhost:3000',
    'https://competent-shannon-ea4b21.netlify.app'
  ]
};

const server = express();
server.use(express.json());
server.use(cors(corsOptions));
server.use(morgan('dev'));
server.use(cookieParser());

server.use('/wallet', setUserCookie, Wallet);
server.use('/transactions', Transactions);
server.use('/coin-flips', CoinFlips);

const port = process.env.PORT || 9999;

server.listen(port, () => `Server listening on port ${port}`);

export default server;
