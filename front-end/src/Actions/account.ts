import * as ACTIONS from 'ActionTypes/account';
import { AccountStateTypes } from 'Reducers/account';

export const setAccount = (payload: AccountStateTypes) => ({
  type: ACTIONS.SET_ACCOUNT,
  payload
});

export const updateAccount = (payload: Partial<AccountStateTypes>) => ({
  type: ACTIONS.UPDATE_ACCOUNT,
  payload
});
