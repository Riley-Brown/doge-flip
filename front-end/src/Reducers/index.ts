import { combineReducers, Action } from 'redux';

import account from './account';

import { useSelector, TypedUseSelectorHook } from 'react-redux';

const reducers = combineReducers({
  account
});

export type RootState = ReturnType<typeof reducers>;

// Provides same functionality as useSelector hook
// without needing to type state pram every time
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;

export default function mainReducer(
  state: RootState | undefined,
  action: Action
) {
  // Reset state to initial state on logout
  if (action.type === 'LOGOUT') {
    state = undefined;
  }

  return reducers(state, action);
}
