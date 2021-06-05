import { API_ROOT } from './root';

export async function getActiveCoinFlips() {
  const res = await fetch(`${API_ROOT}/coin-flips/active`);
  const json = await res.json();
  return json;
}

export async function createCoinFlip({ dogeAmount, side }) {
  const res = await fetch(`${API_ROOT}/coin-flips/create`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dogeAmount, side })
  });

  const json = await res.json();
  return json;
}

export async function joinCoinFlip({ coinFlipId }) {
  const res = await fetch(`${API_ROOT}/coin-flips/join`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coinFlipId })
  });

  const json = await res.json();
  return json;
}
