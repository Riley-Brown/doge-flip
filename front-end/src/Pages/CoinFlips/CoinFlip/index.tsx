import { useEffect, useState } from 'react';
import JoinFlip from '../JoinFlip';

import Moment from 'react-moment';

import dogeLogoHeads from 'Assets/doge-logo-heads.png';
import dogeLogoTails from 'Assets/doge-logo-tails.png';
import { useTypedSelector } from 'Reducers';

import { useToasts } from 'react-toast-notifications';
import { useDispatch } from 'react-redux';
import { updateAccount } from 'Actions';

export type FlipSide = 'heads' | 'tails';
export type FlipStatus = 'active' | 'inProgress' | 'finished';

export type CoinFlipTypes = ActiveTypes | InProgressTypes | FinishedTypes;

type CoinFlipSharedTypes = {
  _id: string;
  createdAt: number;
  creatorSide: FlipSide;
  dogeAmount: number;
};

interface ActiveTypes extends CoinFlipSharedTypes {
  status: 'active';
}

interface InProgressTypes extends CoinFlipSharedTypes {
  status: 'inProgress';
  startingIn: number;
  joinedUserId: string;
  joinedUserSide: FlipSide;
}

interface FinishedTypes extends CoinFlipSharedTypes {
  winnerId: string;
  winningAmount: number;
  winningSide: FlipSide;
  joinedUserId: string;
  joinedUserSide: FlipSide;
  float: number;
  status: 'finished';
}

export default function CoinFlip({
  coinFlip,
  coinFlipEvent
}: {
  coinFlip: CoinFlipTypes;
  coinFlipEvent: InProgressTypes | FinishedTypes;
}) {
  const [coinFlipState, setCoinFlipState] = useState(coinFlip);
  const account = useTypedSelector((state) => state.account);

  const { addToast } = useToasts();
  const dispatch = useDispatch();

  useEffect(() => {
    console.log({ coinFlipEvent, coinFlipState, account });
    if (coinFlipEvent) {
      if (
        coinFlipEvent.status === 'finished' &&
        coinFlipEvent.winnerId === account.userId
      ) {
        addToast(
          <h2>Congratulations! You just won {coinFlipEvent.winningAmount}</h2>,
          { appearance: 'success' }
        );

        dispatch(
          updateAccount({
            balance: account.balance + coinFlipEvent.winningAmount
          })
        );
      }
      setCoinFlipState({ ...coinFlipState, ...coinFlipEvent });
    }
  }, [coinFlipEvent]);

  return (
    <div className="coin-flip">
      <div className="flip-info">
        <div className="amount-date">
          <h3>Doge amount: {coinFlipState.dogeAmount}</h3>
          <h3>Selected side: {coinFlipState.creatorSide}</h3>
          <h3>
            Created{' '}
            <Moment fromNow={true} unix={true}>
              {coinFlipState.createdAt}
            </Moment>
          </h3>
        </div>
        <div
          className="sides-logo-wrapper"
          data-winner={
            coinFlipState.status === 'finished' &&
            coinFlipState.winningSide === coinFlipState.creatorSide
          }
          data-loser={
            coinFlipState.status === 'finished' &&
            coinFlipState.winningSide !== coinFlipState.creatorSide
          }
        >
          <img
            src={
              coinFlipState.creatorSide === 'heads'
                ? dogeLogoHeads
                : dogeLogoTails
            }
            alt={coinFlipState.creatorSide}
          />
        </div>
      </div>
      {coinFlipState.status !== 'active' && (
        <div
          className="sides-logo-wrapper"
          data-winner={
            coinFlipState.status === 'finished' &&
            coinFlipState.winningSide === coinFlipState.joinedUserSide
          }
          data-loser={
            coinFlipState.status === 'finished' &&
            coinFlipState.winningSide !== coinFlipState.joinedUserSide
          }
        >
          <img
            src={
              coinFlipState.joinedUserSide === 'heads'
                ? dogeLogoHeads
                : dogeLogoTails
            }
            alt={coinFlipState.joinedUserSide}
          />
        </div>
      )}
      {coinFlipState.status === 'active' && (
        <JoinFlip coinFlip={coinFlipState} />
      )}
      {coinFlipState.status === 'inProgress' && (
        <>
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 10 }}>
              coinFlip starting in {coinFlipState.startingIn} seconds!
            </p>
          </div>
        </>
      )}
      {coinFlipState.status === 'finished' && (
        <div style={{ textAlign: 'center' }}>
          <p>Winning side: {coinFlipState.winningSide}</p>
          <p>Winning number: {coinFlipState.float}</p>
          <p>Winner amount: {coinFlipState.winningAmount}</p>
          <p>Winner id: {coinFlipState.winnerId}</p>
        </div>
      )}
    </div>
  );
}
