import fetch from 'node-fetch';

export async function sendTransaction({ txHex, network }) {
  const res = await fetch(`https://sochain.com/api/v2/send_tx/${network}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tx_hex: txHex })
  });

  const json = await res.json();
  return json;
}
