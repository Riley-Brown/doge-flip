import { body } from 'express-validator';

export const RecoverWalletValidator = [
  body('publicAddress').isString(),
  body('recoveryKey').isString()
];
