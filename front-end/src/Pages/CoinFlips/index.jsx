import { useEffect, useState } from 'react';

import './CoinFlips.scss';

import dogeLogo from 'Assets/doge-logo.png';

import { API_ROOT, getActiveCoinFlips } from 'API';
import { useTypedSelector } from 'Reducers';

import Deposit from 'Components/Deposit';
import RotatingCoin from 'Components/RotatingCoin';

import CreateFlip from './CreateFlip';
import CoinFlip from './CoinFlip';

export default function CoinFlips() {
  const [activeCoinFlips, setActiveCoinFlips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [coinFlipsEvents, setCoinFlipsEvents] = useState({});

  useEffect(() => {
    getActiveCoinFlips().then((res) => {
      const activeCoinFlips = res.data.reverse();
      setActiveCoinFlips(activeCoinFlips);
      setLoading(false);

      const events = new EventSource(`${API_ROOT}/coin-flips/events`);

      events.addEventListener('message', (message) => {
        const parsedData = JSON.parse(message.data);
        console.log({ parsedData });

        if (parsedData.eventType === 'coinFlipCreated') {
          setActiveCoinFlips((prev) => [parsedData, ...prev]);
        } else {
          setCoinFlipsEvents((prev) => ({
            ...prev,
            [parsedData._id]: parsedData
          }));
        }
      });
    });
  }, []);

  return (
    <div id="coin-flips" style={{ margin: 'auto', padding: '50px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Deposit />
        <RotatingCoin />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img style={{ width: 200, marginRight: 20 }} src={dogeLogo} alt="" />
          <div>
            <h1>Wow much website</h1>
            <h1>Very style</h1>
          </div>
        </div>
      </div>
      <div style={{ margin: 'auto', marginTop: '50px', maxWidth: 900 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            textAlign: 'center',
            justifyContent: 'center',
            marginBottom: 20
          }}
        >
          <h2>Active coin flips</h2>
          <CreateFlip setActiveCoinFlips={setActiveCoinFlips} />
        </div>
        {loading && <p>Loading coin flips...</p>}
        {!loading && activeCoinFlips.length === 0 ? (
          <p style={{ textAlign: 'center' }}>
            There are currently 0 active coin flips. Create the first flip for
            others to see!
          </p>
        ) : (
          activeCoinFlips.map((flip) => (
            <CoinFlip
              key={flip._id}
              coinFlipEvent={coinFlipsEvents[flip._id]}
              coinFlip={flip}
            />
          ))
        )}
      </div>
    </div>
  );
}
