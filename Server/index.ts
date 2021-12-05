import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import Wallet from 'Routes/Wallet';
import Transactions from 'Routes/Transactions';
import CoinFlips from 'Routes/CoinFlips';
import Chat, { initSocketIo } from 'Routes/Chat';

import { requireUserAuth } from 'Middleware/authMiddleware';

export const corsOrigins = [
  'http://localhost:3000',
  'https://competent-shannon-ea4b21.netlify.app',
  'https://doge-flip.riley.gg',
];

const corsOptions = {
  credentials: true,
  origin: corsOrigins,
};

const PORT = process.env.PORT || 9999;

const app = express();

export const server = app.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);
});

initSocketIo(server);

app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(cookieParser());

app.use('/wallet', Wallet);
app.use('/transactions', requireUserAuth, Transactions);
app.use('/coin-flips', CoinFlips);
app.use('/chat', Chat);

export default app;
