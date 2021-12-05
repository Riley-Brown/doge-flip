import fetch from 'node-fetch';
import { DOGE_NETWORK } from './root';

export async function getBalance(pubAddress: string) {
  const res = await fetch(
    `https://sochain.com/api/v2/get_address_balance/${DOGE_NETWORK}/${pubAddress}`
  );
  const json = await res.json();
  return json;
}

export async function getUnspentTx(pubAddress: string) {
  const res = await fetch(
    `https://sochain.com/api/v2/get_tx_unspent/${DOGE_NETWORK}/${pubAddress}`
  );
  const json = await res.json();
  return json;
}

export async function isTxOutputSpent({
  txId,
  outputNo,
}: {
  txId: string;
  outputNo: number;
}) {
  const res = await fetch(
    `https://sochain.com/api/v2/is_tx_spent/${DOGE_NETWORK}/${txId}/${outputNo}`
  );
  const json = await res.json();
  return json;
}
