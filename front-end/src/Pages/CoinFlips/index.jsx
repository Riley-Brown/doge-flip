import { useEffect, useRef, useState } from 'react';

import './CoinFlips.scss';

import { API_ROOT, getActiveCoinFlips } from 'API';

import Deposit from 'Components/Deposit';

import CreateFlip from './CreateFlip';
import CoinFlip from './CoinFlip';
import Chat from 'Components/Chat';
import PrivateLobby from 'Components/PrivateLobby';
import SpinnerButton from 'Components/SpinnerButton';

export default function CoinFlips() {
  const [activeCoinFlips, setActiveCoinFlips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const pagination = useRef(0);

  const [coinFlipsEvents, setCoinFlipsEvents] = useState({});

  useEffect(() => {
    getCoinFlips().then(() => {
      const events = new EventSource(`${API_ROOT}/coin-flips/events`);

      events.addEventListener('message', (message) => {
        const parsedData = JSON.parse(message.data);
        console.log({ parsedData });

        switch (parsedData.eventType) {
          case 'coinFlipCreated':
            setActiveCoinFlips((prev) => [parsedData, ...prev]);
            break;
          default:
            setCoinFlipsEvents((prev) => ({
              ...prev,
              [parsedData._id]: parsedData
            }));
        }
      });
    });
  }, []);

  const getCoinFlips = async ({ page, concat } = {}) => {
    setLoadingMore(true);

    const res = await getActiveCoinFlips(page);

    if (res.data.length < 50) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }

    if (concat) {
      setActiveCoinFlips((prev) => prev.concat(res.data));
    } else {
      setActiveCoinFlips(res.data);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  return (
    <>
      <div id="coin-flips">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ flex: '2.5' }}>
            <Deposit />
            <div className="coin-flips-wrapper">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  textAlign: 'center',
                  justifyContent: 'center',
                  marginBottom: 20
                }}
              >
                <h2 style={{ color: 'var(--main-font-color)' }}>
                  Active coin flips
                </h2>
                <CreateFlip setActiveCoinFlips={setActiveCoinFlips} />
              </div>
              {loading && <p>Loading coin flips...</p>}
              {!loading && activeCoinFlips.length === 0 ? (
                <p style={{ textAlign: 'center' }}>
                  There are currently 0 active coin flips. Create the first flip
                  for others to see!
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
              {hasMore && (
                <SpinnerButton
                  className="btn primary load-more-btn"
                  onClick={() => {
                    pagination.current = pagination.current + 1;
                    getCoinFlips({ page: pagination.current, concat: true });
                  }}
                  loading={loadingMore}
                >
                  Load More
                </SpinnerButton>
              )}
            </div>
          </div>
          <Chat />
        </div>
      </div>
      <PrivateLobby coinFlipEvents={coinFlipsEvents} />
    </>
  );
}
