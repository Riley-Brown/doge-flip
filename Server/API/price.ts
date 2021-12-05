import fetch from 'node-fetch';

export async function getDogeBtcPrice() {
  const res = await fetch('https://sochain.com/api/v2/get_price/DOGE/BTC');
  const json = await res.json();

  const binancePrice = json.data.prices.find(
    (price: any) => price.exchange === 'binance'
  );

  return binancePrice;
}

export async function getDogeUsdPrice() {
  const res = await fetch('https://sochain.com//api/v2/get_price/DOGE/USD');
  const json = await res.json();

  const binancePrice = json.data.prices.find(
    (price: any) => price.exchange === 'binance'
  );

  return binancePrice;
}
