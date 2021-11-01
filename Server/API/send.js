import fetch from 'node-fetch';
import { DOGE_NETWORK } from './root';

export async function sendTransaction({ txHex }) {
  const res = await fetch(
    `https://sochain.com/api/v2/send_tx/${DOGE_NETWORK}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tx_hex: txHex }),
    }
  );

  const json = await res.json();
  return json;
}
