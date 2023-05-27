import { createStore, applyMiddleware, compose, Store } from 'redux';
import logger from 'redux-logger';

import reducers from 'Reducers';

const  NODE_ENV = import.meta.env.NODE_ENV;

let store: Store;
let middleware: any[] = [];

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
    Cypress: object;
    store?: Store;
  }
}

if (NODE_ENV === 'development') {
  middleware.push(logger);

  const composeEnhancers =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  store = createStore(
    reducers,
    composeEnhancers(applyMiddleware(...middleware))
  );
} else {
  store = createStore(reducers, compose(applyMiddleware(...middleware)));
}

export default store;
