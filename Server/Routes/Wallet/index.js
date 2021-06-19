import { Router } from 'express';

import coinInfo from 'coininfo';
import CoinKey from 'coinkey';

import { mongoClient } from '../../DB';

import { DOGE_NETWORK, getUnspentTx, MAIN_WALLET_PUBLIC_KEY } from '../../API';

import { handleSendDogeCoin } from '../../Components/Transactions';

import { v4 as uuid } from 'uuid';

import { createToken } from '../../Auth';

const router = Router();

function handleCreateUserToken({ userId, publicAddress, res }) {
  const token = createToken({ userId, publicAddress });

  res.cookie('userToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'development' ? false : true,
    sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'None',
    maxAge: 365 * 24 * 60 * 60 * 1000
  });
}

async function handleCreateWallet(res) {
  const dogeVersions = coinInfo('DOGE-TEST').versions;
  const key = new CoinKey.createRandom(dogeVersions);

  const userId = uuid();

  handleCreateUserToken({ userId, publicAddress: key.publicAddress, res });

  const walletsCollection = mongoClient.db('doge-flip').collection('wallets');

  await walletsCollection.insertOne({
    _id: userId,
    publicAddress: key.publicAddress,
    privateWif: key.privateWif,
    privateHex: key.privateKey.toString('hex'),
    balance: 50,
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

  const pendingDeposits = [];

  if (unspentTx.status === 'success' && unspentTx.data.txs.length > 0) {
    let totalUnspentValue = 0;
    unspentTx.data.txs.forEach((element) => {
      // prob would want to make sure there's more than 1 confirmation using real net
      if (element.confirmations > 0) {
        totalUnspentValue += Number(element.value);
      } else {
        pendingDeposits.push({ value: element.value, txId: element.txid });
      }
    });

    if (totalUnspentValue === 0) {
      return res.send({
        type: 'ok',
        data: {
          balance: wallet.balance,
          displayName: wallet.displayName,
          network: wallet.network,
          pendingDeposits,
          publicAddress: wallet.publicAddress,
          userId: wallet.userId
        }
      });
    }

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
          pendingDeposits,
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
      pendingDeposits,
      publicAddress: wallet.publicAddress,
      userId: wallet.userId
    }
  });
});

router.post('/recover', async (req, res) => {
  const { publicAddress, recoveryKey } = req.body;

  if (
    !publicAddress ||
    !recoveryKey ||
    typeof publicAddress !== 'string' ||
    typeof recoveryKey !== 'string'
  ) {
    return res.status(400).json({ type: 'error', message: 'Invalid params' });
  }

  const walletsCollection = mongoClient.db('doge-flip').collection('wallets');
  const wallet = await walletsCollection.findOne({ publicAddress });

  if (!wallet) {
    return res.status(400).json({
      type: 'error',
      message: 'Invalid public address/recovery key combination'
    });
  }

  if (wallet.recoveryKey === recoveryKey) {
    handleCreateUserToken({
      userId: wallet.userId,
      publicAddress: wallet.publicAddress,
      res
    });

    return res.send({
      type: 'ok',
      message: 'Account successfully recovered',
      data: {
        balance: wallet.balance,
        displayName: wallet.displayName,
        network: wallet.network,
        publicAddress: wallet.publicAddress,
        userId: wallet.userId
      }
    });
  }

  return res.status(400).json({
    type: 'error',
    message: 'Invalid public address/recovery key combination'
  });
});

router.get('/recovery-key', async (req, res) => {
  const { publicAddress } = res.locals.userTokenObject;

  if (!publicAddress || typeof publicAddress !== 'string') {
    return res.status(400).json({ type: 'error', message: 'Invalid params' });
  }

  const walletsCollection = mongoClient.db('doge-flip').collection('wallets');
  const wallet = await walletsCollection.findOne({ publicAddress });

  if (!wallet) {
    return res.status(400).json({
      type: 'error',
      message: 'Wallet does not exist'
    });
  }

  if (!wallet.recoveryKey) {
    const recoveryKey = uuid();
    await walletsCollection.findOneAndUpdate(
      { publicAddress },
      { $set: { recoveryKey } },
      { returnDocument: 'after' }
    );

    return res.json({
      type: 'ok',
      data: { recoveryKey }
    });
  } else {
    return res.json({
      type: 'ok',
      data: { recoveryKey: wallet.recoveryKey }
    });
  }
});

router.post('/reset-recovery-key', async (req, res) => {
  const { publicAddress } = res.locals.userTokenObject;

  if (!publicAddress || typeof publicAddress !== 'string') {
    return res.status(400).json({ type: 'error', message: 'Invalid params' });
  }

  const walletsCollection = mongoClient.db('doge-flip').collection('wallets');
  const wallet = await walletsCollection.findOne({ publicAddress });

  if (!wallet) {
    return res.status(400).json({
      type: 'error',
      message: 'Wallet does not exist'
    });
  }

  const recoveryKey = uuid();
  await walletsCollection.findOneAndUpdate(
    { publicAddress },
    { $set: { recoveryKey } },
    { returnDocument: 'after' }
  );

  return res.json({
    type: 'ok',
    data: { recoveryKey }
  });
});

export default router;
