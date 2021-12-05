import { handleCreateUserToken } from '../../Auth';
import coinInfo from 'coininfo';
import CoinKey from 'coinkey';
import { v4 as uuid } from 'uuid';

import { APP_MODE, DOGE_NETWORK } from '../../API';
import { getWalletsCollection } from '../../DB';

export function handlePendingDeposits(unspentTx) {
  const pendingDeposits = [];

  let totalUnspentValue = 0;

  unspentTx.data.txs.forEach((element) => {
    // prob would want to make sure there's more than 1 confirmation using real net
    if (element.confirmations > 0) {
      totalUnspentValue += Number(element.value);
    } else {
      pendingDeposits.push({ value: element.value, txId: element.txid });
    }
  });

  return { totalUnspentValue, pendingDeposits };
}

export async function handleCreateWallet(res) {
  const dogeNet = APP_MODE === 'live' ? 'DOGE' : 'DOGE-TEST';
  const dogeVersions = coinInfo(dogeNet).versions;
  const key = new CoinKey.createRandom(dogeVersions);

  const userId = uuid();

  handleCreateUserToken({ userId, publicAddress: key.publicAddress, res });

  const walletsCollection = getWalletsCollection();

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
