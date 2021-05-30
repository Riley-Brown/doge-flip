import { API_ROOT } from './root';

export async function getActiveCoinFlips() {
  const res = await fetch(`${API_ROOT}/coin-flips/active`);
  const json = await res.json();
  return json;
}

export async function createCoinFlip({ dogeAmount, userId, side }) {
  const res = await fetch(`${API_ROOT}/coin-flips/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dogeAmount, userId, side })
  });

  const json = await res.json();
  return json;
}

export async function joinCoinFlip({ userId, coinFlipId }) {
  const res = await fetch(`${API_ROOT}/coin-flips/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, coinFlipId })
  });

  const json = await res.json();
  return json;
}
