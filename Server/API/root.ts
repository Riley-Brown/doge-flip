// export const APP_MODE = process.env.NODE_ENV === 'production' ? 'live' : 'test';
export const APP_MODE = process.env.APP_MODE || 'test';
export const DOGE_NETWORK = APP_MODE === 'live' ? 'DOGE' : 'DOGETEST';
export const BTC_NETWORK = APP_MODE === 'test' ? 'BTCTEST' : 'BTC';
export const MAIN_WALLET_PUBLIC_KEY = process.env.MAIN_WALLET_PUBLIC_KEY as string;
export const MAIN_WALLET_PRIVATE_KEY = process.env.MAIN_WALLET_PRIVATE_KEY as string;
