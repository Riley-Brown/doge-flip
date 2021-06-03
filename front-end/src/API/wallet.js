import { API_ROOT } from './root';

export async function updateWallet({ displayName }) {
  const res = await fetch(`${API_ROOT}/wallet/update`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ displayName })
  });
  const json = await res.json();
  return json;
}

export async function getWalletData() {
  const res = await fetch(`${API_ROOT}/wallet`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const json = await res.json();
  return json;
}

export async function syncWalletData() {
  const res = await fetch(`${API_ROOT}/wallet/sync-wallet`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const json = await res.json();
  return json;
}
