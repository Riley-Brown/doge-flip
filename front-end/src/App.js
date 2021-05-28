import { Switch, Route } from 'react-router-dom';

import './App.css';

import dogeLogo from 'Assets/doge-logo.png';

import CoinFlips from 'Pages/CoinFlips';

function App() {
  return (
    <div className="App">
      <div>
        <img style={{ width: 500 }} src={dogeLogo} alt="" />
        <h1>Wow much website</h1>
      </div>
      <h1>Very style</h1>
      <Switch>
        <Route path="/" component={CoinFlips} />
      </Switch>
    </div>
  );
}

export default App;
