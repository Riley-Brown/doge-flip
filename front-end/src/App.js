import { Switch, Route } from 'react-router-dom';
import { ToastProvider } from 'react-toast-notifications';

import './App.css';

import CoinFlips from 'Pages/CoinFlips';

function App() {
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
