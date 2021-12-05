import { body } from 'express-validator';

export const CreateFlipValidator = [
  body('dogeAmount').isInt({ min: 1 }),
  body('side')
    .isString()
    .custom((value) => value === 'heads' || value === 'tails'),
  body('isPrivateLobby').isBoolean().withMessage('Invalid parameters')
];

export const JoinFlipValidator = [
  body('coinFlipId').isString(),
  body('privateLobbyId').optional().isString()
];
