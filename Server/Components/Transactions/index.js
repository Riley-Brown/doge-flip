import coinInfo from 'coininfo';
import bitcoin from 'bitcoinjs-lib';

import { getUnspentTx, sendTransaction, APP_MODE } from 'API';

let dogeInfo;

if (APP_MODE === 'live') {
  dogeInfo = { ...coinInfo.dogecoin.main.toBitcoinJS() };
} else {
  dogeInfo = { ...coinInfo.dogecoin.test.toBitcoinJS() };
}

const dogeNetwork = {
  ...dogeInfo,
  bip32: {
    private: 0x02fac398,
    public: 0x02facafd,
  },
};

export const toSatoshis = (amount) => Math.floor(amount * 100000000);

export async function handleSendDogeCoin({
  receiverAddress,
  dogeCoinsToSend,
  privateKey,
  sourceAddress,
}) {
  try {
    const tx = new bitcoin.TransactionBuilder(dogeNetwork);

    const unspentTx = await getUnspentTx(sourceAddress);

    let totalSatoshisAvailable = 0;
    let totalInputs = 0;

    const txIdMap = {};

    unspentTx.data.txs.forEach((element) => {
      totalSatoshisAvailable += toSatoshis(element.value);
      totalInputs++;

      if (!txIdMap[element.txid]) {
        txIdMap[element.txid] = true;
        tx.addInput(element.txid, element.output_no);
      }
    });

    const fee = toSatoshis(1);
    const amountToSatoshis = toSatoshis(dogeCoinsToSend) - fee;
    const changeAmount = totalSatoshisAvailable - amountToSatoshis - fee;

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

    const send = await sendTransaction(txHex);

    console.log({ send });

    return send;
  } catch (err) {
    console.log(err);
  }
}
