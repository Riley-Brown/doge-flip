import { Router } from 'express';
import { mongoClient, ObjectId } from '../../DB';

import Provable from 'provable';

import Queue from 'bull';

import EventEmitter from 'events';

const coinFlipEvents = new EventEmitter();

const router = Router();

function generateRandomNumber() {
  const engine = Provable({
    count: 10000 //default:1, number of hashes in the series to produce, takes longer depending on how big the number is
  });

  const int32 = engine();
  const hash = engine.next();

  const float = Provable.toFloat(hash, 0, 1, true); //hash, min, max, true = include max | false = exclude max
  const int = Provable.toInt(hash); //same as int32 from engine()
  const bool = Provable.toBool(hash, 0.5); //hash, percent true, .5 = 50%

  return { float, hash, int, bool };
}

router.post('/create', async (req, res) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const { userId, dogeAmount, side } = req.body;

    if (
      !userId ||
      typeof userId !== 'string' ||
      !dogeAmount ||
      typeof dogeAmount !== 'number' ||
      !side ||
      (side !== 'heads' && side !== 'tails')
    ) {
      return res
        .status(400)
        .json({ type: 'error', message: 'Invalid parameters' });
    }

    const activeCoinFlipsCollection = mongoClient
      .db('doge-flip')
      .collection('active-coin-flips');

    const walletsCollection = mongoClient.db('doge-flip').collection('wallets');

    const userWallet = await walletsCollection.findOne({ _id: userId });

    console.log(userWallet);

    if (!userWallet) {
      return res
        .status(400)
        .json({ type: 'error', message: 'Wallet for user id does not exist' });
    }

    if (userWallet.balance < dogeAmount) {
      return res.status(400).json({
        type: 'error',
        message: 'Doge amount cannot be greater than current balance'
      });
    }

    const coinFlipData = {
      createdAt: timestamp,
      createdByUserId: userId,
      creatorSide: side,
      dogeAmount,
      status: 'active'
    };

    const updatedWallet = await walletsCollection.findOneAndUpdate(
      { _id: userId },
      { $inc: { balance: -dogeAmount } },
      { returnDocument: 'after' }
    );

    console.log(updatedWallet);

    await activeCoinFlipsCollection.insertOne(coinFlipData);

    res.send({
      type: 'ok',
      message: 'Successfully created coin flip',
      data: { coinFlipData, balance: updatedWallet.value.balance }
    });
  } catch (err) {
    console.log(err);
  }
});

router.get('/active', async (req, res) => {
  const activeCoinFlipsCollection = mongoClient
    .db('doge-flip')
    .collection('active-coin-flips');

  const activeCoinFlips = await activeCoinFlipsCollection.find({}).toArray();

  res.send({ type: 'ok', data: activeCoinFlips });
});

router.post('/join', async (req, res) => {
  const { coinFlipId, userId } = req.body;

  if (
    !coinFlipId ||
    !userId ||
    typeof coinFlipId !== 'string' ||
    typeof userId !== 'string'
  ) {
    return res
      .status(400)
      .json({ type: 'error', message: 'Invalid parameters' });
  }

  const activeCoinFlipsCollection = mongoClient
    .db('doge-flip')
    .collection('active-coin-flips');

  const activeCoinFlip = await activeCoinFlipsCollection.findOne({
    _id: ObjectId(coinFlipId)
  });

  if (!activeCoinFlip) {
    return res
      .status(400)
      .json({ type: 'error', message: 'Coin flip does not exist' });
  }

  if (activeCoinFlip.status !== 'active') {
    return res.status(400).json({
      type: 'error',
      message: 'Coin flip is in progress or has already ended'
    });
  }

  const walletsCollection = mongoClient.db('doge-flip').collection('wallets');

  const wallet = await walletsCollection.findOne({ _id: userId });

  if (!wallet) {
    return res
      .status(400)
      .json({ type: 'error', message: 'User ID does not exist' });
  }

  if (wallet.balance < activeCoinFlip.dogeAmount) {
    return res.status(400).json({
      type: 'error',
      message: 'Insufficient balance to join this coin flip'
    });
  }

  const updatedWallet = await walletsCollection.findOneAndUpdate(
    { _id: userId },
    { $inc: { balance: -activeCoinFlip.dogeAmount } },
    { returnDocument: 'after' }
  );

  console.log(updatedWallet);

  const joinDate = Math.floor(Date.now() / 1000);
  const side = activeCoinFlip.creatorSide === 'heads' ? 'tails' : 'heads';

  const updatedCoinFlip = await activeCoinFlipsCollection.findOneAndUpdate(
    { _id: ObjectId(coinFlipId) },
    {
      $set: {
        status: 'inProgress',
        joinedByUserId: userId,
        joinedByUserAt: joinDate,
        joinedUserSide: side
      }
    },
    { returnDocument: 'after' }
  );

  let countDown = 5;
  const coinFlipData = { ...updatedCoinFlip.value, startingIn: countDown };

  const handleWinner = async () => {
    console.log('handling winner');
    try {
      const { int, bool, float, hash } = generateRandomNumber();
      const winningSide = float < 0.5 ? 'heads' : 'tails';
      let winnerId;
      const winningAmount = activeCoinFlip.dogeAmount * 2;

      if (activeCoinFlip.creatorSide === winningSide) {
        winnerId = activeCoinFlip.createdByUserId;
      } else if (activeCoinFlip.joinedUserSide === winningSide) {
        winnerId = activeCoinFlip.joinedByUserId;
      }

      const finishedCoinFlip = await activeCoinFlipsCollection.findOneAndUpdate(
        { _id: ObjectId(coinFlipId) },
        {
          $set: {
            status: 'finished',
            winningSide,
            winnerId,
            float,
            hash,
            winningAmount
          }
        },
        { returnDocument: 'after' }
      );

      await walletsCollection.findOneAndUpdate(
        { _id: winnerId },
        { $inc: { balance: activeCoinFlip.dogeAmount * 2 } }
      );

      coinFlipEvents.emit('finished', {
        ...finishedCoinFlip.value,
        startingIn: countDown,
        winningSide,
        winnerId,
        winningAmount
      });
    } catch (err) {
      console.log(err);
    }
  };

  let interval = setInterval(async () => {
    if (countDown === 0) {
      clearInterval(interval);
      handleWinner();
    } else {
      countDown--;

      coinFlipEvents.emit('inProgress', {
        ...coinFlipData,
        startingIn: countDown
      });
    }
  }, 1000);

  coinFlipEvents.emit('inProgress', coinFlipData);

  res.send({
    type: 'ok',
    data: {
      balance: updatedWallet.value.balance,
      coinFlipData: updatedCoinFlip.value
    }
  });
});

router.get('/events', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE with client

  coinFlipEvents.addListener('inProgress', (coinFlipData) => {
    console.log({ inProgressEvent: coinFlipData });
    res.write(
      `data: ${JSON.stringify({
        eventType: 'inProgress',
        ...coinFlipData
      })}\n\n`
    );
  });

  coinFlipEvents.addListener('finished', (coinFlipData) => {
    console.log({ finishedEvent: coinFlipData });
    res.write(
      `data: ${JSON.stringify({
        eventType: 'finished',
        ...coinFlipData
      })}\n\n`
    );
  });

  res.on('close', () => {
    coinFlipEvents.removeAllListeners();
    res.end();
  });
});

export default router;
