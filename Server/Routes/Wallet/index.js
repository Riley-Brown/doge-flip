import { Router } from 'express';

import coinInfo from 'coininfo';
import CoinKey from 'coinkey';

import { mongoClient } from '../../DB';

import { DOGE_NETWORK, getUnspentTx, MAIN_WALLET_PUBLIC_KEY } from '../../API';

import { handleSendDogeCoin } from '../../Components/Transactions';

import { v4 as uuid } from 'uuid';

const router = Router();

router.get('/create', async (req, res) => {
  const dogeVersions = coinInfo('DOGE-TEST').versions;
  const key = new CoinKey.createRandom(dogeVersions);

  const userId = uuid();

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

  res.send({ type: 'ok', data: { publicAddress: key.publicAddress, userId } });
});

router.post('/update', async (req, res) => {
  const { publicAddress, displayName } = req.body;

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

router.post('/', async (req, res) => {
  const walletsCollection = mongoClient.db('doge-flip').collection('wallets');

  const data = await walletsCollection.findOne({
    publicAddress: req.body.publicAddress
  });

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
  const { publicAddress } = req.body;

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
