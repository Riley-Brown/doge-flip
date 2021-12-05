import { getWalletsCollection } from 'DB';

import { Router } from 'express';
import {
  getBalance,
  MAIN_WALLET_PRIVATE_KEY,
  MAIN_WALLET_PUBLIC_KEY,
} from 'API';

import { handleSendDogeCoin } from 'Components/Transactions';

const router = Router();

router.post('/withdraw', async (req, res) => {
  const { receiverAddress, dogeCoinsToSend } = req.body;
  const { userId } = res.locals.userTokenObject;

  if (
    !receiverAddress ||
    typeof receiverAddress !== 'string' ||
    !dogeCoinsToSend ||
    typeof dogeCoinsToSend !== 'number'
  ) {
    return res.status(400).json({ type: 'error', message: 'Invalid params' });
  }

  if (dogeCoinsToSend < 2) {
    return res.status(400).json({
      type: 'error',
      message: 'Doge amount is not enough to cover transaction fee',
    });
  }

  try {
    const walletsCollection = getWalletsCollection();
    const userWallet = await walletsCollection.findOne({ _id: userId });

    if (!userWallet) {
      return res.status(400).json({ type: 'error', message: 'Invalid wallet' });
    }

    if (dogeCoinsToSend > userWallet.balance) {
      return res.status(400).json({
        type: 'error',
        message: 'Withdraw amount is greater than balance',
      });
    }

    // make sure receiver address exists
    const receiverAddressExists = await getBalance(receiverAddress);

    if (receiverAddressExists.status === 'fail') {
      return res
        .status(400)
        .json({ type: 'error', message: 'Withdraw address does not exist' });
    }

    const mainWallet = await getBalance(MAIN_WALLET_PUBLIC_KEY);

    const mainWalletBalance = Number(mainWallet.data.confirmed_balance);

    if (dogeCoinsToSend > mainWalletBalance) {
      return res
        .status(400)
        .send({ type: 'error', message: 'Sorry you are too rich for us :(' });
    }

    const send = await handleSendDogeCoin({
      dogeCoinsToSend,
      receiverAddress,
      privateKey: MAIN_WALLET_PRIVATE_KEY,
      sourceAddress: MAIN_WALLET_PUBLIC_KEY,
    });

    if (send?.status === 'success') {
      const updatedUser = await walletsCollection.findOneAndUpdate(
        { _id: userId },
        { $inc: { balance: -dogeCoinsToSend } },
        { returnDocument: 'after' }
      );

      return res.send({
        type: 'ok',
        message: `Successfully withdrew ${dogeCoinsToSend} doge coins`,
        data: { balance: updatedUser.value?.balance },
      });
    }

    return res
      .status(400)
      .json({ type: 'error', message: 'Whoops something went wrong' });
  } catch (err) {
    console.log(err);
  }
});

export default router;
