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

export type FlipSide = 'heads' | 'tails';
export type FlipStatus = 'active' | 'inProgress' | 'flipping' | 'finished';

export type CoinFlipTypes =
  | ActiveTypes
  | InProgressTypes
  | FlippingTypes
  | FinishedTypes;

type CoinFlipSharedTypes = {
  _id: string;
  createdAt: number;
  createdByDisplayName: string;
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
          <h2>
            Congratulations! You just won {coinFlipEvent.winningAmount} doge
            coin
          </h2>,
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
          <h3>
            Created{' '}
            <Moment fromNow={true} unix={true}>
              {coinFlipState.createdAt}
            </Moment>
          </h3>
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
        <span
          style={{
            margin: '0 20px',
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {coinFlipState.status === 'active' && 'vs'}
          {coinFlipState.status === 'inProgress' &&
            `flipping in ${coinFlipState.startingIn} seconds`}
          {coinFlipState.status === 'flipping' && (
            <RotatingCoin winningSide={coinFlipState.winningSide} />
          )}
          {coinFlipState.status === 'finished' && (
            <div>
              <p>Winning side: {coinFlipState.winningSide}</p>
              <p>Winning number: {coinFlipState.float}</p>
              <p>Winner amount: {coinFlipState.winningAmount}</p>
              <p>Winner: {coinFlipState.winnerDisplayName}</p>
            </div>
          )}
        </span>

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
