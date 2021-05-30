import CoinKey from 'coinkey';
import coinInfo from 'coininfo';
import DogeCoin from 'dogecoinjs';
import bitcoin from 'bitcoinjs-lib';

import {
  getBalance,
  getUnspentTx,
  isTxOutputSpent,
  sendTransaction
} from '../../API';

const dogeNetwork = {
  ...coinInfo.dogecoin.test.toBitcoinJS(),
  bip32: {
    private: 0x02fac398,
    public: 0x02facafd
  }
};

export const toSatoshis = (amount) => Math.floor(amount * 100000000);

export async function handleSendDogeCoin({
  receiverAddress,
  dogeCoinsToSend,
  network,
  privateKey,
  sourceAddress
}) {
  try {
    const tx = new bitcoin.TransactionBuilder(dogeNetwork);

    const unspentTx = await getUnspentTx({
      pubAddress: sourceAddress,
      network
    });

    let totalSatoshisAvailable = 0;
    let totalInputs = 0;

    unspentTx.data.txs.forEach((element) => {
      totalSatoshisAvailable += toSatoshis(element.value);
      totalInputs++;

      tx.addInput(element.txid, element.output_no);
    });

    const fee = toSatoshis(1);
    const amountToSatoshis = toSatoshis(dogeCoinsToSend) - fee;
    const changeAmount = totalSatoshisAvailable - amountToSatoshis - fee;

    console.log({ totalSatoshisAvailable, amountToSatoshis, changeAmount });

    if (totalSatoshisAvailable - amountToSatoshis - fee < 0) {
      console.error('Not enough balance to cover transaction'.red);
      return;
    }

    // Add the output (who to pay to):
    // [payee's address, amount in satoshis]
    tx.addOutput(receiverAddress, amountToSatoshis);

    // Send left over amount back to sender address
    if (changeAmount > 0) {
      tx.addOutput(sourceAddress, changeAmount);
    }

    const keyPair = bitcoin.ECPair.fromWIF(privateKey, dogeNetwork);

    for (let i = 0; i < totalInputs; i++) {
      tx.sign(i, keyPair);
    }

    const txHex = tx.build().toHex();

    const send = await sendTransaction({
      txHex,
      network
    });

    console.log({ send });

    return send;
  } catch (err) {
    console.log(err);
  }
}
