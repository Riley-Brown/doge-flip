import { useState } from 'react';
import SweetAlert from 'react-bootstrap-sweetalert';
import { SweetAlertType } from 'react-bootstrap-sweetalert/dist/types';
import Moment from 'react-moment';
import { useDispatch } from 'react-redux';
import { useToasts } from 'react-toast-notifications';

import { updateAccount } from 'Actions';
import { closeCoinFlip } from 'API';

import Portal from 'Components/Portal';
import SpinnerButton from 'Components/SpinnerButton';

import { CoinFlipTypes } from '../CoinFlip';

export default function CloseFlip({ coinFlip }: { coinFlip: CoinFlipTypes }) {
  const [show, setShow] = useState(false);

  const [type, setType] = useState<SweetAlertType>('warning');

  const dispatch = useDispatch();

  const { addToast } = useToasts();

  const handleConfirm = async () => {
    setLoading(true);

    try {
      const close = await closeCoinFlip(coinFlip);
      if (close.type === 'ok') {
        dispatch(updateAccount({ balance: close.data.balance }));
        addToast(
          <h2 style={{ marginTop: 0 }}>Coin flip successfully closed</h2>,
          {
            appearance: 'success',
            autoDismiss: true
          }
        );
      } else {
        setLoading(false);
        setType('error');
        addToast(
          <h2 style={{ marginTop: 0 }}>Unable to close in-progress flip</h2>,
          {
            appearance: 'error',
            autoDismiss: true
          }
        );
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  const [loading, setLoading] = useState(false);

  return (
    <>
      <Portal id="close-flip-portal">
        <SweetAlert
          title={type === 'error' ? 'Error closing flip' : 'Are you sure?'}
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
          {type === 'warning' && (
            <>
              <p>
                This action will close your coin flip created{' '}
                <Moment fromNow={true} unix={true}>
                  {coinFlip.createdAt}
                </Moment>{' '}
                and refund {coinFlip.dogeAmount.toLocaleString()} to your
                balance
              </p>

              <div style={{ marginTop: 40 }}>
                <button
                  onClick={() => setShow(false)}
                  style={{
                    minWidth: '150px',
                    padding: 10
                  }}
                  className="btn"
                >
                  Cancel
                </button>
                <SpinnerButton
                  onClick={handleConfirm}
                  loading={loading}
                  style={{
                    minWidth: '150px',
                    padding: 10
                  }}
                  className="btn primary"
                >
                  Close Flip
                </SpinnerButton>
              </div>
            </>
          )}

          {type === 'error' && (
            <>
              <p>
                Whoops, something went wrong closing this flip. Try again later
              </p>

              <div style={{ marginTop: 40 }}>
                <button
                  onClick={() => setShow(false)}
                  style={{
                    minWidth: '150px',
                    padding: 10
                  }}
                  className="btn"
                >
                  Cancel
                </button>
                <SpinnerButton
                  onClick={handleConfirm}
                  loading={loading}
                  style={{
                    minWidth: '150px',
                    padding: 10
                  }}
                  className="btn primary"
                >
                  Try again
                </SpinnerButton>
              </div>
            </>
          )}
        </SweetAlert>
      </Portal>
      <button
        onClick={() => setShow(true)}
        className="btn danger"
        style={{ marginTop: 10 }}
      >
        Close coin flip
      </button>
    </>
  );
}
