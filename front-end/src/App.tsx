import { Switch, Route } from 'react-router-dom';
import { ToastProvider } from 'react-toast-notifications';

import { useLayoutEffect } from 'react';

import './App.scss';

import CoinFlips from 'Pages/CoinFlips';

console.log('test');

const isDarkMode = JSON.parse(localStorage.getItem('darkMode') || 'false');

function App() {
  useLayoutEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  return (
    <ToastProvider placement="top-center">
      <div className="App">
        <Switch>
          <Route path="/" component={CoinFlips} />
        </Switch>
      </div>
    </ToastProvider>
  );
}

export default App;
