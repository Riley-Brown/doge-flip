import fetch from 'node-fetch';
import { APP_MODE, DOGE_NETWORK } from './root.js';

console.log(APP_MODE);

export async function getBalance({ pubAddress, network }) {
  const res = await fetch(
    `https://sochain.com/api/v2/get_address_balance/${network}/${pubAddress}`
  );
  const json = await res.json();
  return json;
}

export async function getUnspentTx({ pubAddress, network }) {
  const res = await fetch(
    `https://sochain.com/api/v2/get_tx_unspent/${network}/${pubAddress}`
  );
  const json = await res.json();
  return json;
}

export async function isTxOutputSpent({ txId, network, outputNo }) {
  const res = await fetch(
    `https://sochain.com/api/v2/is_tx_spent/${network}/${txId}/${outputNo}`
  );
  const json = await res.json();
  return json;
}
