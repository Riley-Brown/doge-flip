import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import Wallet from './Routes/Wallet';
import Transactions from './Routes/Transactions';
import CoinFlips from './Routes/CoinFlips';

import { mongoClient } from './DB';

const server = express();
server.use(express.json());
server.use(cors());
server.use(morgan('dev'));

server.use('/wallet', Wallet);
server.use('/transactions', Transactions);
server.use('/coin-flips', CoinFlips);

const port = process.env.PORT || 9999;

server.listen(port, () => `Server listening on port ${port}`);

export default server;
