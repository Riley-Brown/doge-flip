import { useEffect, useState } from 'react';
import { useToasts } from 'react-toast-notifications';
import { useDispatch } from 'react-redux';
import Moment from 'react-moment';

import './CoinFlips.scss';

import dogeLogoHeads from 'Assets/doge-logo-heads.png';
import dogeLogoTails from 'Assets/doge-logo-tails.png';
import dogeLogo from 'Assets/doge-logo.png';

import { API_ROOT, getActiveCoinFlips } from 'API';
import { useTypedSelector } from 'Reducers';
import { updateAccount } from 'Actions';

import Deposit from 'Components/Deposit';

import CreateFlip from './CreateFlip';
import JoinFlip from './JoinFlip';

export default function CoinFlips() {
  const [activeCoinFlips, setActiveCoinFlips] = useState([]);
  const [loading, setLoading] = useState(true);

  const account = useTypedSelector((state) => state.account);
  const dispatch = useDispatch();

  const { addToast } = useToasts();

  useEffect(() => {
    getActiveCoinFlips().then((res) => {
      const activeCoinFlips = res.data.reverse();
      console.log(account);
      setActiveCoinFlips(activeCoinFlips);
      setLoading(false);

      const handleCoinFlipEvents = (message) => {
        console.log(activeCoinFlips);

        console.log(message);
        console.log(JSON.parse(message.data));
        const parsedData = JSON.parse(message.data);

        if (
          parsedData.eventType === 'inProgress' ||
          parsedData.eventType === 'finished'
        ) {
          const filteredCoinFlips = activeCoinFlips.filter(
            (flip) => flip._id !== parsedData._id
          );
          setActiveCoinFlips([parsedData, ...filteredCoinFlips]);
        }

        if (
          parsedData.eventType === 'finished' &&
          parsedData.winnerId === account.userId
        ) {
          dispatch(
            updateAccount({
              balance: account.balance + parsedData.winningAmount
            })
          );

          addToast(
            <h2>
              You just won {parsedData.winningAmount} doge coin! Congrats!
            </h2>,
            {
              appearance: 'success',
              autoDismiss: true
            }
          );
        }
      };

      const events = new EventSource(`${API_ROOT}/coin-flips/events`);

      events.addEventListener('message', handleCoinFlipEvents);
    });
  }, []);

  return (
    <div id="coin-flips" style={{ margin: 'auto', padding: '50px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Deposit />
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
            <div className="coin-flip">
              <div className="flip-info">
                <div className="amount-date">
                  <h3>Doge amount: {flip.dogeAmount}</h3>
                  <h3>Selected side: {flip.creatorSide}</h3>
                  <h3>
                    Created{' '}
                    <Moment fromNow={true} unix={true}>
                      {flip.createdAt}
                    </Moment>
                  </h3>
                </div>
                <div
                  className="sides-logo-wrapper"
                  data-winner={
                    flip.status === 'finished' &&
                    flip.winningSide === flip.creatorSide
                  }
                  data-loser={
                    flip.status === 'finished' &&
                    flip.winningSide !== flip.creatorSide
                  }
                >
                  <img
                    src={
                      flip.creatorSide === 'heads'
                        ? dogeLogoHeads
                        : dogeLogoTails
                    }
                    alt={flip.creatorSide}
                  />
                </div>
              </div>
              {flip.status !== 'active' && (
                <div
                  className="sides-logo-wrapper"
                  data-winner={
                    flip.status === 'finished' &&
                    flip.winningSide === flip.joinedUserSide
                  }
                  data-loser={
                    flip.status === 'finished' &&
                    flip.winningSide !== flip.joinedUserSide
                  }
                >
                  <img
                    src={
                      flip.joinedUserSide === 'heads'
                        ? dogeLogoHeads
                        : dogeLogoTails
                    }
                    alt={flip.joinedUserSide}
                  />
                </div>
              )}
              {flip.status === 'active' && <JoinFlip flip={flip} />}
              {flip.status === 'inProgress' && (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ marginBottom: 10 }}>
                      Flip starting in {flip.startingIn} seconds!
                    </p>
                  </div>
                </>
              )}
              {flip.status === 'finished' && (
                <div style={{ textAlign: 'center' }}>
                  <p>Winning side: {flip.winningSide}</p>
                  <p>Winning number: {flip.float}</p>
                  <p>Winner amount: {flip.winningAmount}</p>
                  <p>Winner id: {flip.winnerId}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
