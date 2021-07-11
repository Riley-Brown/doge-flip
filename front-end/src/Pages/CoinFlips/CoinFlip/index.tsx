import { useEffect, useState } from 'react';
import JoinFlip from '../JoinFlip';

import Moment from 'react-moment';

import dogeLogoHeads from 'Assets/doge-logo-heads.png';
import dogeLogoTails from 'Assets/doge-logo-tails.png';
import { useTypedSelector } from 'Reducers';

import { useToasts } from 'react-toast-notifications';
import { useDispatch } from 'react-redux';
import { updateAccount } from 'Actions';

import RotatingCoin from 'Components/RotatingCoin';
import CloseFlip from '../CloseFlip';

export type FlipSide = 'heads' | 'tails';
export type FlipStatus = 'active' | 'inProgress' | 'flipping' | 'finished';

export type CoinFlipTypes =
  | ActiveTypes
  | InProgressTypes
  | FlippingTypes
  | FinishedTypes
  | ClosedTypes;

type CoinFlipSharedTypes = {
  _id: string;
  createdAt: number;
  createdByDisplayName: string;
  createdByUserId: string;
  creatorSide: FlipSide;
  dogeAmount: number;
};

interface ActiveTypes extends CoinFlipSharedTypes {
  status: 'active';
}

interface InProgressTypes extends CoinFlipSharedTypes {
  joinedByDisplayName: string;
  joinedUserId: string;
  joinedUserSide: FlipSide;
  startingIn: number;
  status: 'inProgress';
}

interface FlippingTypes extends CoinFlipSharedTypes {
  status: 'flipping';
  joinedByDisplayName: string;
  winningSide: FlipSide;
}

interface ClosedTypes extends CoinFlipSharedTypes {
  status: 'closed';
  joinedByDisplayName: '';
}

interface FinishedTypes extends CoinFlipSharedTypes {
  float: number;
  joinedByDisplayName: string;
  joinedUserId: string;
  joinedUserSide: FlipSide;
  status: 'finished';
  winnerDisplayName: string;
  winnerId: string;
  winningAmount: number;
  winningSide: FlipSide;
}

export default function CoinFlip({
  coinFlip,
  coinFlipEvent
}: {
  coinFlip: CoinFlipTypes;
  coinFlipEvent: CoinFlipTypes;
}) {
  const [coinFlipState, setCoinFlipState] = useState(coinFlip);
  const account = useTypedSelector((state) => state.account);

  const { addToast } = useToasts();
  const dispatch = useDispatch();

  useEffect(() => {
    if (coinFlipEvent) {
      if (
        coinFlipEvent.status === 'finished' &&
        coinFlipEvent.winnerId === account.userId
      ) {
        addToast(
          <h2 style={{ marginTop: 0 }}>
            Congratulations! You just won {coinFlipEvent.winningAmount} doge
            coin
          </h2>,
          { appearance: 'success', autoDismiss: true }
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

  if (coinFlipState.status === 'closed') {
    return null;
  }

  return (
    <div className="coin-flip">
      <div className="flip-info">
        <div className="amount-date">
          <h3>Doge amount: {coinFlipState.dogeAmount.toLocaleString()}</h3>
          <h3>
            Created{' '}
            <Moment fromNow={true} unix={true}>
              {coinFlipState.createdAt}
            </Moment>
          </h3>
          {coinFlipState.status === 'active' &&
            coinFlipState.createdByUserId === account.userId && (
              <CloseFlip coinFlip={coinFlip} />
            )}
        </div>
      </div>
      <div className="sides-wrapper">
        <div
          className="side"
          data-winner={
            coinFlipState.status === 'finished' &&
            coinFlipState.winningSide === coinFlipState.creatorSide
          }
          data-loser={
            coinFlipState.status === 'finished' &&
            coinFlipState.winningSide !== coinFlipState.creatorSide
          }
        >
          <h4
            style={{
              fontWeight: 400,
              margin: 0,
              textAlign: 'center',
              marginBottom: 10
            }}
          >
            {coinFlipState.createdByDisplayName}
          </h4>
          <img
            src={
              coinFlipState.creatorSide === 'heads'
                ? dogeLogoHeads
                : dogeLogoTails
            }
            alt={coinFlipState.creatorSide}
          />
        </div>
        <div className="vs-wrapper">
          {coinFlipState.status === 'active' && 'vs'}
          {coinFlipState.status === 'inProgress' &&
            `flipping in ${coinFlipState.startingIn} seconds`}
          {coinFlipState.status === 'flipping' && (
            <RotatingCoin winningSide={coinFlipState.winningSide} />
          )}
          {coinFlipState.status === 'finished' && (
            <div className="finished-result">
              <p>Winning side: {coinFlipState.winningSide}</p>
              <p>Winning number: {coinFlipState.float}</p>
              <p>
                Winner amount: {coinFlipState.winningAmount.toLocaleString()}
              </p>
              <p className="winner">
                Winner: {coinFlipState.winnerDisplayName}
              </p>
            </div>
          )}
        </div>
        <div
          className="side"
          data-winner={
            coinFlipState.status === 'finished' &&
            coinFlipState.winningSide === coinFlipState.joinedUserSide
          }
          data-loser={
            coinFlipState.status === 'finished' &&
            coinFlipState.winningSide !== coinFlipState.joinedUserSide
          }
        >
          <h4
            style={{
              fontWeight: 400,
              margin: 0,
              textAlign: 'center',
              marginBottom: 10
            }}
          >
            {coinFlipState.status === 'active'
              ? 'Waiting for player...'
              : coinFlipState.joinedByDisplayName}
          </h4>
          <img
            src={
              coinFlipState.creatorSide === 'heads'
                ? dogeLogoTails
                : dogeLogoHeads
            }
          />
        </div>
      </div>
      {coinFlipState.status === 'active' && (
        <JoinFlip coinFlip={coinFlipState} />
      )}
    </div>
  );
}
