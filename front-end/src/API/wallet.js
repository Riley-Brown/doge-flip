import { API_ROOT } from './root';

export async function createWallet() {
  const res = await fetch(`${API_ROOT}/wallet/create`);
  const json = await res.json();
  return json;
}

export async function updateWallet({ publicAddress, displayName }) {
  const res = await fetch(`${API_ROOT}/wallet/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ publicAddress, displayName })
  });
  const json = await res.json();
  return json;
}

export async function getWalletData(publicAddress) {
  const res = await fetch(`${API_ROOT}/wallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ publicAddress })
  });

  const json = await res.json();
  return json;
}

export async function syncWalletData(publicAddress) {
  const res = await fetch(`${API_ROOT}/wallet/sync-wallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ publicAddress })
  });

  const json = await res.json();
  return json;
}
