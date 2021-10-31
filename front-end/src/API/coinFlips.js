import { API_ROOT } from './root';

export async function getActiveCoinFlips() {
  const res = await fetch(`${API_ROOT}/coin-flips/active`);
  const json = await res.json();
  return json;
}

export async function getSingleCoinFlip(coinFlipId) {
  const res = await fetch(`${API_ROOT}/coin-flips/coin-flip/${coinFlipId}`);
  const json = await res.json();
  return json;
}

export async function createCoinFlip({ dogeAmount, side, isPrivateLobby }) {
  const res = await fetch(`${API_ROOT}/coin-flips/create`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dogeAmount, side, isPrivateLobby })
  });

  const json = await res.json();
  return json;
}

export async function joinCoinFlip({ coinFlipId, privateLobbyId }) {
  const res = await fetch(`${API_ROOT}/coin-flips/join`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coinFlipId, privateLobbyId })
  });

  const json = await res.json();
  return json;
}

export async function closeCoinFlip(coinFlip) {
  const res = await fetch(`${API_ROOT}/coin-flips/close`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coinFlip)
  });

  const json = await res.json();
  return json;
}
