import { Router } from 'express';

import coinInfo from 'coininfo';
import CoinKey from 'coinkey';

import { mongoClient } from '../../DB';

import { DOGE_NETWORK, getUnspentTx, MAIN_WALLET_PUBLIC_KEY } from '../../API';

import { handleSendDogeCoin } from '../../Components/Transactions';

import { v4 as uuid } from 'uuid';

import { createToken } from '../../Auth';

const router = Router();

async function handleCreateWallet(res) {
  const dogeVersions = coinInfo('DOGE-TEST').versions;
  const key = new CoinKey.createRandom(dogeVersions);

  const userId = uuid();

  const token = createToken({ userId, publicAddress: key.publicAddress });

  res.cookie('userToken', token, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'development' ? false : true,
    secure: true,
    sameSite: 'strict'
    // sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none'
  });

  const walletsCollection = mongoClient.db('doge-flip').collection('wallets');

  await walletsCollection.insertOne({
    _id: userId,
    publicAddress: key.publicAddress,
    privateWif: key.privateWif,
    privateHex: key.privateKey.toString('hex'),
    balance: 0,
    network: DOGE_NETWORK,
    userId
  });

  return { publicAddress: key.publicAddress, userId };
}

router.post('/update', async (req, res) => {
  const { displayName } = req.body;
  const { publicAddress } = res.locals.userTokenObject;

  const walletsCollection = mongoClient.db('doge-flip').collection('wallets');
  const wallet = await walletsCollection.findOne({ publicAddress });

  if (!wallet) {
    return res
      .status(400)
      .json({ type: 'error', message: 'Wallet does not exist' });
  }

  if (!displayName || typeof displayName !== 'string') {
    return res
      .status(400)
      .json({ type: 'error', message: 'Invalid parameters' });
  }

  await walletsCollection.findOneAndUpdate(
    { publicAddress },
    { $set: { displayName } }
  );

  res.send({ type: 'ok' });
});

router.get('/', async (req, res) => {
  let { publicAddress } = res.locals.userTokenObject;

  // Generate and save wallet for first time users
  // and sets encrypted jwt cookie in browser
  if (!publicAddress) {
    const data = await handleCreateWallet(res);
    publicAddress = data.publicAddress;
  }

  const walletsCollection = mongoClient.db('doge-flip').collection('wallets');

  const data = await walletsCollection.findOne({ publicAddress });

  res.send({
    type: 'ok',
    data: {
      balance: data.balance,
      displayName: data.displayName,
      network: data.network,
      publicAddress: data.publicAddress,
      userId: data.userId
    }
  });
});

router.post('/sync-wallet', async (req, res) => {
  const { publicAddress } = res.locals.userTokenObject;

  if (!publicAddress) {
    return res
      .status(403)
      .json({ type: 'error', message: 'This wallet does not exist' });
  }

  const walletsCollection = mongoClient.db('doge-flip').collection('wallets');

  const wallet = await walletsCollection.findOne({ publicAddress });

  if (!wallet) {
    return res.send({ type: 'error', message: 'This wallet does not exist' });
  }

  const unspentTx = await getUnspentTx({
    pubAddress: publicAddress,
    network: DOGE_NETWORK
  });

  if (unspentTx.status === 'success' && unspentTx.data.txs.length > 0) {
    let totalUnspentValue = 0;
    unspentTx.data.txs.forEach(
      (element) => (totalUnspentValue += Number(element.value))
    );

    const sendToMainWallet = await handleSendDogeCoin({
      dogeCoinsToSend: totalUnspentValue,
      network: DOGE_NETWORK,
      receiverAddress: MAIN_WALLET_PUBLIC_KEY,
      sourceAddress: wallet.publicAddress,
      privateKey: wallet.privateWif
    });

    if (sendToMainWallet?.status === 'success') {
      const updateWallet = await walletsCollection.findOneAndUpdate(
        {
          publicAddress
        },
        { $inc: { balance: totalUnspentValue } },
        { returnDocument: 'after' }
      );

      return res.send({
        type: 'ok',
        data: {
          balance: updateWallet.value.balance,
          displayName: updateWallet.value.displayName,
          network: updateWallet.value.network,
          publicAddress: updateWallet.value.publicAddress,
          userId: updateWallet.value.userId
        }
      });
    }
  }

  res.send({
    type: 'ok',
    data: {
      balance: wallet.balance,
      displayName: wallet.displayName,
      network: wallet.network,
      publicAddress: wallet.publicAddress,
      userId: wallet.userId
    }
  });
});

export default router;
