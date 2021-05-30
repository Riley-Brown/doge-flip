import { useState } from 'react';
import SweetAlert from 'react-bootstrap-sweetalert';
import { SweetAlertType } from 'react-bootstrap-sweetalert/dist/types';
import { useDispatch } from 'react-redux';

import SpinnerButton from 'Components/SpinnerButton';
import Portal from 'Components/Portal';

import { useTypedSelector } from 'Reducers';
import { updateAccount } from 'Actions';
import { joinCoinFlip } from 'API';

export default function JoinFlip({ flip }: { flip: any }) {
  const [show, setShow] = useState(false);
  const [errorType, setErrorType] =
    useState<'balanceError' | 'joinError' | 'walletError'>();

  const dispatch = useDispatch();

  const account = useTypedSelector((state) => state.account);

  const [type, setType] = useState<SweetAlertType>('info');
  const [loading, setLoading] = useState(false);

  const handleJoinFlip = async () => {
    setLoading(true);

    if (account.balance < flip.dogeAmount) {
      setType('error');
      setErrorType('balanceError');
      return;
    }

    const join = await joinCoinFlip({
      userId: account.userId,
      coinFlipId: flip._id
    });

    if (join.type === 'ok') {
      setType('success');
      dispatch(updateAccount({ balance: join.data.balance }));
    } else {
      setType('error');
    }

    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setShow(true)} className="btn join">
        Join flip
      </button>
      <Portal id="join-flip-portal">
        <SweetAlert
          title="Join this flip"
          onConfirm={handleJoinFlip}
          customButtons={
            <div>
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
          }
          showCancel={true}
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
          <p>
            Joining this flip will deduct {flip.dogeAmount} doge from your
            balance
          </p>
        </SweetAlert>
      </Portal>
    </>
  );
}
