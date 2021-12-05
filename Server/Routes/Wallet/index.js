import { Router } from 'express';
import { v4 as uuid } from 'uuid';

import { getWalletsCollection } from '../../DB';
import { getUnspentTx, MAIN_WALLET_PUBLIC_KEY } from '../../API';

import { handleSendDogeCoin } from '../../Components/Transactions';

import {
  requireUserAuth,
  setUserTokenFromCookie
} from '../../Middleware/authMiddleware';

import { RecoverWalletValidator } from '../../Middleware/Validators/Wallet';

import {
  handlePendingDeposits,
  handleCreateWallet
} from '../../Components/Wallet';

import { handleCreateUserToken } from '../../Auth';

const router = Router();

router.post('/update', requireUserAuth, async (req, res) => {
  const { displayName } = req.body;
  const { publicAddress } = res.locals.userTokenObject;

  const walletsCollection = getWalletsCollection();
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

router.get('/', setUserTokenFromCookie, async (req, res) => {
  let { publicAddress } = res.locals.userTokenObject;

  // Generate and save wallet for first time users
  // and sets encrypted jwt cookie in browser
  if (!publicAddress) {
    const data = await handleCreateWallet(res);
    publicAddress = data.publicAddress;
  }

  const walletsCollection = getWalletsCollection();
  const data = await walletsCollection.findOne({ publicAddress });

  res.send({
    type: 'ok',
    data: {
      balance: data.balance,
      displayName: data.displayName,
      isAdmin: data.isAdmin,
      network: data.network,
      publicAddress: data.publicAddress,
      userId: data.userId
    }
  });
});

router.post('/sync-wallet', requireUserAuth, async (req, res) => {
  const { publicAddress } = res.locals.userTokenObject;

  const walletsCollection = getWalletsCollection();
  const wallet = await walletsCollection.findOne({ publicAddress });

  if (!wallet) {
    return res.send({ type: 'error', message: 'This wallet does not exist' });
  }

  const unspentTx = await getUnspentTx({
    pubAddress: publicAddress
  });

  if (unspentTx.status === 'success' && unspentTx.data.txs.length > 0) {
    const { totalUnspentValue, pendingDeposits } =
      handlePendingDeposits(unspentTx);

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
      receiverAddress: MAIN_WALLET_PUBLIC_KEY,
      sourceAddress: wallet.publicAddress,
      privateKey: wallet.privateWif
    });

    if (sendToMainWallet?.status === 'success') {
      const updateWallet = await walletsCollection.findOneAndUpdate(
        { publicAddress },
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
      pendingDeposits: [],
      publicAddress: wallet.publicAddress,
      userId: wallet.userId
    }
  });
});

router.post('/recover', RecoverWalletValidator, async (req, res) => {
  const { publicAddress, recoveryKey } = req.body;

  const walletsCollection = getWalletsCollection();
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

  const walletsCollection = getWalletsCollection();
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

  const walletsCollection = getWalletsCollection();
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
