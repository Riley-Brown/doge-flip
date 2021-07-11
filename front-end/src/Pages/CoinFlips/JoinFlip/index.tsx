import { useEffect, useState } from 'react';
import SweetAlert from 'react-bootstrap-sweetalert';
import { SweetAlertType } from 'react-bootstrap-sweetalert/dist/types';
import { useDispatch } from 'react-redux';

import SpinnerButton from 'Components/SpinnerButton';
import Portal from 'Components/Portal';

import { useTypedSelector } from 'Reducers';
import { updateAccount } from 'Actions';
import { joinCoinFlip } from 'API';
import { CoinFlipTypes } from '../CoinFlip';

export default function JoinFlip({ coinFlip }: { coinFlip: CoinFlipTypes }) {
  const [show, setShow] = useState(false);
  const [errorType, setErrorType] = useState<
    'balanceError' | 'joinError' | 'walletError'
  >();

  const dispatch = useDispatch();

  const account = useTypedSelector((state) => state.account);

  const [type, setType] = useState<SweetAlertType>('info');
  const [loading, setLoading] = useState(false);

  const handleJoinFlip = async () => {
    setLoading(true);

    if (account.balance < coinFlip.dogeAmount) {
      setType('error');
      setErrorType('balanceError');
      setLoading(false);
      return;
    }

    const join = await joinCoinFlip({
      coinFlipId: coinFlip._id
    });

    if (join.type === 'ok') {
      setType('success');
      dispatch(updateAccount({ balance: join.data.balance }));
      setTimeout(() => setShow(false), 1000);
    } else {
      setType('error');
    }

    setLoading(false);
  };

  const handleResetState = () => {
    setType('info');
    setLoading(false);
    setErrorType(undefined);
  };

  useEffect(() => {
    handleResetState();
  }, [show]);

  return (
    <>
      <button onClick={() => setShow(true)} className="btn join">
        Join flip
      </button>
      {show && (
        <Portal id="join-flip-portal">
          <SweetAlert
            title={
              errorType === 'balanceError'
                ? 'Insufficient balance'
                : 'Join this flip'
            }
            onConfirm={() => null}
            showCancel={false}
            showConfirm={false}
            type={type}
            onCancel={() => setShow(false)}
            show={show}
            cancelBtnStyle={{ minWidth: '100px' }}
            confirmBtnStyle={{
              borderColor: 'var(--primary)',
              minWidth: '100px',
              textDecoration: 'none'
            }}
          >
            {errorType === 'balanceError' ? (
              <p>Not enough balance to enter this flip</p>
            ) : (
              <p>
                Joining this flip will deduct{' '}
                {coinFlip.dogeAmount.toLocaleString()} doge from your balance
              </p>
            )}
            <div style={{ marginTop: 40 }}>
              <button
                style={{
                  minWidth: '150px',
                  padding: 10
                }}
                className="btn"
                onClick={() => setShow(false)}
              >
                Cancel
              </button>
              <SpinnerButton
                spinnerProps={{ style: { width: '1rem', height: '1rem' } }}
                onClick={handleJoinFlip}
                className="btn"
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  minWidth: '150px',
                  maxHeight: 46,
                  padding: 10
                }}
                loading={loading}
              >
                Join flip
              </SpinnerButton>
            </div>
          </SweetAlert>
        </Portal>
      )}
    </>
  );
}
