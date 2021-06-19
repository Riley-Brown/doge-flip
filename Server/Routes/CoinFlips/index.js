import { Router } from 'express';
import Provable from 'provable';
import EventEmitter from 'events';

import { mongoClient, ObjectId } from '../../DB';

import { requireUserAuth } from '../../Middleware/authMiddleware';

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

router.post('/create', requireUserAuth, async (req, res) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const { dogeAmount, side } = req.body;

    const { userId } = res.locals.userTokenObject;

    if (
      !userId ||
      typeof userId !== 'string' ||
      !dogeAmount ||
      typeof dogeAmount !== 'number' ||
      dogeAmount < 0 ||
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

    if (!userWallet) {
      return res
        .status(400)
        .json({ type: 'error', message: 'Wallet for user id does not exist' });
    }

    if (userWallet.balance < dogeAmount) {
      return res.status(400).json({
        type: 'balanceError',
        message: 'Doge amount cannot be greater than current balance'
      });
    }

    const coinFlipData = {
      createdByDisplayName: userWallet.displayName,
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

    await activeCoinFlipsCollection.insertOne(coinFlipData);

    coinFlipEvents.emit('coinFlipCreated', coinFlipData);

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
  try {
    const activeCoinFlipsCollection = mongoClient
      .db('doge-flip')
      .collection('active-coin-flips');

    const activeCoinFlips = await activeCoinFlipsCollection.find({}).toArray();

    res.send({ type: 'ok', data: activeCoinFlips });
  } catch (err) {
    console.log(err);
  }
});

router.post('/join', requireUserAuth, async (req, res) => {
  const { coinFlipId } = req.body;
  const { userId } = res.locals.userTokenObject;

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

  const joinDate = Math.floor(Date.now() / 1000);
  const side = activeCoinFlip.creatorSide === 'heads' ? 'tails' : 'heads';

  const updatedCoinFlip = await activeCoinFlipsCollection.findOneAndUpdate(
    { _id: ObjectId(coinFlipId) },
    {
      $set: {
        status: 'inProgress',
        joinedByUserId: userId,
        joinedByDisplayName: wallet.displayName,
        joinedByUserAt: joinDate,
        joinedUserSide: side
      }
    },
    { returnDocument: 'after' }
  );

  let countDown = 5;
  const coinFlipData = { ...updatedCoinFlip.value, startingIn: countDown };

  const handleWinner = async () => {
    try {
      const { int, bool, float, hash } = generateRandomNumber();
      const winningSide = float < 0.5 ? 'heads' : 'tails';
      let winnerId;
      let winnerDisplayName;
      const winningAmount = coinFlipData.dogeAmount * 2;

      coinFlipEvents.emit('flipping', {
        ...coinFlipData,
        winningSide,
        status: 'flipping'
      });

      await new Promise((res) => {
        console.log('waiting 4 seconds for flipping animation');

        setTimeout(() => {
          res();
        }, 4000);
      });

      if (coinFlipData.creatorSide === winningSide) {
        winnerId = coinFlipData.createdByUserId;
        winnerDisplayName = coinFlipData.createdByDisplayName;
      } else if (coinFlipData.joinedUserSide === winningSide) {
        winnerId = coinFlipData.joinedByUserId;
        winnerDisplayName = coinFlipData.joinedByDisplayName;
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
            winningAmount,
            winnerDisplayName
          }
        },
        { returnDocument: 'after' }
      );

      await walletsCollection.findOneAndUpdate(
        { _id: winnerId },
        { $inc: { balance: coinFlipData.dogeAmount * 2 } }
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

  const handleSendEvent = (eventType, data) => {
    if (res.writableEnded) {
      return;
    }

    return res.write(
      `data: ${JSON.stringify({
        eventType,
        ...data
      })}\n\n`
    );
  };

  const events = [
    { eventType: 'inProgress' },
    { eventType: 'flipping' },
    { eventType: 'finished' },
    { eventType: 'coinFlipCreated' }
  ];

  events.forEach((event) =>
    coinFlipEvents.addListener(event.eventType, (coinFlipData) => {
      handleSendEvent(event.eventType, coinFlipData);
    })
  );

  res.on('close', () => {
    events.forEach((event) =>
      coinFlipEvents.removeListener(event.eventType, handleSendEvent)
    );
    res.end();
  });
});

export default router;
