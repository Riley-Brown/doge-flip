import { API_ROOT } from './root';

export async function withdrawBalance({
  dogeCoinsToSend,
  receiverAddress
}: {
  dogeCoinsToSend: number;
  receiverAddress: string;
}) {
  const res = await fetch(`${API_ROOT}/transactions/withdraw`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ dogeCoinsToSend, receiverAddress })
  });

  const json = await res.json();
  return json;
}
